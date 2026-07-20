<?php

namespace App\Exports;

use App\Models\Profit;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProfitReportExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    public function __construct(
        protected array $filters = []
    ) {}

    public function query()
    {
        $filters = $this->filters;
        $startDate = $filters['start_date'] ?? now()->startOfMonth()->toDateString();
        $endDate = $filters['end_date'] ?? now()->toDateString();

        return Profit::query()
            ->with([
                'transaction:id,invoice,cashier_id,customer_id,payment_method,paid_at,created_at',
                'transaction.cashier:id,name',
                'transaction.customer:id,name',
            ])
            ->whereHas('transaction', function ($q) use ($filters, $startDate, $endDate) {
                $q->where('payment_status', 'paid')
                    ->where('status', '!=', 'voided')
                    ->whereBetween(
                        \Illuminate\Support\Facades\DB::raw('COALESCE(transactions.paid_at, transactions.created_at)'),
                        [$startDate . ' 00:00:00', $endDate . ' 23:59:59']
                    )
                    ->when(!empty($filters['cashier_id']), function ($sq) use ($filters) {
                        $sq->where('cashier_id', $filters['cashier_id']);
                    });
            })
            ->orderByDesc('id');
    }

    public function headings(): array
    {
        return [
            'No',
            'Invoice',
            'Tanggal',
            'Pendapatan',
            'HPP (COGS)',
            'Laba Kotor',
            'Margin %',
        ];
    }

    public function map($row): array
    {
        static $no = 0;
        $no++;

        $margin = $row->total_revenue > 0
            ? round(($row->profit_amount / $row->total_revenue) * 100, 1)
            : 0;

        return [
            $no,
            $row->transaction?->invoice ?? '-',
            $row->transaction?->paid_at
                ? $row->transaction->paid_at->format('d/m/Y H:i')
                : ($row->transaction?->created_at?->format('d/m/Y H:i') ?? '-'),
            $row->total_revenue,
            $row->total_cost,
            $row->profit_amount,
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
