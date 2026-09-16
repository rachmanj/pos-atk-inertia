<?php

namespace App\Exports;

use App\Models\CashierShift;
use App\Models\TransactionPayment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ShiftSalesReportExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    public function __construct(
        protected array $filters = [],
        protected ?User $user = null,
    ) {}

    public function query()
    {
        return static::buildQuery($this->filters, $this->user)
            ->with('user:id,name')
            ->orderByDesc('cashier_shifts.opened_at');
    }

    public static function buildQuery(array $filters, User $user): Builder
    {
        $canViewAll = $user->isAdminUser();
        $now = Carbon::now();

        $startDate = !empty($filters['start_date'])
            ? Carbon::parse($filters['start_date'])->startOfDay()
            : Carbon::now()->startOfDay();

        $endDate = !empty($filters['end_date'])
            ? Carbon::parse($filters['end_date'])->endOfDay()
            : Carbon::now()->endOfDay();

        $status = $filters['status'] ?? '';
        $cashierId = $canViewAll ? ($filters['cashier_id'] ?? null) : $user->id;

        $query = CashierShift::query()
            ->select('cashier_shifts.*');

        static::addMetricSubqueries($query, $now);

        $query
            ->when(!$canViewAll, fn (Builder $q) => $q->where('cashier_shifts.user_id', $user->id))
            ->when($canViewAll && filled($cashierId), fn (Builder $q) => $q->where('cashier_shifts.user_id', $cashierId))
            ->whereDate('cashier_shifts.opened_at', '>=', $startDate->toDateString())
            ->whereDate('cashier_shifts.opened_at', '<=', $endDate->toDateString())
            ->when($status === 'open', fn (Builder $q) => $q->where('cashier_shifts.status', 'open'))
            ->when($status === 'closed', fn (Builder $q) => $q->where('cashier_shifts.status', 'closed'));

        return $query;
    }

    public static function addMetricSubqueries(Builder $query, Carbon $now): void
    {
        $endedAtSql = 'COALESCE(cashier_shifts.closed_at, ?)';
        $rangeSql = "created_at BETWEEN cashier_shifts.opened_at AND {$endedAtSql}";
        $returnRangeSql = "updated_at BETWEEN cashier_shifts.opened_at AND {$endedAtSql}";

        $query->selectRaw(static::paidCashAmountSql($rangeSql) . ' as tunai', [$now, $now]);
        $query->selectRaw(static::paidNonCashAmountSql($rangeSql) . ' as non_tunai', [$now, $now]);

        $query->selectSub(function ($sub) use ($now, $rangeSql) {
            $sub->from('transactions')
                ->selectRaw('COUNT(*)')
                ->whereColumn('cashier_id', 'cashier_shifts.user_id')
                ->where('status', '!=', 'voided')
                ->whereRaw($rangeSql, [$now]);
        }, 'trx_count');

        $query->selectSub(function ($sub) use ($now, $rangeSql) {
            $sub->from('transactions')
                ->selectRaw('COUNT(*)')
                ->whereColumn('cashier_id', 'cashier_shifts.user_id')
                ->where('status', '!=', 'voided')
                ->where('payment_status', 'paid')
                ->whereRaw($rangeSql, [$now]);
        }, 'paid_count');

        $query->selectRaw(static::paidCashAmountSql($rangeSql, true) . ' as ppob_tunai', [$now, $now]);

        $query->selectSub(function ($sub) use ($now, $returnRangeSql) {
            $sub->from('return_transactions')
                ->selectRaw('COALESCE(SUM(total_refund), 0)')
                ->whereColumn('cashier_id', 'cashier_shifts.user_id')
                ->where('status', 'approved')
                ->where('refund_method', 'cash')
                ->whereRaw($returnRangeSql, [$now]);
        }, 'refund_tunai');

        $query->selectSub(function ($sub) use ($now, $returnRangeSql) {
            $sub->from('return_transactions')
                ->selectRaw('COALESCE(SUM(total_refund), 0)')
                ->whereColumn('cashier_id', 'cashier_shifts.user_id')
                ->where('status', 'approved')
                ->where('refund_method', '!=', 'cash')
                ->whereRaw($returnRangeSql, [$now]);
        }, 'refund_non_tunai');

        $query->selectSub(function ($sub) use ($now, $endedAtSql) {
            $sub->from('expenses as e')
                ->selectRaw('COALESCE(SUM(e.amount), 0)')
                ->whereColumn('e.user_id', 'cashier_shifts.user_id')
                ->whereRaw("e.created_at BETWEEN cashier_shifts.opened_at AND {$endedAtSql}", [$now]);
        }, 'pengeluaran_menu');
    }

    public function headings(): array
    {
        return [
            'No',
            'Tanggal',
            'Shift',
            'Status',
            'Kasir',
            'Jam Buka',
            'Jam Tutup',
            'Trx',
            'Lunas',
            'Pending',
            'Total Penjualan',
            'Non Tunai',
            'Pengeluaran',
            'Kelebihan',
            'Kas Disetor',
            'Penjualan Tunai',
            'PPOB Tunai',
            'Pengeluaran Menu',
            'Catatan Pengeluaran',
            'Kas Awal',
            'Kas Seharusnya',
            'Kas Aktual',
            'Selisih',
            'Refund Tunai',
            'Refund Non Tunai',
        ];
    }

    public function map($row): array
    {
        static $no = 0;
        $no++;

        $tunai = (int) $row->tunai;
        $nonTunai = (int) $row->non_tunai;
        $trxCount = (int) $row->trx_count;
        $paidCount = (int) $row->paid_count;
        $refundTunai = (int) $row->refund_tunai;
        $kasSeharusnya = (int) $row->cash_in_hand + $tunai - $refundTunai;

        return [
            $no,
            $row->opened_at?->format('d/m/Y') ?? '-',
            '#' . $row->id,
            $row->status === 'open' ? 'Buka' : 'Tutup',
            $row->user?->name ?? '-',
            $row->opened_at?->format('H:i') ?? '-',
            $row->closed_at?->format('H:i') ?? '-',
            $trxCount,
            $paidCount,
            $trxCount - $paidCount,
            $tunai + $nonTunai,
            $nonTunai,
            (int) ($row->expense_amount ?? 0),
            (int) ($row->cash_overage ?? 0),
            (int) ($row->actual_cash ?? 0),
            $tunai,
            (int) $row->ppob_tunai,
            (int) ($row->pengeluaran_menu ?? 0),
            $row->expense_note ?? '',
            (int) $row->cash_in_hand,
            $kasSeharusnya,
            (int) ($row->actual_cash ?? 0),
            (int) ($row->difference ?? 0),
            $refundTunai,
            (int) $row->refund_non_tunai,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }

    protected static function qualifiedRangeSql(string $rangeSql): string
    {
        return str_replace('created_at', 'transactions.created_at', $rangeSql);
    }

    protected static function paidCashAmountSql(string $rangeSql, bool $ppobOnly = false): string
    {
        $cashMethod = TransactionPayment::METHOD_CASH;
        $paidStatus = TransactionPayment::STATUS_PAID;
        $qualifiedRangeSql = static::qualifiedRangeSql($rangeSql);
        $ppobExistsSql = $ppobOnly
            ? ' AND EXISTS (
                SELECT 1
                FROM transaction_details td
                WHERE td.transaction_id = transactions.id
                  AND td.ppob_cost IS NOT NULL
            )'
            : '';

        $paymentPart = "(
            SELECT COALESCE(SUM(tp.amount), 0)
            FROM transaction_payments tp
            INNER JOIN transactions ON transactions.id = tp.transaction_id
            WHERE transactions.cashier_id = cashier_shifts.user_id
              AND transactions.status != 'voided'
              AND transactions.payment_status = 'paid'
              AND tp.method = '{$cashMethod}'
              AND tp.payment_status = '{$paidStatus}'
              AND {$qualifiedRangeSql}
              {$ppobExistsSql}
        )";

        $legacyPart = "(
            SELECT COALESCE(SUM(transactions.grand_total), 0)
            FROM transactions
            WHERE transactions.cashier_id = cashier_shifts.user_id
              AND transactions.status != 'voided'
              AND transactions.payment_status = 'paid'
              AND transactions.payment_method = '{$cashMethod}'
              AND NOT EXISTS (
                  SELECT 1
                  FROM transaction_payments tp
                  WHERE tp.transaction_id = transactions.id
              )
              AND {$qualifiedRangeSql}
              {$ppobExistsSql}
        )";

        return "({$paymentPart} + {$legacyPart})";
    }

    protected static function paidNonCashAmountSql(string $rangeSql): string
    {
        $paidStatus = TransactionPayment::STATUS_PAID;
        $nonCashMethods = implode("','", TransactionPayment::nonCashMethods());
        $qualifiedRangeSql = static::qualifiedRangeSql($rangeSql);

        $paymentPart = "(
            SELECT COALESCE(SUM(tp.amount), 0)
            FROM transaction_payments tp
            INNER JOIN transactions ON transactions.id = tp.transaction_id
            WHERE transactions.cashier_id = cashier_shifts.user_id
              AND transactions.status != 'voided'
              AND transactions.payment_status = 'paid'
              AND tp.method IN ('{$nonCashMethods}')
              AND tp.payment_status = '{$paidStatus}'
              AND {$qualifiedRangeSql}
        )";

        $legacyPart = "(
            SELECT COALESCE(SUM(transactions.grand_total), 0)
            FROM transactions
            WHERE transactions.cashier_id = cashier_shifts.user_id
              AND transactions.status != 'voided'
              AND transactions.payment_status = 'paid'
              AND transactions.payment_method IN ('{$nonCashMethods}')
              AND NOT EXISTS (
                  SELECT 1
                  FROM transaction_payments tp
                  WHERE tp.transaction_id = transactions.id
              )
              AND {$qualifiedRangeSql}
        )";

        return "({$paymentPart} + {$legacyPart})";
    }
}
