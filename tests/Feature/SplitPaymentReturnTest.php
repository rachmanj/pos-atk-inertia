<?php

namespace Tests\Feature;

use App\Models\ReturnTransaction;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class SplitPaymentReturnTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    public function test_split_return_defaults_to_original_when_largest_part_is_qris(): void
    {
        $user = $this->createCashierUser(['transactions.create', 'returns.create']);
        $transaction = $this->createSplitPaymentTransaction($user, [
            ['method' => 'cash', 'amount' => 30_000],
            ['method' => 'qris', 'amount' => 70_000],
        ]);

        $response = $this->submitReturn($transaction, $user);

        $response->assertRedirect();

        $return = ReturnTransaction::where('transaction_id', $transaction->id)->firstOrFail();
        $this->assertSame('original', $return->refund_method);
    }

    public function test_split_return_defaults_to_cash_when_largest_part_is_cash(): void
    {
        $user = $this->createCashierUser(['transactions.create', 'returns.create']);
        $transaction = $this->createSplitPaymentTransaction($user, [
            ['method' => 'cash', 'amount' => 60_000],
            ['method' => 'qris', 'amount' => 40_000],
        ]);

        $response = $this->submitReturn($transaction, $user);

        $response->assertRedirect();

        $return = ReturnTransaction::where('transaction_id', $transaction->id)->firstOrFail();
        $this->assertSame('cash', $return->refund_method);
    }

    public function test_split_return_uses_explicit_refund_method_from_cashier(): void
    {
        $user = $this->createCashierUser(['transactions.create', 'returns.create']);
        $transaction = $this->createSplitPaymentTransaction($user, [
            ['method' => 'cash', 'amount' => 30_000],
            ['method' => 'qris', 'amount' => 70_000],
        ]);

        $response = $this->submitReturn($transaction, $user, 'cash');

        $response->assertRedirect();

        $return = ReturnTransaction::where('transaction_id', $transaction->id)->firstOrFail();
        $this->assertSame('cash', $return->refund_method);
    }

    public function test_return_create_page_exposes_default_refund_method_for_split_transaction(): void
    {
        $user = $this->createCashierUser(['transactions.create', 'returns.create']);
        $transaction = $this->createSplitPaymentTransaction($user, [
            ['method' => 'cash', 'amount' => 30_000],
            ['method' => 'qris', 'amount' => 70_000],
        ]);

        $response = $this->actingAs($user)->get(
            route('account.returns.create', $transaction->invoice),
        );

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('defaultRefundMethod', 'original'));
    }

    private function createSplitPaymentTransaction(User $user, array $payments): Transaction
    {
        $this->openCashierShift($user);
        $catalog = $this->createPhysicalProduct();
        $this->addCartItem($user, $catalog['product'], $catalog['unit'], 10, 10_000);

        $cashPart = collect($payments)->firstWhere('method', 'cash');

        $response = $this->actingAs($user)->postJson(route('account.transactions.store'), [
            'payment_method' => $payments[0]['method'],
            'cash' => $cashPart['amount'] ?? 0,
            'payments' => $payments,
        ]);

        $response->assertOk()->assertJson(['success' => true]);

        return Transaction::where('invoice', $response->json('invoice'))
            ->with('details')
            ->firstOrFail();
    }

    private function submitReturn(Transaction $transaction, User $user, ?string $refundMethod = null)
    {
        $productId = $transaction->details->first()->product_id;

        $payload = [
            'transaction_id' => $transaction->id,
            'reason' => 'customer_request',
            'items' => [
                [
                    'product_id' => $productId,
                    'qty' => 1,
                    'restock' => true,
                ],
            ],
        ];

        if ($refundMethod !== null) {
            $payload['refund_method'] = $refundMethod;
        }

        return $this->actingAs($user)->post(route('account.returns.store'), $payload);
    }
}
