<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\CashierShift;
use App\Models\PpobAccount;
use App\Models\PpobBalanceLog;
use App\Models\ReturnTransaction;
use App\Models\Transaction;
use App\Models\WhatsappOutboundLog;
use App\Services\ShiftCashReconciliation;
use App\Services\ShiftLiveSummary;
use App\Services\ShiftReportBuilder;
use App\Services\TelegramNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Throwable;

class CashierShiftController extends Controller
{
    public function __construct(
        protected ShiftReportBuilder $shiftReportBuilder,
        protected ShiftLiveSummary $shiftLiveSummary,
        protected ShiftCashReconciliation $shiftCashReconciliation,
        protected TelegramNotificationService $telegramNotificationService,
    ) {}

    public function activeSummary(Request $request): JsonResponse
    {
        $activeShift = $request->user()->activeCashierShift;

        if (!$activeShift) {
            return response()->json(['has_shift' => false]);
        }

        $summary = $this->shiftLiveSummary->build($activeShift);

        return response()->json([
            'has_shift' => true,
            'shift' => [
                'id'                 => $activeShift->id,
                'opened_at'          => $activeShift->opened_at,
                'total_sales'        => $summary['total_sales'],
                'cash_sales'         => $summary['cash_sales'],
                'non_cash_sales'     => $summary['non_cash_sales'],
                'expected_cash'      => $summary['expected_cash'],
                'total_transactions' => $summary['total_transactions'],
                'paid_transactions'  => $summary['paid_transactions'],
            ],
        ]);
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $canViewAll = $user->isAdminUser();

        $shifts = CashierShift::with('user:id,name')
            ->when(!$canViewAll, function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->latest('opened_at')
            ->paginate(10);

        $shifts->through(function (CashierShift $shift) {
            return [
                'id'                 => $shift->id,
                'user'               => $shift->user,
                'opened_at'          => $shift->opened_at,
                'closed_at'          => $shift->closed_at,
                'cash_in_hand'       => $shift->cash_in_hand,
                'expected_cash'      => $shift->expected_cash,
                'actual_cash'        => $shift->actual_cash,
                'difference'         => $shift->difference,
                'total_transactions' => $shift->total_transactions,
                'note'               => $shift->note,
                'status'             => $shift->status,
                'summary'            => $this->buildShiftSummary($shift),
            ];
        });

        $activeShift = $user->activeCashierShift;

        $shiftBaseQuery = CashierShift::query()
            ->when(!$canViewAll, fn ($query) => $query->where('user_id', $user->id));

        $summary = [
            'total_shifts' => (clone $shiftBaseQuery)->count(),
            'open_shifts'  => (clone $shiftBaseQuery)->where('status', 'open')->count(),
            'total_sales'  => (int) Transaction::query()
                ->where('status', '!=', 'voided')
                ->where('payment_status', 'paid')
                ->when(!$canViewAll, fn ($query) => $query->where('cashier_id', $user->id))
                ->sum('grand_total'),
        ];

        return Inertia::render('Account/CashierShifts/Index', [
            'summary' => $summary,
            'activeShift' => $activeShift ? [
                'id'                 => $activeShift->id,
                'opened_at'          => $activeShift->opened_at,
                'cash_in_hand'       => $activeShift->cash_in_hand,
                'expected_cash'      => $activeShift->expected_cash,
                'actual_cash'        => $activeShift->actual_cash,
                'difference'         => $activeShift->difference,
                'total_transactions' => $activeShift->total_transactions,
                'note'               => $activeShift->note,
                'status'             => $activeShift->status,
                'summary'            => $this->buildShiftSummary($activeShift),
            ] : null,
            'shifts' => $shifts,
        ]);
    }

    public function create(Request $request)
    {
        $activeShift = $request->user()->activeCashierShift;

        if ($activeShift) {
            return redirect()
                ->route('account.cashier-shifts.show', $activeShift->id)
                ->with('error', 'Masih ada shift aktif. Tutup shift saat ini sebelum membuka shift baru.');
        }

        return Inertia::render('Account/CashierShifts/Create', [
            'ppobAccount' => PpobAccount::activeAccount(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'cash_in_hand' => 'required|integer|min:0',
            'note'         => 'nullable|string|max:1000',
        ]);

        if ($request->user()->activeCashierShift) {
            return redirect()
                ->route('account.cashier-shifts.index')
                ->with('error', 'Masih ada shift aktif. Tutup shift saat ini sebelum membuka shift baru.');
        }

        // PPOB balance is a single pool shared by every cashier, so it is captured
        // automatically for reporting only, not asked from the cashier like Kas Awal.
        $ppobAccount = PpobAccount::activeAccount();

        $shift = CashierShift::create([
            'user_id'            => $request->user()->id,
            'opened_at'          => now(),
            'cash_in_hand'       => (int) $request->cash_in_hand,
            'ppob_opening_balance' => $ppobAccount?->current_balance,
            'expected_cash'      => (int) $request->cash_in_hand,
            'actual_cash'        => 0,
            'difference'         => 0,
            'total_transactions' => 0,
            'note'               => filled($request->note) ? trim($request->note) : null,
            'status'             => 'open',
        ]);

        return redirect()
            ->route('account.cashier-shifts.show', $shift->id)
            ->with('success', 'Shift kasir berhasil dibuka.');
    }

    public function show(Request $request, CashierShift $cashierShift)
    {
        $this->authorizeView($request, $cashierShift);

        $summary = $this->buildShiftSummary($cashierShift);

        $canSendWaReport = $cashierShift->status === 'closed';

        $whatsappLogs = WhatsappOutboundLog::query()
            ->where('cashier_shift_id', $cashierShift->id)
            ->where('purpose', 'shift_report')
            ->with('createdBy:id,name')
            ->latest()
            ->get()
            ->map(fn (WhatsappOutboundLog $log) => [
                'id' => $log->id,
                'created_at' => $log->created_at,
                'status' => $log->status,
                'message_text' => $log->message_text,
                'wa_message_id' => $log->wa_message_id,
                'error' => $log->error,
                'created_by' => $log->createdBy ? [
                    'id' => $log->createdBy->id,
                    'name' => $log->createdBy->name,
                ] : null,
            ]);

        return Inertia::render('Account/CashierShifts/Show', [
            'shift' => [
                'id'                 => $cashierShift->id,
                'user'               => $cashierShift->user()->select('id', 'name')->first(),
                'opened_at'          => $cashierShift->opened_at,
                'closed_at'          => $cashierShift->closed_at,
                'cash_in_hand'       => $cashierShift->cash_in_hand,
                'ppob_opening_balance' => $cashierShift->ppob_opening_balance,
                'ppob_closing_balance' => $cashierShift->ppob_closing_balance,
                'ppob_expected_balance' => $cashierShift->ppob_expected_balance,
                'expected_cash'      => $summary['expected_cash'],
                'actual_cash'        => $cashierShift->actual_cash,
                'cash_overage'       => $cashierShift->cash_overage,
                'overage_note'       => $cashierShift->overage_note,
                'difference'         => $summary['selisih'],
                'total_transactions' => $cashierShift->isOpen() ? $summary['total_transactions'] : $cashierShift->total_transactions,
                'note'               => $cashierShift->note,
                'status'             => $cashierShift->status,
                'expense_amount'     => $cashierShift->expense_amount,
                'expense_note'       => $cashierShift->expense_note,
                'expenses'           => $this->shiftExpensesForProps($cashierShift),
                'summary'            => $summary,
            ],
            'canSendWaReport' => $canSendWaReport,
            'whatsappLogs' => $whatsappLogs,
        ]);
    }

    public function reportPreview(Request $request, CashierShift $cashierShift): JsonResponse
    {
        $this->authorizeView($request, $cashierShift);

        if ($cashierShift->status !== 'closed') {
            return response()->json([
                'ok' => false,
                'message' => 'Rekap shift hanya dapat dikirim untuk shift yang sudah ditutup.',
            ], 422);
        }

        $expenseInput = $this->validateReportExpenseInput($request);
        $this->persistReportExpenses($cashierShift, $expenseInput);
        $cashierShift->refresh();

        $report = $this->shiftReportBuilder->build(
            $cashierShift,
            $expenseInput['amount'],
            $expenseInput['note'],
            $expenseInput['lines'],
        );

        return response()->json([
            'ok' => true,
            'text' => $report['messageText'],
        ]);
    }

    public function reportSend(Request $request, CashierShift $cashierShift): JsonResponse
    {
        $this->authorizeView($request, $cashierShift);

        if ($cashierShift->status !== 'closed') {
            return response()->json([
                'ok' => false,
                'message' => 'Rekap shift hanya dapat dikirim untuk shift yang sudah ditutup.',
            ], 422);
        }

        $recipients = $this->telegramNotificationService->recipients();

        if ($recipients === []) {
            return response()->json([
                'ok' => false,
                'message' => 'Belum ada penerima Telegram, atur di Pengaturan',
            ], 422);
        }

        $expenseInput = $this->validateReportExpenseInput($request);
        $this->persistReportExpenses($cashierShift, $expenseInput);
        $cashierShift->refresh();

        $report = $this->shiftReportBuilder->build(
            $cashierShift,
            $expenseInput['amount'],
            $expenseInput['note'],
            $expenseInput['lines'],
        );
        $message = $report['messageText'];

        $results = [];
        $allSent = true;

        foreach ($recipients as $chatId) {
            $log = WhatsappOutboundLog::create([
                'purpose' => 'shift_report',
                'cashier_shift_id' => $cashierShift->id,
                'to_number' => $chatId,
                'message_text' => $message,
                'status' => 'queued',
                'created_by' => $request->user()->id,
            ]);

            try {
                $messageId = $this->telegramNotificationService->sendText($chatId, $message);

                $log->update([
                    'status' => 'sent',
                    'wa_message_id' => $messageId,
                ]);

                $results[] = [
                    'chat_id' => $chatId,
                    'ok' => true,
                    'status' => $log->status,
                    'wa_message_id' => $log->wa_message_id,
                ];
            } catch (Throwable $e) {
                report($e);
                $allSent = false;

                $log->update([
                    'status' => 'failed',
                    'error' => Str::limit($e->getMessage(), 500),
                ]);

                $results[] = [
                    'chat_id' => $chatId,
                    'ok' => false,
                    'status' => $log->status,
                    'message' => $log->error,
                ];
            }
        }

        if ($allSent) {
            return response()->json([
                'ok' => true,
                'results' => $results,
            ]);
        }

        return response()->json([
            'ok' => false,
            'message' => 'Gagal mengirim rekap shift ke sebagian penerima Telegram.',
            'results' => $results,
        ], 422);
    }

    public function close(Request $request, CashierShift $cashierShift)
    {
        $request->validate([
            'actual_cash'  => 'required|integer|min:0',
            'cash_overage' => 'nullable|integer|min:0',
            'overage_note' => 'nullable|string|max:255',
            'note'         => 'nullable|string|max:1000',
        ]);

        $this->authorizeClose($request, $cashierShift);

        if (!$cashierShift->isOpen()) {
            return redirect()
                ->route('account.cashier-shifts.show', $cashierShift->id)
                ->with('error', 'Shift ini sudah ditutup sebelumnya.');
        }

        $cashOverage = (int) ($request->cash_overage ?? 0);
        $overageNote = filled($request->overage_note) ? trim($request->overage_note) : null;

        if ($cashOverage > 0 && !filled($overageNote)) {
            throw ValidationException::withMessages([
                'overage_note' => 'Keterangan kelebihan uang wajib diisi.',
            ]);
        }

        $summary = $this->buildShiftSummary($cashierShift);
        $actualCash = (int) $request->actual_cash;
        $physicalCash = $actualCash + $cashOverage;
        $expectedCash = $summary['expected_cash'];
        $closeNote = filled($request->note) ? trim($request->note) : null;

        // PPOB balance is not counted per shift (it's a shared pool across cashiers);
        // we only snapshot this shift's contribution for reporting, no cashier-entered "actual".
        $cashierShift->update([
            'closed_at'          => now(),
            'expected_cash'      => $expectedCash,
            'actual_cash'        => $physicalCash,
            'cash_overage'       => $cashOverage,
            'overage_note'       => $overageNote,
            'difference'         => $physicalCash - $expectedCash,
            'total_transactions' => $summary['total_transactions'],
            'ppob_expected_balance' => $summary['ppob_expected_balance'],
            'note'               => $this->mergeNotes($cashierShift->note, $closeNote),
            'status'             => 'closed',
        ]);

        return redirect()
            ->route('account.cashier-shifts.show', $cashierShift->id)
            ->with('success', 'Shift kasir berhasil ditutup.');
    }

    protected function authorizeView(Request $request, CashierShift $cashierShift): void
    {
        $user = $request->user();

        if ($cashierShift->user_id !== $user->id && !$user->isAdminUser()) {
            abort(403);
        }
    }

    protected function authorizeClose(Request $request, CashierShift $cashierShift): void
    {
        $user = $request->user();

        if ($cashierShift->user_id !== $user->id && !$user->isAdminUser()) {
            abort(403);
        }
    }

    protected function buildShiftSummary(CashierShift $shift): array
    {
        $startedAt = $shift->opened_at instanceof Carbon
            ? $shift->opened_at->copy()
            : Carbon::parse($shift->opened_at);

        $endedAt = $shift->closed_at instanceof Carbon
            ? $shift->closed_at->copy()
            : ($shift->closed_at ? Carbon::parse($shift->closed_at) : now());

        $transactionsQuery = Transaction::query()
            ->where('cashier_id', $shift->user_id)
            ->where('status', '!=', 'voided')
            ->whereBetween('created_at', [$startedAt, $endedAt]);

        $paidTransactionsQuery = (clone $transactionsQuery)
            ->where('payment_status', 'paid');

        $approvedReturnsQuery = ReturnTransaction::query()
            ->where('cashier_id', $shift->user_id)
            ->where('status', 'approved')
            ->whereBetween('updated_at', [$startedAt, $endedAt]);

        $totalTransactions = (int) (clone $transactionsQuery)->count();
        $paidTransactions = (int) (clone $paidTransactionsQuery)->count();
        $totalReturns = (int) (clone $approvedReturnsQuery)->count();

        $reconciliation = $this->shiftCashReconciliation->build($shift, $endedAt);

        $ppobTopUps = (int) PpobBalanceLog::query()
            ->where('cashier_shift_id', $shift->id)
            ->where('type', 'top_up')
            ->sum('amount');

        $ppobSalesCost = abs((int) PpobBalanceLog::query()
            ->where('cashier_shift_id', $shift->id)
            ->where('type', 'sale')
            ->sum('amount'));

        $ppobOpening = (int) ($shift->ppob_opening_balance ?? 0);
        $ppobExpected = $ppobOpening + $ppobTopUps - $ppobSalesCost;

        return [
            'cash_sales'         => $reconciliation['hanya_cash_sales'],
            'non_cash_sales'     => $reconciliation['non_cash_sales'],
            'cash_refunds'       => $reconciliation['cash_refunds'],
            'non_cash_refunds'   => (int) (clone $approvedReturnsQuery)
                ->where('refund_method', '!=', 'cash')
                ->sum('total_refund'),
            'expected_cash'      => $reconciliation['kas_seharusnya'],
            'kas_awal'           => $reconciliation['kas_awal'],
            'kas_seharusnya'     => $reconciliation['kas_seharusnya'],
            'kas_disetor'        => $reconciliation['kas_disetor'],
            'selisih'            => $reconciliation['selisih'],
            'expense_amount'     => $reconciliation['expense_amount'],
            'tunai_dari_penjualan' => $reconciliation['tunai_dari_penjualan'],
            'total_transactions' => $totalTransactions,
            'paid_transactions'  => $paidTransactions,
            'total_returns'      => $totalReturns,
            'ppob_opening_balance' => $ppobOpening,
            'ppob_top_ups'       => $ppobTopUps,
            'ppob_sales_cost'    => $ppobSalesCost,
            'ppob_expected_balance' => $ppobExpected,
            'started_at'         => $startedAt,
            'ended_at'           => $endedAt,
        ];
    }

    protected function mergeNotes(?string $existingNote, ?string $closeNote): ?string
    {
        $existing = filled($existingNote) ? trim($existingNote) : null;
        $closing = filled($closeNote) ? trim($closeNote) : null;

        $parts = array_filter([
            $existing,
            $closing ? 'Close: ' . $closing : null,
        ]);

        return $parts ? implode("\n\n", $parts) : null;
    }

    protected function validateReportExpenseInput(Request $request): array
    {
        $validated = $request->validate([
            'expense_amount' => 'nullable|integer|min:0',
            'expense_note' => 'nullable|string|max:255',
            'expenses' => 'nullable|array|max:30',
            'expenses.*.title' => 'nullable|string|max:150',
            'expenses.*.amount' => 'nullable|integer|min:0',
        ]);

        if (!$request->has('expenses')) {
            return [
                'usesLines' => false,
                'amount' => (int) ($validated['expense_amount'] ?? 0),
                'note' => filled($validated['expense_note'] ?? null) ? trim($validated['expense_note']) : null,
                'lines' => [],
            ];
        }

        $lines = [];

        foreach ($validated['expenses'] ?? [] as $row) {
            $amount = (int) ($row['amount'] ?? 0);
            $title = filled($row['title'] ?? null) ? trim($row['title']) : null;

            if ($amount < 1 && !filled($title)) {
                continue;
            }

            if ($amount >= 1 && !filled($title)) {
                throw ValidationException::withMessages([
                    'expenses' => 'Keterangan wajib diisi untuk setiap baris pengeluaran.',
                ]);
            }

            if ($amount >= 1) {
                $lines[] = [
                    'title' => $title,
                    'amount' => $amount,
                ];
            }
        }

        return [
            'usesLines' => true,
            'amount' => array_sum(array_column($lines, 'amount')),
            'note' => null,
            'lines' => $lines,
        ];
    }

    protected function persistReportExpenses(CashierShift $shift, array $expenseInput): void
    {
        if ($expenseInput['usesLines']) {
            DB::transaction(function () use ($shift, $expenseInput) {
                $shift->shiftExpenses()->delete();

                foreach ($expenseInput['lines'] as $line) {
                    $shift->shiftExpenses()->create([
                        'title' => $line['title'],
                        'amount' => $line['amount'],
                    ]);
                }

                $shift->update([
                    'expense_amount' => $expenseInput['amount'],
                    'expense_note' => null,
                ]);

                $this->recalculateClosedShiftCash($shift);
            });

            return;
        }

        $shift->update([
            'expense_amount' => $expenseInput['amount'],
            'expense_note' => $expenseInput['note'],
        ]);

        $this->recalculateClosedShiftCash($shift);
    }

    protected function recalculateClosedShiftCash(CashierShift $shift): void
    {
        if ($shift->status !== 'closed') {
            return;
        }

        $shift->refresh();
        $reconciliation = $this->shiftCashReconciliation->build($shift);

        $shift->update([
            'expected_cash' => $reconciliation['kas_seharusnya'],
            'difference' => $reconciliation['selisih'],
        ]);
    }

    protected function shiftExpensesForProps(CashierShift $shift): array
    {
        $shift->loadMissing('shiftExpenses');

        if ($shift->shiftExpenses->isNotEmpty()) {
            return $shift->shiftExpenses->map(fn ($expense) => [
                'id' => $expense->id,
                'title' => $expense->title,
                'amount' => $expense->amount,
            ])->values()->all();
        }

        if ((int) ($shift->expense_amount ?? 0) > 0) {
            return [[
                'id' => null,
                'title' => filled($shift->expense_note) ? trim($shift->expense_note) : 'Pengeluaran lain',
                'amount' => (int) $shift->expense_amount,
            ]];
        }

        return [];
    }
}
