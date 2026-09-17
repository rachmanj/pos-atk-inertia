<?php

namespace App\Exports;

use App\Models\Purchase;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PurchaseTaxReportExport implements FromCollection, ShouldAutoSize, WithStyles, WithTitle
{
    public function __construct(
        protected array $filters = [],
        protected array $summary = [],
    ) {}

    public static function baseQuery(array $filters): Builder
    {
        $startDate = !empty($filters['start_date'])
            ? Carbon::parse($filters['start_date'])->toDateString()
            : Carbon::now()->startOfMonth()->toDateString();

        $endDate = !empty($filters['end_date'])
            ? Carbon::parse($filters['end_date'])->toDateString()
            : Carbon::now()->toDateString();

        return Purchase::query()
            ->whereDate('purchase_date', '>=', $startDate)
            ->whereDate('purchase_date', '<=', $endDate)
            ->when(!empty($filters['supplier_id']), function (Builder $query) use ($filters) {
                $query->where('supplier_id', $filters['supplier_id']);
            });
    }

    public function collection(): Collection
    {
        $startDate = $this->filters['start_date'] ?? now()->startOfMonth()->toDateString();
        $endDate = $this->filters['end_date'] ?? now()->toDateString();

        $rows = collect([
            ['LAPORAN PPN MASUKAN'],
            ['Periode', $startDate, 's/d', $endDate],
            ['Jumlah Nota', (int) ($this->summary['total_count'] ?? 0)],
            ['Total DPP', (int) ($this->summary['total_dpp'] ?? 0)],
            ['Total PPN', (int) ($this->summary['total_tax'] ?? 0)],
            ['Total Dibayar', (int) ($this->summary['total_amount'] ?? 0)],
            ['', '', '', '', '', '', '', '', ''],
            ['No', 'Tanggal', 'Invoice', 'Supplier', 'DPP', 'PPN', 'Total', 'Tarif %', 'Catatan Tarif'],
        ]);

        $no = 0;

        self::baseQuery($this->filters)
            ->with('supplier:id,name')
            ->orderByDesc('purchase_date')
            ->orderByDesc('id')
            ->get()
            ->each(function (Purchase $purchase) use ($rows, &$no) {
                $no++;

                $rows->push([
                    $no,
                    $purchase->purchase_date?->format('d/m/Y') ?? '-',
                    $purchase->invoice,
                    $purchase->supplier?->name ?? '-',
                    (int) $purchase->dpp_amount,
                    (int) $purchase->tax_amount,
                    (int) $purchase->total_amount,
                    $purchase->tax_rate !== null ? (float) $purchase->tax_rate : '-',
                    $this->taxRateNote($purchase),
                ]);
            });

        return $rows;
    }

    public function title(): string
    {
        return 'PPN Masukan';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 14]],
            2 => ['font' => ['bold' => true]],
            3 => ['font' => ['bold' => true]],
            4 => ['font' => ['bold' => true]],
            5 => ['font' => ['bold' => true]],
            6 => ['font' => ['bold' => true]],
            8 => ['font' => ['bold' => true]],
        ];
    }

    protected function taxRateNote(Purchase $purchase): string
    {
        if ((int) $purchase->tax_amount === 0) {
            return 'Tanpa PPN';
        }

        if ($purchase->tax_rate === null) {
            return 'PPN manual';
        }

        $rate = rtrim(rtrim(number_format((float) $purchase->tax_rate, 2, '.', ''), '0'), '.');

        return $purchase->tax_included
            ? "Tarif {$rate}% (harga sudah termasuk PPN)"
            : "Tarif {$rate}%";
    }
}
