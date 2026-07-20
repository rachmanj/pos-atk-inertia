<?php

namespace App\Exports;

use App\Models\Product;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class StockReportExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    public function __construct(
        protected array $filters = []
    ) {}

    public function query()
    {
        $filters = $this->filters;
        $lowThreshold = (int) ($filters['low_threshold'] ?? 10);

        return Product::query()
            ->physical()
            ->with(['category:id,name', 'baseUnit.unit'])
            ->when(!empty($filters['q']), function ($q) use ($filters) {
                $search = trim($filters['q']);
                $q->where(function ($sq) use ($search) {
                    $sq->where('title', 'like', '%' . $search . '%')
                        ->orWhere('barcode', 'like', '%' . $search . '%')
                        ->orWhereHas('category', function ($cq) use ($search) {
                            $cq->where('name', 'like', '%' . $search . '%');
                        });
                });
            })
            ->when(!empty($filters['category_id']), function ($q) use ($filters) {
                $q->where('category_id', $filters['category_id']);
            })
            ->when(!empty($filters['stock_status']), function ($q) use ($filters, $lowThreshold) {
                if ($filters['stock_status'] === 'available') {
                    $q->where('stock', '>', $lowThreshold);
                } elseif ($filters['stock_status'] === 'low') {
                    $q->where('stock', '>', 0)->where('stock', '<=', $lowThreshold);
                } elseif ($filters['stock_status'] === 'out') {
                    $q->where('stock', 0);
                }
            })
            ->orderBy('title');
    }

    public function headings(): array
    {
        return [
            'No',
            'Barcode',
            'Produk',
            'Kategori',
            'Satuan',
            'Stok',
            'HPP / Unit',
            'Nilai Stok (HPP)',
            'Harga Jual',
            'Nilai Stok (Jual)',
            'Status',
        ];
    }

    public function map($row): array
    {
        static $no = 0;
        $no++;

        $baseSellPrice = (int) ($row->baseUnit?->sell_price ?? $row->sell_price);
        $inventoryCostValue = (int) $row->stock * (int) $row->avg_cost;
        $inventorySellValue = (int) $row->stock * $baseSellPrice;
        $lowThreshold = (int) ($this->filters['low_threshold'] ?? 10);

        if ($row->stock <= 0) {
            $status = 'Habis';
        } elseif ($row->stock <= $lowThreshold) {
            $status = 'Menipis';
        } else {
            $status = 'Aman';
        }

        return [
            $no,
            $row->barcode,
            $row->title,
            $row->category?->name ?? '-',
            $row->unit,
            $row->stock,
            $row->avg_cost,
            $inventoryCostValue,
            $baseSellPrice,
            $inventorySellValue,
            $status,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
