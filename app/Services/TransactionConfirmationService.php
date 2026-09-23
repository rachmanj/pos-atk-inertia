<?php

namespace App\Services;

use App\Models\Profit;
use App\Models\Transaction;
use App\Models\TransactionPayment;
use Illuminate\Support\Facades\DB;

class TransactionConfirmationService
{
    public function confirmTransfer(Transaction $transaction): void
    {
        $transaction->loadMissing(['details', 'payments']);

        DB::transaction(function () use ($transaction) {
            $now = now();

            if ($transaction->payments->isNotEmpty()) {
                $transaction->payments()
                    ->where('method', TransactionPayment::METHOD_TRANSFER)
                    ->where('payment_status', TransactionPayment::STATUS_PENDING)
                    ->update([
                        'payment_status' => TransactionPayment::STATUS_PAID,
                        'paid_at' => $now,
                    ]);

                $transaction->load('payments');

                $hasPendingParts = $transaction->payments
                    ->contains(fn (TransactionPayment $payment) => $payment->payment_status === TransactionPayment::STATUS_PENDING);

                if (! $hasPendingParts) {
                    $transaction->update([
                        'payment_status' => 'paid',
                        'status' => 'completed',
                        'paid_at' => $now,
                    ]);
                }
            } else {
                $transaction->update([
                    'payment_status' => 'paid',
                    'status' => 'completed',
                    'paid_at' => $now,
                ]);
            }

            $totalCost = $transaction->details->sum(function ($detail) {
                if ($detail->ppob_cost !== null) {
                    return (int) $detail->ppob_cost * (int) $detail->qty;
                }

                return (int) $detail->buy_price * $detail->qtyInBaseUnits();
            });

            Profit::updateOrCreate(
                [
                    'transaction_id' => $transaction->id,
                ],
                [
                    'total_revenue' => (int) $transaction->grand_total,
                    'total_cost' => (int) $totalCost,
                    'profit_amount' => (int) $transaction->grand_total - (int) $totalCost,
                ]
            );
        });
    }
}
