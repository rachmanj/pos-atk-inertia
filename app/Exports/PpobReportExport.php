<?php

namespace App\Exports;

use App\Models\TransactionDetail;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PpobReportExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    public function __construct(
        protected array $filters = []
    ) {}

    public function query()
    {
        $filters = $this->filters;
        $startDate = ($filters['start_date'] ?? now()->startOfMonth()->toDateString()) . ' 00:00:00';
        $endDate = ($filters['end_date'] ?? now()->toDateString()) . ' 23:59:59';
        $groupBy = $filters['group_by'] ?? 'product';

        $query = TransactionDetail::query()
            ->join('transactions', 'transaction_details.transaction_id', '=', 'transactions.id')
            ->whereNotNull('transaction_details.ppob_cost')
            ->where('transactions.payment_status', 'paid')
            ->where('transactions.status', '!=', 'voided')
            ->whereBetween(
                DB::raw('COALESCE(transactions.paid_at, transactions.created_at)'),
                [$startDate, $endDate]
            )
            ->when(!empty($filters['cashier_id']), function ($q) use ($filters) {
                $q->where('transactions.cashier_id', $filters['cashier_id']);
            })
            ->when(!empty($filters['q']), function ($q) use ($filters) {
                $search = trim($filters['q']);
                $q->join('products', 'transaction_details.product_id', '=', 'products.id')
                    ->where(function ($searchQuery) use ($search) {
                        $searchQuery->where('products.title', 'like', '%' . $search . '%')
                            ->orWhere('products.barcode', 'like', '%' . $search . '%');
                    });
            });

        if ($groupBy === 'cashier') {
            $query
                ->join('users', 'users.id', '=', 'transactions.cashier_id')
                ->select([
                    'transactions.cashier_id',
                    DB::raw('COUNT(DISTINCT transactions.id) as total_transactions'),
                    DB::raw("COALESCE(users.name, '-') as cashier_name"),
                    DB::raw('SUM(transaction_details.qty) as total_qty'),
                    DB::raw('SUM(transaction_details.subtotal) as total_omzet'),
                    DB::raw('SUM(transaction_details.admin_fee) as total_admin_fee'),
                    DB::raw('SUM(transaction_details.ppob_cost * transaction_details.qty) as total_cost'),
                ])
                ->groupBy('transactions.cashier_id', 'users.name');
        } else {
            $query->select([
                'transaction_details.product_id',
                DB::raw('SUM(transaction_details.qty) as total_qty'),
                DB::raw('SUM(transaction_details.subtotal) as total_omzet'),
                DB::raw('SUM(transaction_details.admin_fee) as total_admin_fee'),
                DB::raw('SUM(transaction_details.ppob_cost * transaction_details.qty) as total_cost'),
            ])
                ->with(['product:id,title,barcode']);

            if ($groupBy === 'date') {
                $query->addSelect(
                    DB::raw('DATE(COALESCE(transactions.paid_at, transactions.created_at)) as sale_date')
                );
                $query->groupBy(
                    DB::raw('DATE(COALESCE(transactions.paid_at, transactions.created_at))'),
                    'transaction_details.product_id'
                );
            } else {
                $query->groupBy('transaction_details.product_id');
            }
        }

        return $query->orderByDesc('total_omzet');
    }

    public function headings(): array
    {
        $groupBy = $this->filters['group_by'] ?? 'product';

        if ($groupBy === 'cashier') {
            return [
                'No',
                'Kasir',
                'Transaksi',
                'Qty',
                'Omzet',
                'Modal (Cost)',
                'Admin Fee / Laba',
            ];
        }

        return [
            'No',
            'Tanggal',
            'Produk',
            'Barcode',
            'Qty',
            'Omzet',
            'Modal',
            'Admin Fee / Laba',
        ];
    }

    public function map($row): array
    {
        static $no = 0;
        $no++;

        $groupBy = $this->filters['group_by'] ?? 'product';

        if ($groupBy === 'cashier') {
            return [
                $no,
                $row->cashier_name ?? '-',
                (int) $row->total_transactions,
                (int) $row->total_qty,
                (int) $row->total_omzet,
                (int) $row->total_cost,
                (int) $row->total_admin_fee,
            ];
        }

        return [
            $no,
            $row->sale_date ?? '-',
            $row->product?->title ?? '-',
            $row->product?->barcode ?? '-',
            (int) $row->total_qty,
            (int) $row->total_omzet,
            (int) $row->total_cost,
            (int) $row->total_admin_fee,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
