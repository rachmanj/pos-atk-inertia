<?php

namespace App\Http\Controllers\Account;

use App\Exports\ShiftSalesReportExport;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ShiftSalesReportController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        abort_unless($user->can('reports.sales'), 403);

        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'cashier_id' => 'nullable|exists:users,id',
            'status' => 'nullable|in:open,closed',
        ]);

        $canViewAll = $user->isAdminUser();

        $startDate = $request->start_date
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->startOfDay();

        $endDate = $request->end_date
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay();

        $status = $request->status ?? '';
        $cashierId = $canViewAll ? ($request->cashier_id ?? null) : $user->id;

        $filters = [
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'cashier_id' => $canViewAll ? ($request->cashier_id ?? '') : (string) $user->id,
            'status' => $status,
        ];

        $baseQuery = ShiftSalesReportExport::buildQuery($filters, $user);

        $summaryRow = DB::query()
            ->fromSub((clone $baseQuery)->toBase(), 'shift_rows')
            ->selectRaw('
                COUNT(*) as total_shifts,
                SUM(CASE WHEN status = "open" THEN 1 ELSE 0 END) as open_shifts,
                COALESCE(SUM(trx_count), 0) as total_transactions,
                COALESCE(SUM(paid_count), 0) as paid_transactions,
                COALESCE(SUM(tunai), 0) as tunai,
                COALESCE(SUM(non_tunai), 0) as non_tunai,
                COALESCE(SUM(tunai + non_tunai), 0) as total_penjualan,
                COALESCE(SUM(ppob_tunai), 0) as ppob_tunai,
                COALESCE(SUM(refund_tunai), 0) as refund_tunai,
                COALESCE(SUM(difference), 0) as total_selisih_kas,
                COALESCE(SUM(pengeluaran), 0) as total_pengeluaran,
                COALESCE(SUM(cash_overage), 0) as total_kelebihan,
                COALESCE(SUM(actual_cash), 0) as total_kas_disetor
            ')
            ->first();

        $shifts = (clone $baseQuery)
            ->with('user:id,name')
            ->orderByDesc('cashier_shifts.opened_at')
            ->paginate(15)
            ->withQueryString();

        $shifts->through(function ($shift) {
            $tunai = (int) $shift->tunai;
            $nonTunai = (int) $shift->non_tunai;
            $trxCount = (int) $shift->trx_count;
            $paidCount = (int) $shift->paid_count;
            $refundTunai = (int) $shift->refund_tunai;

            return [
                'id' => $shift->id,
                'opened_at' => $shift->opened_at,
                'closed_at' => $shift->closed_at,
                'status' => $shift->status,
                'user' => $shift->user,
                'cash_in_hand' => (int) $shift->cash_in_hand,
                'actual_cash' => (int) ($shift->actual_cash ?? 0),
                'difference' => (int) ($shift->difference ?? 0),
                'cash_overage' => (int) ($shift->cash_overage ?? 0),
                'tunai' => $tunai,
                'non_tunai' => $nonTunai,
                'total_penjualan' => $tunai + $nonTunai,
                'ppob_tunai' => (int) $shift->ppob_tunai,
                'refund_tunai' => $refundTunai,
                'refund_non_tunai' => (int) $shift->refund_non_tunai,
                'trx_count' => $trxCount,
                'paid_count' => $paidCount,
                'pending_count' => $trxCount - $paidCount,
                'kas_seharusnya' => (int) $shift->cash_in_hand + $tunai - $refundTunai,
                'pengeluaran' => (int) ($shift->pengeluaran ?? 0),
                'kelebihan' => (int) ($shift->cash_overage ?? 0),
                'kas_disetor' => (int) ($shift->actual_cash ?? 0),
            ];
        });

        return Inertia::render('Account/Reports/ShiftSales', [
            'shifts' => $shifts,
            'summary' => [
                'total_shifts' => (int) ($summaryRow->total_shifts ?? 0),
                'open_shifts' => (int) ($summaryRow->open_shifts ?? 0),
                'total_transactions' => (int) ($summaryRow->total_transactions ?? 0),
                'paid_transactions' => (int) ($summaryRow->paid_transactions ?? 0),
                'tunai' => (int) ($summaryRow->tunai ?? 0),
                'non_tunai' => (int) ($summaryRow->non_tunai ?? 0),
                'total_penjualan' => (int) ($summaryRow->total_penjualan ?? 0),
                'ppob_tunai' => (int) ($summaryRow->ppob_tunai ?? 0),
                'refund_tunai' => (int) ($summaryRow->refund_tunai ?? 0),
                'total_selisih_kas' => (int) ($summaryRow->total_selisih_kas ?? 0),
                'total_pengeluaran' => (int) ($summaryRow->total_pengeluaran ?? 0),
                'total_kelebihan' => (int) ($summaryRow->total_kelebihan ?? 0),
                'total_kas_disetor' => (int) ($summaryRow->total_kas_disetor ?? 0),
            ],
            'filters' => $filters,
            'cashiers' => $canViewAll
                ? User::query()
                    ->whereHas('cashierShifts')
                    ->orderBy('name')
                    ->get(['id', 'name'])
                : [],
            'isAdmin' => $canViewAll,
        ]);
    }

    public function export(Request $request)
    {
        $user = $request->user();

        abort_unless($user->can('reports.export'), 403);
        abort_unless($user->can('reports.sales'), 403);

        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'cashier_id' => 'nullable|exists:users,id',
            'status' => 'nullable|in:open,closed',
        ]);

        $filters = [
            'start_date' => $request->start_date ?: now()->toDateString(),
            'end_date' => $request->end_date ?: now()->toDateString(),
            'cashier_id' => $request->cashier_id,
            'status' => $request->status ?? '',
        ];

        return Excel::download(
            new ShiftSalesReportExport($filters, $user),
            'laporan-penjualan-per-shift-' . now()->format('Ymd_His') . '.xlsx'
        );
    }
}
