<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Unit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class ProductImportTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    public function test_product_import_creates_products_and_skips_existing_barcode(): void
    {
        $user = $this->createCashierUser(['products.create', 'products.index']);

        Unit::create([
            'name' => 'Pieces',
            'abbreviation' => 'pcs',
        ]);

        $catalog = $this->createPhysicalProduct([
            'barcode' => 'EXISTING-001',
        ]);

        $csv = implode("\n", [
            'category,barcode,title,description,buy_price,stock,unit,sell_price',
            'Minuman,NEW-001,Air Mineral 600ml,Botol 600ml,2500,100,pcs,3500',
            'Minuman,EXISTING-001,Duplikat,,2500,10,pcs,3500',
            'Minuman,NEW-002,Teh Botol,,3000,50,pcs,4500',
        ]);

        $file = UploadedFile::fake()->createWithContent('import.csv', $csv);

        $response = $this->actingAs($user)->post(route('account.products.import'), [
            'file' => $file,
        ]);

        $response->assertRedirect(route('account.products.index'));
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('products', [
            'barcode' => 'NEW-001',
            'title' => 'Air Mineral 600ml',
            'stock' => 100,
            'buy_price' => 2500,
            'sell_price' => 3500,
        ]);

        $this->assertDatabaseHas('products', [
            'barcode' => 'NEW-002',
            'title' => 'Teh Botol',
        ]);

        $this->assertDatabaseCount('products', 3);

        $newProduct = Product::where('barcode', 'NEW-001')->firstOrFail();

        $this->assertDatabaseHas('product_units', [
            'product_id' => $newProduct->id,
            'sell_price' => 3500,
            'is_base_unit' => true,
            'is_default_sell' => true,
        ]);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $newProduct->id,
            'type' => 'in',
            'qty' => 100,
            'note' => 'Stok awal import.',
        ]);

        $catalog['product']->refresh();
        $this->assertSame('EXISTING-001', $catalog['product']->barcode);
        $this->assertSame(100, $catalog['product']->stock);
    }

    public function test_product_import_template_is_downloadable(): void
    {
        $user = $this->createCashierUser(['products.create']);

        $response = $this->actingAs($user)->get(route('account.products.import_template'));

        $response->assertOk();
        $response->assertHeader(
            'content-disposition',
            'attachment; filename=template-import-produk.xlsx'
        );
    }
}
