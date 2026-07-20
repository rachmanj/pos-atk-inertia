<?php

namespace App\Exports;

use App\Models\Transaction;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SalesReportExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    public function __construct(
        protected array $filters = []
    ) {}

    public function query()
    {
        $filters = $this->filters;
        $startDate = $filters['start_date'] ?? now()->startOfMonth()->toDateString();
        $endDate = $filters['end_date'] ?? now()->toDateString();

        return Transaction::query()
            ->select([
                'id', 'cashier_id', 'customer_id', 'invoice',
                'discount', 'grand_total', 'payment_method',
                'paid_at', 'created_at',
            ])
            ->with(['cashier:id,name', 'customer:id,name'])
            ->withSum('details as total_items', 'qty')
            ->where('payment_status', 'paid')
            ->where('status', '!=', 'voided')
            ->whereBetween(
                \Illuminate\Support\Facades\DB::raw('COALESCE(transactions.paid_at, transactions.created_at)'),
                [$startDate . ' 00:00:00', $endDate . ' 23:59:59']
            )
            ->when(!empty($filters['payment_method']), function ($q) use ($filters) {
                $q->where('payment_method', $filters['payment_method']);
            })
            ->when(!empty($filters['cashier_id']), function ($q) use ($filters) {
                $q->where('cashier_id', $filters['cashier_id']);
            })
            ->orderByRaw('COALESCE(transactions.paid_at, transactions.created_at) DESC');
    }

    public function headings(): array
    {
        return [
            'No',
            'Invoice',
            'Tanggal Lunas',
            'Kasir',
            'Pelanggan',
            'Metode Bayar',
            'Item',
            'Diskon',
            'Grand Total',
        ];
    }

    public function map($row): array
    {
        static $no = 0;
        $no++;

        $paymentMethod = $row->payment_method === 'cash' ? 'Tunai' : 'Digital';

        return [
            $no,
            $row->invoice,
            $row->paid_at ? $row->paid_at->format('d/m/Y H:i') : $row->created_at->format('d/m/Y H:i'),
            $row->cashier?->name ?? '-',
            $row->customer?->name ?? 'Umum',
            $paymentMethod,
            (int) ($row->total_items ?? 0),
            $row->discount,
            $row->grand_total,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
