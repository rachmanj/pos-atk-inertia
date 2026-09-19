<?php

namespace App\Exports;

use App\Services\PpobReportRekapKasirBuilder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PpobReportRekapKasirSheetExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithTitle
{
    public function __construct(
        protected array $filters = []
    ) {}

    public function title(): string
    {
        return 'Rekap per Kasir';
    }

    public function collection(): Collection
    {
        $filters = $this->filters;

        $startDate = Carbon::parse($filters['start_date'] ?? now()->toDateString())->startOfDay();
        $endDate = Carbon::parse($filters['end_date'] ?? now()->toDateString())->endOfDay();
        $cashierId = !empty($filters['cashier_id']) ? (int) $filters['cashier_id'] : null;

        return PpobReportRekapKasirBuilder::build($startDate, $endDate, $cashierId);
    }

    public function headings(): array
    {
        return [
            'No',
            'Kasir',
            'Total Harga Dasar PPOB',
            'Total Penjualan',
            'Keterangan',
        ];
    }

    public function map($row): array
    {
        static $no = 0;
        $no++;

        return [
            $no,
            $row['cashier_name'],
            $row['total_harga_dasar'],
            $row['total_penjualan'],
            $row['has_expense'] ? 'pengeluaran PPOB' : '',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
