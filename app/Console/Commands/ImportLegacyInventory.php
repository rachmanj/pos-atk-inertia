<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\Unit;
use App\Services\LegacyInventoryCategoryDetector;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;

class ImportLegacyInventory extends Command
{
    protected $signature = 'inventory:import-legacy
                            {file : Path to legacy .xls export file}
                            {--dry-run : Parse file only, do not write to database}';

    protected $description = 'Import legacy inventory products from old .xls export';

    public function __construct(
        private readonly LegacyInventoryCategoryDetector $categoryDetector,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $file = $this->resolveFilePath((string) $this->argument('file'));

        if (! is_readable($file)) {
            $this->error("File tidak dapat dibaca: {$file}");

            return self::FAILURE;
        }

        $rows = $this->parseLegacyFile($file);

        if ($rows === null) {
            return self::FAILURE;
        }

        $this->info('Baris valid dari Excel: ' . count($rows));

        if ($this->option('dry-run')) {
            $this->table(
                ['Row', 'Barcode', 'Title', 'Sell Price (IDR)'],
                collect($rows)->take(10)->map(fn (array $row) => [
                    $row['row'],
                    $row['barcode'],
                    $row['title'],
                    number_format($row['sell_price'], 0, ',', '.'),
                ])->all()
            );

            return self::SUCCESS;
        }

        $unit = Unit::query()->where('abbreviation', 'pcs')->first();

        if ($unit === null) {
            $unit = Unit::create([
                'name' => 'Pieces',
                'abbreviation' => 'pcs',
            ]);
            $this->warn('Unit pcs tidak ditemukan, dibuat otomatis.');
        }

        $imported = 0;
        $skipped = 0;
        $errors = 0;

        $bar = $this->output->createProgressBar(count($rows));
        $bar->start();

        foreach ($rows as $row) {
            $bar->advance();

            if (Product::where('barcode', $row['barcode'])->exists()) {
                $skipped++;

                continue;
            }

            try {
                DB::transaction(function () use ($row, $unit) {
                    $categoryName = $this->categoryDetector->detect($row['title']);
                    $category = Category::firstOrCreate(['name' => $categoryName]);

                    $slug = $this->uniqueSlug($row['title'], $row['barcode']);

                    $product = Product::create([
                        'category_id' => $category->id,
                        'barcode' => $row['barcode'],
                        'title' => $row['title'],
                        'slug' => $slug,
                        'description' => null,
                        'product_type' => 'physical',
                        'buy_price' => 0,
                        'sell_price' => $row['sell_price'],
                        'avg_cost' => 0,
                        'unit' => $unit->abbreviation,
                        'stock' => 0,
                        'is_active' => true,
                    ]);

                    ProductUnit::create([
                        'product_id' => $product->id,
                        'unit_id' => $unit->id,
                        'conversion_factor' => 1,
                        'sell_price' => $row['sell_price'],
                        'is_base_unit' => true,
                        'is_default_sell' => true,
                    ]);
                });

                $imported++;
            } catch (\Throwable $exception) {
                $errors++;
                $this->newLine();
                $this->warn("Baris {$row['row']} ({$row['barcode']}): {$exception->getMessage()}");
            }
        }

        $bar->finish();
        $this->newLine(2);

        $this->info("Import selesai.");
        $this->line("  Diimpor : {$imported}");
        $this->line("  Dilewati: {$skipped} (barcode sudah ada)");
        $this->line("  Gagal   : {$errors}");
        $this->line('  Total produk di database: ' . Product::count());

        return $errors > 0 ? self::FAILURE : self::SUCCESS;
    }

    private function resolveFilePath(string $file): string
    {
        if (is_file($file)) {
            return $file;
        }

        $storagePath = storage_path('app/' . ltrim($file, '/'));

        return is_file($storagePath) ? $storagePath : $file;
    }

    /**
     * @return list<array{row: int, barcode: string, title: string, sell_price: int}>|null
     */
    private function parseLegacyFile(string $file): ?array
    {
        $script = base_path('tools/parse_legacy_inventory_xls.py');
        $python = $this->pythonBinary();

        $process = new Process([$python, $script, $file]);
        $process->setTimeout(300);
        $process->run();

        if (! $process->isSuccessful()) {
            $this->error('Gagal membaca file Excel:');
            $this->line(trim($process->getErrorOutput() ?: $process->getOutput()));

            return null;
        }

        $decoded = json_decode($process->getOutput(), true);

        if (! is_array($decoded)) {
            $this->error('Output parser tidak valid.');

            return null;
        }

        return $decoded;
    }

    private function pythonBinary(): string
    {
        $candidates = [
            base_path('.venv/bin/python3'),
            '/usr/bin/python3',
            'python3',
        ];

        foreach ($candidates as $candidate) {
            if ($candidate === 'python3' || is_executable($candidate)) {
                return $candidate;
            }
        }

        return 'python3';
    }

    private function uniqueSlug(string $title, string $barcode): string
    {
        $slug = Str::slug($title);

        if ($slug === '') {
            $slug = 'produk-' . Str::slug($barcode);
        }

        if (! Product::where('slug', $slug)->exists()) {
            return $slug;
        }

        $suffix = Str::slug($barcode);

        return Str::slug($title . '-' . $suffix);
    }
}
