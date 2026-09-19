<?php

namespace Tests\Feature;

use App\Models\Purchase;
use App\Models\PurchasePayment;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class PurchasePaymentTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    protected function createPurchaseUser(array $permissions): User
    {
        $this->seedPermissions($permissions);

        $role = Role::findOrCreate(config('roles.admin', 'admin'));
        $role->syncPermissions($permissions);

        $user = User::create([
            'name' => 'Purchase User',
            'username' => 'purchase-user-' . uniqid(),
            'email' => 'purchase-user-' . uniqid() . '@example.com',
            'password' => Hash::make('password'),
        ]);

        $user->assignRole($role);

        return $user;
    }

    protected function createSupplier(): Supplier
    {
        return Supplier::create([
            'name' => 'Supplier Test',
            'no_telp' => '08123456789',
            'email' => 'supplier-' . uniqid() . '@example.com',
            'address' => 'Jl. Test No. 1',
            'is_active' => true,
        ]);
    }

    protected function purchasePayload(Supplier $supplier, array $productBundle, array $overrides = []): array
    {
        return array_merge([
            'supplier_id' => $supplier->id,
            'purchase_date' => '2026-09-19',
            'items' => [
                [
                    'product_id' => $productBundle['product']->id,
                    'unit_id' => $productBundle['unit']->id,
                    'conversion_factor' => 1,
                    'qty' => 10,
                    'buy_price' => 5_000,
                ],
            ],
        ], $overrides);
    }

    public function test_store_sets_unpaid_and_due_date_from_payment_term_days(): void
    {
        $user = $this->createPurchaseUser(['purchases.create', 'purchases.show']);
        $supplier = $this->createSupplier();
        $bundle = $this->createPhysicalProduct();

        $this->actingAs($user)->post(route('account.purchases.store'), $this->purchasePayload($supplier, $bundle, [
            'payment_term' => '30',
        ]))->assertRedirect();

        $purchase = Purchase::query()->firstOrFail();

        $this->assertSame('unpaid', $purchase->payment_status);
        $this->assertSame(30, $purchase->payment_term_days);
        $this->assertSame('2026-10-19', $purchase->due_date->toDateString());
    }

    public function test_store_cash_payment_term_marks_purchase_paid(): void
    {
        $user = $this->createPurchaseUser(['purchases.create', 'purchases.show']);
        $supplier = $this->createSupplier();
        $bundle = $this->createPhysicalProduct();

        $this->actingAs($user)->post(route('account.purchases.store'), $this->purchasePayload($supplier, $bundle, [
            'payment_term' => '0',
        ]))->assertRedirect();

        $purchase = Purchase::query()->firstOrFail();

        $this->assertSame('paid', $purchase->payment_status);
        $this->assertSame(0, $purchase->payment_term_days);
        $this->assertNull($purchase->due_date);
    }

    public function test_store_uses_manual_due_date(): void
    {
        $user = $this->createPurchaseUser(['purchases.create', 'purchases.show']);
        $supplier = $this->createSupplier();
        $bundle = $this->createPhysicalProduct();

        $this->actingAs($user)->post(route('account.purchases.store'), $this->purchasePayload($supplier, $bundle, [
            'payment_term' => '2026-11-05',
        ]))->assertRedirect();

        $purchase = Purchase::query()->firstOrFail();

        $this->assertSame('unpaid', $purchase->payment_status);
        $this->assertNull($purchase->payment_term_days);
        $this->assertSame('2026-11-05', $purchase->due_date->toDateString());
    }

    public function test_store_defaults_payment_term_to_thirty_days_when_empty(): void
    {
        $user = $this->createPurchaseUser(['purchases.create', 'purchases.show']);
        $supplier = $this->createSupplier();
        $bundle = $this->createPhysicalProduct();

        $this->actingAs($user)->post(route('account.purchases.store'), $this->purchasePayload($supplier, $bundle))
            ->assertRedirect();

        $purchase = Purchase::query()->firstOrFail();

        $this->assertSame('unpaid', $purchase->payment_status);
        $this->assertSame(30, $purchase->payment_term_days);
        $this->assertSame('2026-10-19', $purchase->due_date->toDateString());
    }

    public function test_show_includes_can_record_payment_when_user_can_edit(): void
    {
        $user = $this->createPurchaseUser(['purchases.create', 'purchases.edit', 'purchases.show']);
        $supplier = $this->createSupplier();
        $bundle = $this->createPhysicalProduct();

        $this->actingAs($user)->post(route('account.purchases.store'), $this->purchasePayload($supplier, $bundle, [
            'payment_term' => '30',
        ]));

        $purchase = Purchase::query()->firstOrFail();

        $this->actingAs($user)
            ->get(route('account.purchases.show', $purchase->invoice))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('canRecordPayment', true)
                ->where('purchase.payment_status', 'unpaid')
                ->where('purchase.paid_amount_sum', null));
    }

    public function test_show_can_record_payment_false_without_edit_permission(): void
    {
        $user = $this->createPurchaseUser(['purchases.create', 'purchases.show']);
        $supplier = $this->createSupplier();
        $bundle = $this->createPhysicalProduct();

        $this->actingAs($user)->post(route('account.purchases.store'), $this->purchasePayload($supplier, $bundle));

        $purchase = Purchase::query()->firstOrFail();

        $this->actingAs($user)
            ->get(route('account.purchases.show', $purchase->invoice))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('canRecordPayment', false));
    }

    public function test_partial_and_full_payments_update_status_and_balances(): void
    {
        $user = $this->createPurchaseUser(['purchases.create', 'purchases.edit', 'purchases.show']);
        $supplier = $this->createSupplier();
        $bundle = $this->createPhysicalProduct();

        $this->actingAs($user)->post(route('account.purchases.store'), $this->purchasePayload($supplier, $bundle, [
            'payment_term' => '30',
        ]));

        $purchase = Purchase::query()->firstOrFail();
        $total = (int) $purchase->total_amount;

        $this->actingAs($user)->post(route('account.purchases.payments.store', $purchase->invoice), [
            'paid_on' => '2026-09-20',
            'amount' => 20_000,
            'method' => 'transfer',
        ])->assertRedirect()->assertSessionHas('success');

        $purchase->refresh();
        $this->assertSame('partial', $purchase->payment_status);
        $this->assertSame(20_000, $purchase->paidAmount());
        $this->assertSame($total - 20_000, $purchase->remaining());

        $this->actingAs($user)->post(route('account.purchases.payments.store', $purchase->invoice), [
            'paid_on' => '2026-09-25',
            'amount' => $purchase->remaining(),
            'method' => 'tunai',
        ])->assertRedirect();

        $purchase->refresh();
        $this->assertSame('paid', $purchase->payment_status);
        $this->assertSame($total, $purchase->paidAmount());
        $this->assertSame(0, $purchase->remaining());
    }

    public function test_payment_over_remaining_is_rejected(): void
    {
        $user = $this->createPurchaseUser(['purchases.create', 'purchases.edit']);
        $supplier = $this->createSupplier();
        $bundle = $this->createPhysicalProduct();

        $this->actingAs($user)->post(route('account.purchases.store'), $this->purchasePayload($supplier, $bundle, [
            'payment_term' => '14',
        ]));

        $purchase = Purchase::query()->firstOrFail();

        $this->actingAs($user)->from(route('account.purchases.show', $purchase->invoice))
            ->post(route('account.purchases.payments.store', $purchase->invoice), [
                'paid_on' => '2026-09-20',
                'amount' => $purchase->remaining() + 1,
                'method' => 'tunai',
            ])
            ->assertSessionHasErrors('amount');
    }

    public function test_payment_on_fully_paid_purchase_is_rejected(): void
    {
        $user = $this->createPurchaseUser(['purchases.create', 'purchases.edit']);
        $supplier = $this->createSupplier();
        $bundle = $this->createPhysicalProduct();

        $this->actingAs($user)->post(route('account.purchases.store'), $this->purchasePayload($supplier, $bundle, [
            'payment_term' => '0',
        ]));

        $purchase = Purchase::query()->firstOrFail();

        $this->actingAs($user)->from(route('account.purchases.show', $purchase->invoice))
            ->post(route('account.purchases.payments.store', $purchase->invoice), [
                'paid_on' => '2026-09-20',
                'amount' => 1_000,
                'method' => 'tunai',
            ])
            ->assertSessionHasErrors('amount');
    }

    public function test_payables_report_lists_only_unpaid_invoices_with_buckets_and_total(): void
    {
        Carbon::setTestNow('2026-09-19 10:00:00');

        $user = $this->createPurchaseUser(['purchases.index', 'purchases.edit']);
        $supplier = $this->createSupplier();

        Purchase::create([
            'supplier_id' => $supplier->id,
            'user_id' => $user->id,
            'invoice' => 'PUR-PAID-001',
            'purchase_date' => '2026-09-10',
            'total_items' => 1,
            'total_qty' => 1,
            'total_amount' => 100_000,
            'dpp_amount' => 100_000,
            'tax_amount' => 0,
            'payment_status' => 'paid',
            'due_date' => null,
        ]);

        Purchase::create([
            'supplier_id' => $supplier->id,
            'user_id' => $user->id,
            'invoice' => 'PUR-OPEN-NOT-DUE',
            'purchase_date' => '2026-09-15',
            'total_items' => 1,
            'total_qty' => 1,
            'total_amount' => 200_000,
            'dpp_amount' => 200_000,
            'tax_amount' => 0,
            'payment_status' => 'unpaid',
            'due_date' => '2026-10-01',
        ]);

        $overdueRecent = Purchase::create([
            'supplier_id' => $supplier->id,
            'user_id' => $user->id,
            'invoice' => 'PUR-OPEN-1-30',
            'purchase_date' => '2026-09-08',
            'total_items' => 1,
            'total_qty' => 1,
            'total_amount' => 300_000,
            'dpp_amount' => 300_000,
            'tax_amount' => 0,
            'payment_status' => 'unpaid',
            'due_date' => '2026-09-05',
        ]);

        Purchase::create([
            'supplier_id' => $supplier->id,
            'user_id' => $user->id,
            'invoice' => 'PUR-OPEN-OVER-30',
            'purchase_date' => '2026-09-02',
            'total_items' => 1,
            'total_qty' => 1,
            'total_amount' => 400_000,
            'dpp_amount' => 400_000,
            'tax_amount' => 0,
            'payment_status' => 'partial',
            'due_date' => '2026-08-01',
        ]);

        PurchasePayment::create([
            'purchase_id' => $overdueRecent->id,
            'user_id' => $user->id,
            'paid_on' => '2026-09-10',
            'amount' => 50_000,
            'method' => 'transfer',
        ]);

        $this->actingAs($user)
            ->get(route('account.reports.purchase-payables', [
                'start_date' => '2026-09-01',
                'end_date' => '2026-09-30',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('summary.total_payable', 850_000)
                ->where('summary.invoice_count', 3)
                ->where('summary.buckets.not_due.count', 1)
                ->where('summary.buckets.not_due.total_remaining', 200_000)
                ->where('summary.buckets.1_30.count', 1)
                ->where('summary.buckets.1_30.total_remaining', 250_000)
                ->where('summary.buckets.over_30.count', 1)
                ->where('summary.buckets.over_30.total_remaining', 400_000)
                ->has('purchases.data', 3)
                ->where('canRecordPayment', true));

        Carbon::setTestNow();
    }

    public function test_dashboard_includes_due_soon_payables(): void
    {
        Carbon::setTestNow('2026-09-19 10:00:00');

        $user = $this->createPurchaseUser(['dashboard.index', 'purchases.index']);

        $supplier = $this->createSupplier();

        Purchase::create([
            'supplier_id' => $supplier->id,
            'user_id' => $user->id,
            'invoice' => 'PUR-DUE-SOON-1',
            'purchase_date' => '2026-09-01',
            'total_items' => 1,
            'total_qty' => 1,
            'total_amount' => 150_000,
            'dpp_amount' => 150_000,
            'tax_amount' => 0,
            'payment_status' => 'unpaid',
            'due_date' => '2026-09-24',
        ]);

        Purchase::create([
            'supplier_id' => $supplier->id,
            'user_id' => $user->id,
            'invoice' => 'PUR-DUE-LATER',
            'purchase_date' => '2026-09-01',
            'total_items' => 1,
            'total_qty' => 1,
            'total_amount' => 500_000,
            'dpp_amount' => 500_000,
            'tax_amount' => 0,
            'payment_status' => 'unpaid',
            'due_date' => '2026-10-15',
        ]);

        $this->actingAs($user)
            ->get(route('account.dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('dueSoonPayables.invoice_count', 1)
                ->where('dueSoonPayables.total_remaining', 150_000));

        Carbon::setTestNow();
    }

    public function test_dashboard_due_soon_payables_empty_when_no_upcoming_invoices(): void
    {
        Carbon::setTestNow('2026-09-19 10:00:00');

        $user = $this->createPurchaseUser(['dashboard.index']);

        $this->actingAs($user)
            ->get(route('account.dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('dueSoonPayables.invoice_count', 0)
                ->where('dueSoonPayables.total_remaining', 0));

        Carbon::setTestNow();
    }

    public function test_user_without_edit_permission_cannot_record_payment(): void
    {
        $user = $this->createPurchaseUser(['purchases.create']);
        $supplier = $this->createSupplier();
        $bundle = $this->createPhysicalProduct();

        $this->actingAs($user)->post(route('account.purchases.store'), $this->purchasePayload($supplier, $bundle, [
            'payment_term' => '30',
        ]));

        $purchase = Purchase::query()->firstOrFail();

        $this->actingAs($user)
            ->post(route('account.purchases.payments.store', $purchase->invoice), [
                'paid_on' => '2026-09-20',
                'amount' => 10_000,
                'method' => 'tunai',
            ])
            ->assertForbidden();
    }

    public function test_destroy_payment_recalculates_status(): void
    {
        $user = $this->createPurchaseUser(['purchases.create', 'purchases.edit']);
        $supplier = $this->createSupplier();
        $bundle = $this->createPhysicalProduct();

        $this->actingAs($user)->post(route('account.purchases.store'), $this->purchasePayload($supplier, $bundle, [
            'payment_term' => '30',
        ]));

        $purchase = Purchase::query()->firstOrFail();

        $this->actingAs($user)->post(route('account.purchases.payments.store', $purchase->invoice), [
            'paid_on' => '2026-09-20',
            'amount' => $purchase->remaining(),
            'method' => 'tunai',
        ]);

        $purchase->refresh();
        $this->assertSame('paid', $purchase->payment_status);

        $payment = PurchasePayment::query()->where('purchase_id', $purchase->id)->firstOrFail();

        $this->actingAs($user)
            ->delete(route('account.purchases.payments.destroy', [$purchase->invoice, $payment->id]))
            ->assertRedirect()
            ->assertSessionHas('success');

        $purchase->refresh();
        $this->assertSame('unpaid', $purchase->payment_status);
    }
}
