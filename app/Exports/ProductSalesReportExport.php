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

class ProductSalesReportExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    public function __construct(
        protected array $filters = []
    ) {}

    public function query()
    {
        $filters = $this->filters;
        $startDate = ($filters['start_date'] ?? now()->startOfMonth()->toDateString()) . ' 00:00:00';
        $endDate = ($filters['end_date'] ?? now()->toDateString()) . ' 23:59:59';

        return TransactionDetail::query()
            ->select([
                'transaction_details.product_id',
                DB::raw('SUM(transaction_details.qty) as total_qty'),
                DB::raw('SUM(transaction_details.subtotal) as total_omzet'),
                DB::raw('SUM(transaction_details.buy_price * transaction_details.qty) as total_cogs'),
            ])
            ->join('transactions', 'transaction_details.transaction_id', '=', 'transactions.id')
            ->join('products', 'transaction_details.product_id', '=', 'products.id')
            ->with(['product:id,title,barcode,unit,category_id', 'product.category:id,name'])
            ->where('transactions.payment_status', 'paid')
            ->where('transactions.status', '!=', 'voided')
            ->whereBetween(
                DB::raw('COALESCE(transactions.paid_at, transactions.created_at)'),
                [$startDate, $endDate]
            )
            ->when(!empty($filters['cashier_id']), function ($q) use ($filters) {
                $q->where('transactions.cashier_id', $filters['cashier_id']);
            })
            ->when(!empty($filters['category_id']), function ($q) use ($filters) {
                $q->where('products.category_id', $filters['category_id']);
            })
            ->when(!empty($filters['q']), function ($q) use ($filters) {
                $search = trim($filters['q']);
                $q->where(function ($searchQuery) use ($search) {
                    $searchQuery->where('products.title', 'like', '%' . $search . '%')
                        ->orWhere('products.barcode', 'like', '%' . $search . '%');
                });
            })
            ->groupBy('transaction_details.product_id')
            ->orderByDesc('total_omzet');
    }

    public function headings(): array
    {
        return [
            'No',
            'Produk',
            'Barcode',
            'Kategori',
            'Qty',
            'Omzet',
            'HPP',
            'Laba',
            'Margin %',
        ];
    }

    public function map($row): array
    {
        static $no = 0;
        $no++;

        $laba = (int) ($row->total_omzet - $row->total_cogs);
        $margin = $row->total_omzet > 0
            ? round(($laba / $row->total_omzet) * 100, 1)
            : 0;

        return [
            $no,
            $row->product?->title ?? '-',
            $row->product?->barcode ?? '-',
            $row->product?->category?->name ?? '-',
            (int) $row->total_qty,
            (int) $row->total_omzet,
            (int) $row->total_cogs,
            $laba,
            $margin,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
