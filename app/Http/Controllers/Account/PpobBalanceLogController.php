<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\PpobAccount;
use App\Models\PpobBalanceLog;
use App\Models\User;
use App\Services\PpobBalanceService;
use DomainException;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PpobBalanceLogController extends Controller
{
    public function __construct(
        protected PpobBalanceService $ppobBalanceService,
    ) {}

    public function index(Request $request)
    {
        $request->validate([
            'ppob_account_id' => 'nullable|exists:ppob_accounts,id',
            'type' => 'nullable|in:opening_balance,top_up,sale,adjustment',
            'user_id' => 'nullable|exists:users,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $startDate = $request->start_date
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->startOfDay();

        $endDate = $request->end_date
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay();

        $baseQuery = PpobBalanceLog::query()
            ->with(['ppobAccount:id,name', 'user:id,name', 'cashierShift:id,opened_at'])
            ->when(filled($request->ppob_account_id), function ($query) use ($request) {
                $query->where('ppob_account_id', $request->ppob_account_id);
            })
            ->when(filled($request->type), function ($query) use ($request) {
                $query->where('type', $request->type);
            })
            ->when(filled($request->user_id), function ($query) use ($request) {
                $query->where('user_id', $request->user_id);
            })
            ->whereBetween('created_at', [$startDate, $endDate]);

        $summary = [
            'total' => (clone $baseQuery)->count(),
            'masuk' => (int) (clone $baseQuery)->where('amount', '>', 0)->sum('amount'),
            'keluar' => (int) (clone $baseQuery)->where('amount', '<', 0)->sum('amount'),
        ];

        $logs = (clone $baseQuery)->latest('id')->paginate(15);

        $logs->appends([
            'ppob_account_id' => $request->ppob_account_id,
            'type' => $request->type,
            'user_id' => $request->user_id,
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
        ]);

        return Inertia::render('Account/Ppob/BalanceLogs/Index', [
            'logs' => $logs,
            'summary' => $summary,
            'accounts' => PpobAccount::query()->orderBy('name')->get(['id', 'name', 'current_balance', 'is_active']),
            'users' => User::query()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'ppob_account_id' => $request->ppob_account_id ?? '',
                'type' => $request->type ?? '',
                'user_id' => $request->user_id ?? '',
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'ppob_account_id' => 'required|exists:ppob_accounts,id',
            'type' => 'required|in:top_up,adjustment',
            'amount' => 'required|integer|min:1',
            'note' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();

        if (!$user->isAdminUser()) {
            abort(403, 'Hanya admin yang dapat mengubah saldo PPOB.');
        }

        $type = $request->type;
        $amount = (int) $request->amount;

        try {
            DB::transaction(function () use ($request, $user, $type, $amount) {
                $account = PpobAccount::query()
                    ->whereKey($request->ppob_account_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $signedAmount = $type === 'top_up' ? $amount : (int) $request->input('signed_amount', $amount);

                if ($type === 'adjustment') {
                    $direction = $request->input('direction', 'increase');
                    $signedAmount = $direction === 'decrease' ? -$amount : $amount;
                }

                $this->ppobBalanceService->recordMovement(
                    account: $account,
                    userId: $user->id,
                    type: $type,
                    amount: $signedAmount,
                    cashierShiftId: $user->activeCashierShift?->id,
                    note: filled($request->note) ? trim($request->note) : null,
                );
            });

            return redirect()
                ->route('account.ppob-balance-logs.index')
                ->with('success', 'Mutasi saldo PPOB berhasil dicatat.');
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }
    }
}
