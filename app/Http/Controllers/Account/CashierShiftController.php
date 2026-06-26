<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\CashierShift;
use App\Models\PpobAccount;
use App\Models\PpobBalanceLog;
use App\Models\ReturnTransaction;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class CashierShiftController extends Controller
{
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

        return Inertia::render('Account/CashierShifts/Index', [
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
            'ppob_opening_balance' => 'nullable|integer|min:0',
            'note'         => 'nullable|string|max:1000',
        ]);

        if ($request->user()->activeCashierShift) {
            return redirect()
                ->route('account.cashier-shifts.index')
                ->with('error', 'Masih ada shift aktif. Tutup shift saat ini sebelum membuka shift baru.');
        }

        $shift = CashierShift::create([
            'user_id'            => $request->user()->id,
            'opened_at'          => now(),
            'cash_in_hand'       => (int) $request->cash_in_hand,
            'ppob_opening_balance' => filled($request->ppob_opening_balance)
                ? (int) $request->ppob_opening_balance
                : null,
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
                'expected_cash'      => $cashierShift->isOpen() ? $summary['expected_cash'] : $cashierShift->expected_cash,
                'actual_cash'        => $cashierShift->actual_cash,
                'difference'         => $cashierShift->difference,
                'total_transactions' => $cashierShift->isOpen() ? $summary['total_transactions'] : $cashierShift->total_transactions,
                'note'               => $cashierShift->note,
                'status'             => $cashierShift->status,
                'summary'            => $summary,
            ],
        ]);
    }

    public function close(Request $request, CashierShift $cashierShift)
    {
        $request->validate([
            'actual_cash' => 'required|integer|min:0',
            'ppob_closing_balance' => 'nullable|integer|min:0',
            'note'        => 'nullable|string|max:1000',
        ]);

        $this->authorizeClose($request, $cashierShift);

        if (!$cashierShift->isOpen()) {
            return redirect()
                ->route('account.cashier-shifts.show', $cashierShift->id)
                ->with('error', 'Shift ini sudah ditutup sebelumnya.');
        }

        $summary = $this->buildShiftSummary($cashierShift);
        $actualCash = (int) $request->actual_cash;
        $expectedCash = $summary['expected_cash'];
        $closeNote = filled($request->note) ? trim($request->note) : null;

        $ppobClosing = filled($request->ppob_closing_balance)
            ? (int) $request->ppob_closing_balance
            : null;

        $cashierShift->update([
            'closed_at'          => now(),
            'expected_cash'      => $expectedCash,
            'actual_cash'        => $actualCash,
            'difference'         => $actualCash - $expectedCash,
            'total_transactions' => $summary['total_transactions'],
            'ppob_expected_balance' => $summary['ppob_expected_balance'],
            'ppob_closing_balance' => $ppobClosing,
            'note'               => $this->mergeNotes($cashierShift->note, $closeNote, $ppobClosing, $summary['ppob_expected_balance']),
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

        $cashSales = (int) (clone $paidTransactionsQuery)
            ->where('payment_method', 'cash')
            ->sum('grand_total');

        $nonCashSales = (int) (clone $paidTransactionsQuery)
            ->where('payment_method', '!=', 'cash')
            ->sum('grand_total');

        $approvedReturnsQuery = ReturnTransaction::query()
            ->where('cashier_id', $shift->user_id)
            ->where('status', 'approved')
            ->whereBetween('updated_at', [$startedAt, $endedAt]);

        $cashRefunds = (int) (clone $approvedReturnsQuery)
            ->where('refund_method', 'cash')
            ->sum('total_refund');

        $nonCashRefunds = (int) (clone $approvedReturnsQuery)
            ->where('refund_method', '!=', 'cash')
            ->sum('total_refund');

        $totalTransactions = (int) (clone $transactionsQuery)->count();
        $paidTransactions = (int) (clone $paidTransactionsQuery)->count();
        $totalReturns = (int) (clone $approvedReturnsQuery)->count();
        $expectedCash = (int) $shift->cash_in_hand + $cashSales - $cashRefunds;

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
            'cash_sales'         => $cashSales,
            'non_cash_sales'     => $nonCashSales,
            'cash_refunds'       => $cashRefunds,
            'non_cash_refunds'   => $nonCashRefunds,
            'expected_cash'      => $expectedCash,
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

    protected function mergeNotes(?string $existingNote, ?string $closeNote, ?int $ppobClosing = null, ?int $ppobExpected = null): ?string
    {
        $existing = filled($existingNote) ? trim($existingNote) : null;
        $closing = filled($closeNote) ? trim($closeNote) : null;

        $parts = array_filter([
            $existing,
            $closing ? 'Close: ' . $closing : null,
            $ppobClosing !== null && $ppobExpected !== null
                ? 'PPOB close: actual ' . $ppobClosing . ', expected ' . $ppobExpected
                : null,
        ]);

        return $parts ? implode("\n\n", $parts) : null;
    }
}
