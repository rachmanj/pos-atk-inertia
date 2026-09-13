<?php

namespace Tests\Feature;

use App\Models\Transaction;
use App\Models\TransactionDetail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class SalesReportPpobSplitChartTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    public function test_sales_report_splits_store_and_ppob_sales_by_day(): void
    {
        $user = $this->createCashierUser(['reports.sales']);
        $physical = $this->createPhysicalProduct();
        $ppob = $this->createPpobProduct();

        $paidAt = now();
        $transactionDate = $paidAt->toDateString();

        $transaction = Transaction::create([
            'cashier_id' => $user->id,
            'invoice' => 'TRX-SPLIT-' . uniqid(),
            'cash' => 122_000,
            'change' => 0,
            'discount' => 0,
            'grand_total' => 122_000,
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'status' => 'completed',
            'paid_at' => $paidAt,
        ]);

        $this->createTransactionDetail($transaction, $physical['product'], $physical['unit'], [
            'price' => 17_000,
            'subtotal' => 17_000,
        ]);

        TransactionDetail::create([
            'transaction_id' => $transaction->id,
            'product_id' => $ppob['product']->id,
            'conversion_factor' => 1,
            'qty' => 1,
            'price' => 105_000,
            'buy_price' => 0,
            'subtotal' => 105_000,
        ]);

        $this->actingAs($user)
            ->get(route('account.reports.sales'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('storeSalesByDay', 1)
                ->has('ppobSalesByDay', 1)
                ->where('storeSalesByDay.0.date', $transactionDate)
                ->where('storeSalesByDay.0.total', 17_000)
                ->where('ppobSalesByDay.0.date', $transactionDate)
                ->where('ppobSalesByDay.0.total', 105_000));
    }

    public function test_non_admin_only_counts_own_transactions_in_split_charts(): void
    {
        $cashierA = $this->createCashierUser(['reports.sales']);
        $cashierB = $this->createCashierUser(['reports.sales']);

        $physicalA = $this->createPhysicalProduct();
        $physicalB = $this->createPhysicalProduct();

        $paidAt = now();
        $transactionDate = $paidAt->toDateString();

        $transactionA = Transaction::create([
            'cashier_id' => $cashierA->id,
            'invoice' => 'TRX-A-' . uniqid(),
            'cash' => 17_000,
            'change' => 0,
            'discount' => 0,
            'grand_total' => 17_000,
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'status' => 'completed',
            'paid_at' => $paidAt,
        ]);

        $this->createTransactionDetail($transactionA, $physicalA['product'], $physicalA['unit'], [
            'price' => 17_000,
            'subtotal' => 17_000,
        ]);

        $transactionB = Transaction::create([
            'cashier_id' => $cashierB->id,
            'invoice' => 'TRX-B-' . uniqid(),
            'cash' => 50_000,
            'change' => 0,
            'discount' => 0,
            'grand_total' => 50_000,
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'status' => 'completed',
            'paid_at' => $paidAt,
        ]);

        $this->createTransactionDetail($transactionB, $physicalB['product'], $physicalB['unit'], [
            'price' => 50_000,
            'subtotal' => 50_000,
        ]);

        $this->actingAs($cashierA)
            ->get(route('account.reports.sales'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('storeSalesByDay', 1)
                ->where('storeSalesByDay.0.date', $transactionDate)
                ->where('storeSalesByDay.0.total', 17_000)
                ->has('ppobSalesByDay', 0));
    }
}
