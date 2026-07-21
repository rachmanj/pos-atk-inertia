<?php

namespace App\Exports;

use App\Models\Expense;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ExpenseReportExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    public function __construct(
        protected array $filters = []
    ) {}

    public function query()
    {
        $filters = $this->filters;
        $startDate = $filters['start_date'] ?? now()->startOfMonth()->toDateString();
        $endDate = $filters['end_date'] ?? now()->toDateString();

        return Expense::query()
            ->with(['user:id,name'])
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->when(!empty($filters['cashier_id']), function ($q) use ($filters) {
                $q->where('user_id', $filters['cashier_id']);
            })
            ->when(!empty($filters['category']), function ($q) use ($filters) {
                $q->where('category', $filters['category']);
            })
            ->when(!empty($filters['q']), function ($q) use ($filters) {
                $search = trim($filters['q']);
                $q->where(function ($searchQuery) use ($search) {
                    $searchQuery->where('title', 'like', '%' . $search . '%')
                        ->orWhere('code', 'like', '%' . $search . '%')
                        ->orWhere('note', 'like', '%' . $search . '%');
                });
            })
            ->orderByDesc('expense_date')
            ->orderByDesc('id');
    }

    public function headings(): array
    {
        return [
            'No',
            'Kode',
            'Tanggal',
            'Kategori',
            'Judul',
            'Jumlah',
            'Petugas',
            'Catatan',
        ];
    }

    public function map($row): array
    {
        static $no = 0;
        $no++;

        return [
            $no,
            $row->code,
            $row->expense_date?->format('d/m/Y') ?? $row->expense_date,
            $row->category,
            $row->title,
            (int) $row->amount,
            $row->user?->name ?? '-',
            $row->note ?? '',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
