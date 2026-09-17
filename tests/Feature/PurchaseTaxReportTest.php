<?php

namespace Tests\Feature;

use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class PurchaseTaxReportTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    protected function createReportUser(): User
    {
        return $this->createCashierUser(['purchases.index']);
    }

    protected function createSupplier(string $name = 'Supplier Test'): Supplier
    {
        return Supplier::create([
            'name' => $name,
            'no_telp' => '08123456789',
            'email' => strtolower(str_replace(' ', '-', $name)) . '@example.com',
            'address' => 'Jl. Test No. 1',
            'is_active' => true,
        ]);
    }

    protected function createPurchaseRecord(
        User $user,
        Supplier $supplier,
        string $invoice,
        string $purchaseDate,
        int $dppAmount,
        int $taxAmount,
        ?float $taxRate = null,
    ): Purchase {
        $totalAmount = $dppAmount + $taxAmount;

        return Purchase::create([
            'supplier_id' => $supplier->id,
            'user_id' => $user->id,
            'invoice' => $invoice,
            'purchase_date' => $purchaseDate,
            'total_items' => 1,
            'total_qty' => 1,
            'dpp_amount' => $dppAmount,
            'tax_amount' => $taxAmount,
            'tax_rate' => $taxRate,
            'tax_included' => false,
            'hpp_includes_tax' => true,
            'total_amount' => $totalAmount,
        ]);
    }

    public function test_report_page_defaults_to_current_month(): void
    {
        $user = $this->createReportUser();

        $this->actingAs($user)
            ->get(route('account.reports.purchase-tax'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.start_date', now()->startOfMonth()->toDateString())
                ->where('filters.end_date', now()->toDateString()));
    }

    public function test_report_summary_aggregates_tax_and_non_tax_purchases_in_period(): void
    {
        $user = $this->createReportUser();
        $supplier = $this->createSupplier();

        $inPeriodDate = now()->toDateString();
        $outOfPeriodDate = now()->copy()->subMonths(2)->toDateString();

        $this->createPurchaseRecord($user, $supplier, 'PO-TAX-001', $inPeriodDate, 100_000, 11_000, 11.0);
        $this->createPurchaseRecord($user, $supplier, 'PO-NO-TAX-001', $inPeriodDate, 50_000, 0);
        $this->createPurchaseRecord($user, $supplier, 'PO-OLD-001', $outOfPeriodDate, 200_000, 22_000, 11.0);

        $this->actingAs($user)
            ->get(route('account.reports.purchase-tax', [
                'start_date' => now()->startOfMonth()->toDateString(),
                'end_date' => now()->toDateString(),
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('summary.total_count', 2)
                ->where('summary.total_dpp', 150_000)
                ->where('summary.total_tax', 11_000)
                ->where('summary.total_amount', 161_000)
                ->has('purchases.data', 2));
    }

    public function test_report_purchase_date_is_parseable_for_frontend(): void
    {
        Carbon::setTestNow('2026-09-17 14:30:00');

        $user = $this->createReportUser();
        $supplier = $this->createSupplier();

        $this->createPurchaseRecord($user, $supplier, 'PO-DATE-001', '2026-09-17', 100_000, 11_000, 11.0);

        $response = $this->actingAs($user)
            ->get(route('account.reports.purchase-tax', [
                'start_date' => '2026-09-01',
                'end_date' => '2026-09-30',
            ]));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('purchases.data', 1)
                ->where('purchases.data.0.invoice', 'PO-DATE-001'));

        $purchase = Purchase::query()->where('invoice', 'PO-DATE-001')->firstOrFail();
        $this->assertSame('2026-09-17', $purchase->purchase_date->toDateString());

        $purchaseDate = $response->original->getData()['page']['props']['purchases']['data'][0]['purchase_date'];
        $this->assertNotEmpty($purchaseDate);
        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}(T|\s|$)/',
            $purchaseDate,
            'purchase_date must be YYYY-MM-DD or ISO datetime for frontend Date parsing',
        );

        Carbon::setTestNow();
    }

    public function test_report_filters_by_supplier(): void
    {
        $user = $this->createReportUser();
        $supplierA = $this->createSupplier('Supplier A');
        $supplierB = $this->createSupplier('Supplier B');
        $date = now()->toDateString();

        $this->createPurchaseRecord($user, $supplierA, 'PO-A-001', $date, 100_000, 11_000, 11.0);
        $this->createPurchaseRecord($user, $supplierB, 'PO-B-001', $date, 80_000, 0);

        $this->actingAs($user)
            ->get(route('account.reports.purchase-tax', [
                'start_date' => now()->startOfMonth()->toDateString(),
                'end_date' => now()->toDateString(),
                'supplier_id' => $supplierA->id,
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('summary.total_count', 1)
                ->where('summary.total_dpp', 100_000)
                ->where('summary.total_tax', 11_000)
                ->where('summary.total_amount', 111_000)
                ->has('purchases.data', 1)
                ->where('purchases.data.0.invoice', 'PO-A-001'));
    }

    public function test_export_contains_matching_summary_numbers(): void
    {
        Carbon::setTestNow('2026-09-17 10:00:00');

        $user = $this->createReportUser();
        $supplier = $this->createSupplier();

        $this->createPurchaseRecord($user, $supplier, 'PO-TAX-EXP', '2026-09-10', 100_000, 11_000, 11.0);
        $this->createPurchaseRecord($user, $supplier, 'PO-NOTAX-EXP', '2026-09-12', 50_000, 0);
        $this->createPurchaseRecord($user, $supplier, 'PO-OLD-EXP', '2026-07-01', 200_000, 22_000, 11.0);

        $response = $this->actingAs($user)
            ->get(route('account.reports.purchase-tax.export', [
                'start_date' => '2026-09-01',
                'end_date' => '2026-09-30',
            ]));

        $response->assertOk();
        $response->assertDownload();

        $tempFile = tempnam(sys_get_temp_dir(), 'purchase-tax-export') . '.xlsx';
        file_put_contents($tempFile, $response->streamedContent());

        $sheet = IOFactory::load($tempFile)->getActiveSheet();

        $this->assertSame('2', (string) $sheet->getCell('B3')->getValue());
        $this->assertSame(150_000, (int) $sheet->getCell('B4')->getValue());
        $this->assertSame(11_000, (int) $sheet->getCell('B5')->getValue());
        $this->assertSame(161_000, (int) $sheet->getCell('B6')->getValue());

        $invoiceValues = array_values(array_filter(
            array_column($sheet->rangeToArray('C9:C20', null, true, false), 0),
            fn ($value) => is_string($value) && str_starts_with($value, 'PO-'),
        ));

        $this->assertCount(2, $invoiceValues);
        $this->assertContains('PO-TAX-EXP', $invoiceValues);
        $this->assertContains('PO-NOTAX-EXP', $invoiceValues);
        $this->assertNotContains('PO-OLD-EXP', $invoiceValues);

        @unlink($tempFile);
        Carbon::setTestNow();
    }

    public function test_guest_cannot_access_report(): void
    {
        $this->get(route('account.reports.purchase-tax'))
            ->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_access_report(): void
    {
        $user = $this->createCashierUser(['transactions.create']);

        $this->actingAs($user)
            ->get(route('account.reports.purchase-tax'))
            ->assertForbidden();
    }
}
