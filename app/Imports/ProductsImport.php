<?php

namespace App\Imports;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\StockMovement;
use App\Models\Unit;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ProductsImport implements ToCollection, WithHeadingRow
{
    public int $created = 0;

    public int $skipped = 0;

    /** @var array<int, string> */
    public array $errors = [];

    /** @var array<int, string> */
    protected array $seenBarcodes = [];

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;
            $this->processRow($row, $rowNumber);
        }
    }

    protected function processRow(Collection $row, int $rowNumber): void
    {
        $data = $this->normalizeRow($row);

        if ($this->isEmptyRow($data)) {
            return;
        }

        $validationError = $this->validateRow($data);

        if ($validationError !== null) {
            $this->errors[] = "Baris {$rowNumber}: {$validationError}";

            return;
        }

        $barcode = $data['barcode'];

        if (in_array($barcode, $this->seenBarcodes, true)) {
            $this->skipped++;
            $this->errors[] = "Baris {$rowNumber}: Barcode '{$barcode}' duplikat dalam file, dilewati.";

            return;
        }

        if (Product::where('barcode', $barcode)->exists()) {
            $this->skipped++;
            $this->errors[] = "Baris {$rowNumber}: Barcode '{$barcode}' sudah ada di database, dilewati.";

            return;
        }

        try {
            DB::transaction(function () use ($data, $barcode) {
                $category = Category::firstOrCreate([
                    'name' => $data['category'],
                ]);

                $unit = Unit::query()
                    ->where('abbreviation', $data['unit'])
                    ->firstOrFail();

                $buyPrice = (int) $data['buy_price'];
                $sellPrice = (int) $data['sell_price'];
                $stock = (int) $data['stock'];

                $product = Product::create([
                    'category_id' => $category->id,
                    'barcode' => $barcode,
                    'title' => $data['title'],
                    'description' => $data['description'] ?: null,
                    'product_type' => 'physical',
                    'buy_price' => $buyPrice,
                    'sell_price' => $sellPrice,
                    'avg_cost' => $buyPrice,
                    'unit' => $unit->abbreviation,
                    'stock' => $stock,
                    'is_active' => true,
                ]);

                ProductUnit::create([
                    'product_id' => $product->id,
                    'unit_id' => $unit->id,
                    'conversion_factor' => 1,
                    'sell_price' => $sellPrice,
                    'is_base_unit' => true,
                    'is_default_sell' => true,
                ]);

                if ($stock > 0) {
                    StockMovement::create([
                        'product_id' => $product->id,
                        'user_id' => Auth::id(),
                        'type' => 'in',
                        'qty' => $stock,
                        'stock_before' => 0,
                        'stock_after' => $stock,
                        'reference_type' => null,
                        'reference_id' => null,
                        'note' => 'Stok awal import.',
                    ]);
                }

                $this->seenBarcodes[] = $barcode;
                $this->created++;
            });
        } catch (\Throwable $exception) {
            $this->errors[] = "Baris {$rowNumber}: {$exception->getMessage()}";
        }
    }

    /**
     * @return array<string, mixed>
     */
    protected function normalizeRow(Collection $row): array
    {
        return [
            'category' => trim((string) ($row['category'] ?? '')),
            'barcode' => trim((string) ($row['barcode'] ?? '')),
            'title' => trim((string) ($row['title'] ?? '')),
            'description' => trim((string) ($row['description'] ?? '')),
            'buy_price' => $this->normalizeInteger($row['buy_price'] ?? null),
            'stock' => $this->normalizeInteger($row['stock'] ?? null),
            'unit' => strtolower(trim((string) ($row['unit'] ?? ''))),
            'sell_price' => $this->normalizeInteger($row['sell_price'] ?? null),
        ];
    }

    protected function normalizeInteger(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            return (int) round((float) $value);
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function isEmptyRow(array $data): bool
    {
        return $data['barcode'] === ''
            && $data['title'] === ''
            && $data['category'] === '';
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function validateRow(array $data): ?string
    {
        if ($data['category'] === '') {
            return 'Kategori wajib diisi.';
        }

        if ($data['barcode'] === '') {
            return 'Barcode wajib diisi.';
        }

        if ($data['title'] === '') {
            return 'Nama produk wajib diisi.';
        }

        if ($data['buy_price'] === null || $data['buy_price'] < 0) {
            return 'Harga beli wajib diisi dan tidak boleh negatif.';
        }

        if ($data['stock'] === null || $data['stock'] < 0) {
            return 'Stok wajib diisi dan tidak boleh negatif.';
        }

        if ($data['unit'] === '') {
            return 'Satuan wajib diisi.';
        }

        if (! Unit::query()->where('abbreviation', $data['unit'])->exists()) {
            return "Satuan '{$data['unit']}' tidak ditemukan. Gunakan singkatan satuan yang sudah terdaftar.";
        }

        if ($data['sell_price'] === null || $data['sell_price'] <= 0) {
            return 'Harga jual wajib diisi dan harus lebih dari 0.';
        }

        if ($data['sell_price'] < $data['buy_price']) {
            return 'Harga jual tidak boleh lebih rendah dari harga beli.';
        }

        return null;
    }
}
