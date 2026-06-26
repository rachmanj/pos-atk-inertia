<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\Unit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            ['name' => 'Pieces', 'abbreviation' => 'pcs'],
            ['name' => 'Box', 'abbreviation' => 'box'],
            ['name' => 'Lusin', 'abbreviation' => 'lsn'],
            ['name' => 'Kodi', 'abbreviation' => 'kodi'],
            ['name' => 'Kilogram', 'abbreviation' => 'kg'],
            ['name' => 'Gram', 'abbreviation' => 'gram'],
            ['name' => 'Liter', 'abbreviation' => 'liter'],
            ['name' => 'Mililiter', 'abbreviation' => 'ml'],
        ];

        foreach ($units as $unit) {
            Unit::firstOrCreate(
                ['abbreviation' => $unit['abbreviation']],
                ['name' => $unit['name']],
            );
        }

        $unitMap = Unit::query()->pluck('id', 'abbreviation');

        Product::query()->each(function (Product $product) use ($unitMap) {
            if ($product->productUnits()->exists()) {
                return;
            }

            $abbreviation = strtolower(trim($product->unit ?: 'pcs'));
            $unitId = $unitMap->get($abbreviation);

            if (!$unitId) {
                $customUnit = Unit::firstOrCreate(
                    ['abbreviation' => $abbreviation],
                    ['name' => ucfirst($abbreviation)],
                );
                $unitId = $customUnit->id;
            }

            ProductUnit::create([
                'product_id' => $product->id,
                'unit_id' => $unitId,
                'conversion_factor' => 1,
                'sell_price' => $product->sell_price,
                'is_base_unit' => true,
                'is_default_sell' => true,
            ]);
        });

        DB::table('products')->update([
            'avg_cost' => DB::raw('buy_price'),
        ]);
    }
}
