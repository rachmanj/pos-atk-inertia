<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ProductImportTemplate implements FromArray, WithHeadings
{
    public function headings(): array
    {
        return [
            'category',
            'barcode',
            'title',
            'description',
            'buy_price',
            'stock',
            'unit',
            'sell_price',
        ];
    }

    public function array(): array
    {
        return [
            [
                'Minuman',
                '8998866112345',
                'Air Mineral 600ml',
                'Botol 600ml',
                2500,
                100,
                'pcs',
                3500,
            ],
        ];
    }
}
