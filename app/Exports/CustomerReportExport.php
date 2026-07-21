<?php

namespace App\Exports;

use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class CustomerReportExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    public function __construct(
        protected array $filters = []
    ) {}

    public function query()
    {
        $filters = $this->filters;
        $startDate = ($filters['start_date'] ?? now()->startOfMonth()->toDateString()) . ' 00:00:00';
        $endDate = ($filters['end_date'] ?? now()->toDateString()) . ' 23:59:59';

        return Transaction::query()
            ->select([
                'customer_id',
                DB::raw('SUM(grand_total) as total_omzet'),
                DB::raw('COUNT(*) as total_transactions'),
                DB::raw('MAX(COALESCE(paid_at, created_at)) as last_visit'),
            ])
            ->with(['customer:id,name,no_telp'])
            ->whereNotNull('customer_id')
            ->where('payment_status', 'paid')
            ->where('status', '!=', 'voided')
            ->whereBetween(
                DB::raw('COALESCE(paid_at, created_at)'),
                [$startDate, $endDate]
            )
            ->when(!empty($filters['cashier_id']), function ($q) use ($filters) {
                $q->where('cashier_id', $filters['cashier_id']);
            })
            ->when(!empty($filters['q']), function ($q) use ($filters) {
                $search = trim($filters['q']);
                $q->whereHas('customer', function ($customerQuery) use ($search) {
                    $customerQuery->where('name', 'like', '%' . $search . '%')
                        ->orWhere('no_telp', 'like', '%' . $search . '%');
                });
            })
            ->groupBy('customer_id')
            ->orderByDesc('total_omzet');
    }

    public function headings(): array
    {
        return [
            'No',
            'Pelanggan',
            'No. HP',
            'Jumlah Transaksi',
            'Total Belanja',
            'Rata-rata',
            'Kunjungan Terakhir',
        ];
    }

    public function map($row): array
    {
        static $no = 0;
        $no++;

        $avg = $row->total_transactions > 0
            ? (int) round($row->total_omzet / $row->total_transactions)
            : 0;

        $lastVisit = $row->last_visit
            ? \Carbon\Carbon::parse($row->last_visit)->format('d/m/Y H:i')
            : '-';

        return [
            $no,
            $row->customer?->name ?? '-',
            $row->customer?->no_telp ?? '-',
            (int) $row->total_transactions,
            (int) $row->total_omzet,
            $avg,
            $lastVisit,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
