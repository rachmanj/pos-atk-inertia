<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\PpobAccount;
use App\Models\User;
use App\Services\ExpenseFundingService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    public function __construct(
        protected ExpenseFundingService $expenseFundingService,
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $categories = $this->expenseCategories();
        $paymentSources = Expense::paymentSourceLabels();

        $request->validate([
            'q'            => 'nullable|string|max:100',
            'category'     => ['nullable', Rule::in(array_keys($categories))],
            'start_date'   => 'nullable|date',
            'end_date'     => 'nullable|date|after_or_equal:start_date',
            'user_id'      => 'nullable|exists:users,id',
        ]);

        $baseQuery = Expense::query();
        $this->applyFilters($baseQuery, $request, $user);

        $expenses = (clone $baseQuery)
            ->with('user:id,name')
            ->withCount('lines')
            ->with('lines:id,expense_id,category')
            ->latest('expense_date')
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        $expenses->through(function (Expense $expense) use ($categories, $paymentSources) {
            $categoryLabels = collect($expense->lines)
                ->pluck('category')
                ->unique()
                ->map(fn (string $category) => $categories[$category] ?? $category)
                ->values()
                ->all();

            return [
                'id'              => $expense->id,
                'code'            => $expense->code,
                'expense_date'    => $expense->expense_date?->toDateString(),
                'amount'          => $expense->amount,
                'note'            => $expense->note,
                'payment_source'  => $expense->payment_source,
                'payment_source_label' => $paymentSources[$expense->payment_source] ?? $expense->payment_source,
                'user'            => $expense->user,
                'lines_count'     => $expense->lines_count,
                'category_labels' => $categoryLabels,
            ];
        });

        $summaryQuery = clone $baseQuery;

        return Inertia::render('Account/Expenses/Index', [
            'expenses' => $expenses,
            'summary' => [
                'total_expenses' => (clone $summaryQuery)->count(),
                'total_amount'   => (int) (clone $summaryQuery)->sum('amount'),
            ],
            'filters' => [
                'q'          => $request->q ?? '',
                'category'   => $request->category ?? '',
                'start_date' => $request->start_date ?? '',
                'end_date'   => $request->end_date ?? '',
                'user_id'    => $request->user_id ?? '',
            ],
            'categories' => $this->formatCategories($categories),
            'users' => $user->isAdminUser()
                ? User::query()->orderBy('name')->get(['id', 'name'])
                : [],
            'isAdmin' => $user->isAdminUser(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Account/Expenses/Create', [
            'categories' => $this->formatCategories($this->expenseCategories()),
            'defaultExpenseDate' => now()->toDateString(),
            'paymentSources' => $this->formatPaymentSources(),
            'ppobAccounts' => $this->ppobAccountsForForm(),
        ]);
    }

    public function store(Request $request)
    {
        $categories = $this->expenseCategories();

        $validated = $request->validate([
            'expense_date'       => 'required|date',
            'note'               => 'nullable|string|max:1000',
            'payment_source'     => ['required', Rule::in(array_keys(Expense::paymentSourceLabels()))],
            'ppob_account_id'    => [
                'nullable',
                'required_if:payment_source,ppob',
                'exists:ppob_accounts,id',
            ],
            'lines'              => 'required|array|min:1',
            'lines.*.category'   => ['required', Rule::in(array_keys($categories))],
            'lines.*.title'      => 'required|string|max:150',
            'lines.*.amount'     => 'required|integer|min:1',
        ], [
            'payment_source.required' => 'Sumber dana wajib dipilih.',
            'ppob_account_id.required_if' => 'Akun PPOB wajib dipilih untuk sumber Saldo PPOB.',
        ]);

        $lines = collect($validated['lines'])->map(fn (array $line) => [
            'category' => $line['category'],
            'title'    => trim($line['title']),
            'amount'   => (int) $line['amount'],
        ]);

        $user = $request->user();
        $paymentSource = $validated['payment_source'];
        $totalAmount = (int) $lines->sum('amount');

        DB::transaction(function () use ($user, $validated, $lines, $paymentSource, $totalAmount) {
            $expense = Expense::create([
                'user_id'           => $user->id,
                'code'              => $this->generateExpenseCode(),
                'expense_date'      => $validated['expense_date'],
                'amount'            => $totalAmount,
                'note'              => filled($validated['note'] ?? null) ? trim($validated['note']) : null,
                'payment_source'    => $paymentSource,
                'ppob_account_id'   => $paymentSource === Expense::PAYMENT_SOURCE_PPOB
                    ? (int) $validated['ppob_account_id']
                    : null,
                'cashier_shift_id'  => $this->expenseFundingService->resolveCashierShiftId($user, $paymentSource),
            ]);

            $expense->lines()->createMany($lines->all());

            if ($paymentSource === Expense::PAYMENT_SOURCE_PPOB) {
                $account = PpobAccount::query()->findOrFail($validated['ppob_account_id']);
                $this->expenseFundingService->applyPpobCharge($expense, $account, $user);
            }
        });

        return redirect()->route('account.expenses.index');
    }

    public function edit(Request $request, Expense $expense)
    {
        $this->authorizeExpenseOwner($request, $expense);
        $expense->load('lines:id,expense_id,category,title,amount');

        return Inertia::render('Account/Expenses/Edit', [
            'expense' => [
                'id'           => $expense->id,
                'code'         => $expense->code,
                'expense_date' => $expense->expense_date?->toDateString(),
                'amount'       => $expense->amount,
                'note'         => $expense->note,
                'payment_source' => $expense->payment_source,
                'ppob_account_id' => $expense->ppob_account_id,
                'balance_log_id' => $expense->balance_log_id,
                'lines'        => $expense->lines->map(fn ($line) => [
                    'id'       => $line->id,
                    'category' => $line->category,
                    'title'    => $line->title,
                    'amount'   => $line->amount,
                ])->values()->all(),
            ],
            'categories' => $this->formatCategories($this->expenseCategories()),
            'paymentSources' => $this->formatPaymentSources(),
            'ppobAccounts' => $this->ppobAccountsForForm(),
        ]);
    }

    public function update(Request $request, Expense $expense)
    {
        $this->authorizeExpenseOwner($request, $expense);
        $categories = $this->expenseCategories();

        $validated = $request->validate([
            'expense_date'       => 'required|date',
            'note'               => 'nullable|string|max:1000',
            'payment_source'     => ['required', Rule::in(array_keys(Expense::paymentSourceLabels()))],
            'ppob_account_id'    => [
                'nullable',
                'required_if:payment_source,ppob',
                'exists:ppob_accounts,id',
            ],
            'lines'              => 'required|array|min:1',
            'lines.*.category'   => ['required', Rule::in(array_keys($categories))],
            'lines.*.title'      => 'required|string|max:150',
            'lines.*.amount'     => 'required|integer|min:1',
        ], [
            'payment_source.required' => 'Sumber dana wajib dipilih.',
            'ppob_account_id.required_if' => 'Akun PPOB wajib dipilih untuk sumber Saldo PPOB.',
        ]);

        $lines = collect($validated['lines'])->map(fn (array $line) => [
            'category' => $line['category'],
            'title'    => trim($line['title']),
            'amount'   => (int) $line['amount'],
        ]);

        $user = $request->user();
        $previousPaymentSource = $expense->payment_source;
        $previousPpobAccountId = $expense->ppob_account_id;
        $previousAmount = (int) $expense->amount;
        $paymentSource = $validated['payment_source'];
        $totalAmount = (int) $lines->sum('amount');

        DB::transaction(function () use (
            $expense,
            $validated,
            $lines,
            $user,
            $previousPaymentSource,
            $previousPpobAccountId,
            $previousAmount,
            $paymentSource,
            $totalAmount,
        ) {
            $expense->update([
                'expense_date' => $validated['expense_date'],
                'amount'       => $totalAmount,
                'note'         => filled($validated['note'] ?? null) ? trim($validated['note']) : null,
                'payment_source' => $paymentSource,
                'ppob_account_id' => $paymentSource === Expense::PAYMENT_SOURCE_PPOB
                    ? (int) $validated['ppob_account_id']
                    : null,
                'cashier_shift_id' => $this->expenseFundingService->resolveCashierShiftId($user, $paymentSource),
            ]);

            $expense->lines()->delete();
            $expense->lines()->createMany($lines->all());
            $expense->refresh();

            $ppobChanged = $previousPaymentSource !== $paymentSource
                || (int) $previousPpobAccountId !== (int) ($validated['ppob_account_id'] ?? 0)
                || $previousAmount !== $totalAmount;

            if ($ppobChanged) {
                $this->expenseFundingService->syncPpobOnUpdate(
                    expense: $expense,
                    previousPaymentSource: $previousPaymentSource,
                    previousPpobAccountId: $previousPpobAccountId,
                    previousAmount: $previousAmount,
                    newPaymentSource: $paymentSource,
                    newPpobAccountId: $paymentSource === Expense::PAYMENT_SOURCE_PPOB
                        ? (int) $validated['ppob_account_id']
                        : null,
                    newAmount: $totalAmount,
                    user: $user,
                );
            }
        });

        return redirect()->route('account.expenses.index');
    }

    public function destroy(Request $request, Expense $expense)
    {
        $this->authorizeExpenseOwner($request, $expense);

        DB::transaction(function () use ($request, $expense) {
            if ($expense->payment_source === Expense::PAYMENT_SOURCE_PPOB) {
                $this->expenseFundingService->reversePpobCharge($expense, $request->user());
            }

            $expense->delete();
        });

        return redirect()->route('account.expenses.index');
    }

    protected function applyFilters(Builder $query, Request $request, User $user): void
    {
        $query
            ->when(!$user->isAdminUser(), function (Builder $expenseQuery) use ($user) {
                $expenseQuery->where('user_id', $user->id);
            })
            ->when($user->isAdminUser() && filled($request->user_id), function (Builder $expenseQuery) use ($request) {
                $expenseQuery->where('user_id', $request->user_id);
            })
            ->when(filled($request->q), function (Builder $expenseQuery) use ($request) {
                $search = trim($request->q);

                $expenseQuery->where(function (Builder $searchQuery) use ($search) {
                    $searchQuery->where('code', 'like', '%' . $search . '%')
                        ->orWhere('note', 'like', '%' . $search . '%')
                        ->orWhereHas('lines', function (Builder $lineQuery) use ($search) {
                            $lineQuery->where('title', 'like', '%' . $search . '%');
                        });
                });
            })
            ->when(filled($request->category), function (Builder $expenseQuery) use ($request) {
                $expenseQuery->whereHas('lines', function (Builder $lineQuery) use ($request) {
                    $lineQuery->where('category', $request->category);
                });
            })
            ->when(filled($request->start_date), function (Builder $expenseQuery) use ($request) {
                $expenseQuery->whereDate('expense_date', '>=', $request->start_date);
            })
            ->when(filled($request->end_date), function (Builder $expenseQuery) use ($request) {
                $expenseQuery->whereDate('expense_date', '<=', $request->end_date);
            });
    }

    protected function authorizeExpenseOwner(Request $request, Expense $expense): void
    {
        if ($request->user()->isAdminUser()) {
            return;
        }

        abort_unless((int) $expense->user_id === (int) $request->user()->id, 403);
    }

    protected function expenseCategories(): array
    {
        return [
            'operational' => 'Operasional',
            'salary'      => 'Gaji / Komisi',
            'rent'        => 'Sewa',
            'utilities'   => 'Listrik, Air, Internet',
            'transport'   => 'Transportasi',
            'maintenance' => 'Perawatan',
            'promotion'   => 'Promosi',
            'other'       => 'Lainnya',
        ];
    }

    protected function formatCategories(array $categories): array
    {
        return collect($categories)
            ->map(fn (string $label, string $value) => [
                'value' => $value,
                'label' => $label,
            ])
            ->values()
            ->all();
    }

    protected function formatPaymentSources(): array
    {
        return collect(Expense::paymentSourceLabels())
            ->map(fn (string $label, string $value) => [
                'value' => $value,
                'label' => $label,
            ])
            ->values()
            ->all();
    }

    protected function ppobAccountsForForm(): array
    {
        return PpobAccount::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'current_balance'])
            ->map(fn (PpobAccount $account) => [
                'id' => $account->id,
                'name' => $account->name,
                'current_balance' => $account->current_balance,
            ])
            ->values()
            ->all();
    }

    protected function generateExpenseCode(): string
    {
        do {
            $code = 'EXP-' . now()->format('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
        } while (Expense::where('code', $code)->exists());

        return $code;
    }
}
