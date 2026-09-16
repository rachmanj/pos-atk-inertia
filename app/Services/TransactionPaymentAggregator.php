<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\TransactionPayment;
use Illuminate\Support\Collection;

class TransactionPaymentAggregator
{
    public static function sumPaidCash(Collection $transactions): int
    {
        return self::sumParts($transactions, function (Transaction $transaction, ?TransactionPayment $payment) {
            if ($payment) {
                return $payment->method === TransactionPayment::METHOD_CASH
                    && $payment->payment_status === TransactionPayment::STATUS_PAID;
            }

            return $transaction->payment_status === 'paid'
                && $transaction->payment_method === TransactionPayment::METHOD_CASH;
        });
    }

    public static function sumPaidNonCash(Collection $transactions): int
    {
        return self::sumParts($transactions, function (Transaction $transaction, ?TransactionPayment $payment) {
            if ($payment) {
                return in_array($payment->method, TransactionPayment::nonCashMethods(), true)
                    && $payment->payment_status === TransactionPayment::STATUS_PAID;
            }

            return $transaction->payment_status === 'paid'
                && in_array($transaction->payment_method, TransactionPayment::nonCashMethods(), true);
        });
    }

    public static function sumNonCashForDrawer(Collection $transactions): int
    {
        return self::sumParts($transactions, function (Transaction $transaction, ?TransactionPayment $payment) {
            if ($payment) {
                return in_array($payment->method, TransactionPayment::nonCashMethods(), true);
            }

            return in_array($transaction->payment_method, TransactionPayment::nonCashMethods(), true);
        });
    }

    /**
     * @return array{cash: int, qris: int, transfer: int, digital: int}
     */
    public static function sumPaidByMethod(Collection $transactions): array
    {
        $totals = [
            TransactionPayment::METHOD_CASH => 0,
            TransactionPayment::METHOD_QRIS => 0,
            TransactionPayment::METHOD_TRANSFER => 0,
            TransactionPayment::METHOD_DIGITAL => 0,
        ];

        foreach ($transactions as $transaction) {
            if ($transaction->payment_status !== 'paid') {
                continue;
            }

            foreach ($transaction->paymentBreakdown() as $method => $amount) {
                if (array_key_exists($method, $totals)) {
                    $totals[$method] += (int) $amount;
                }
            }
        }

        return $totals;
    }

    public static function sumPaidMethodPart(Collection $transactions, string $method): int
    {
        $total = 0;

        foreach ($transactions as $transaction) {
            if ($transaction->payment_status !== 'paid') {
                continue;
            }

            $total += (int) ($transaction->paymentBreakdown()[$method] ?? 0);
        }

        return $total;
    }

    public static function pendingTransferAmount(Transaction $transaction): int
    {
        $payments = $transaction->relationLoaded('payments')
            ? $transaction->payments
            : $transaction->payments()->get();

        if ($payments->isEmpty()) {
            if ($transaction->payment_method === TransactionPayment::METHOD_TRANSFER
                && $transaction->payment_status === 'pending') {
                return (int) $transaction->grand_total;
            }

            return 0;
        }

        return (int) $payments
            ->where('method', TransactionPayment::METHOD_TRANSFER)
            ->where('payment_status', TransactionPayment::STATUS_PENDING)
            ->sum('amount');
    }

    public static function hasPendingTransferPart(Transaction $transaction): bool
    {
        return self::pendingTransferAmount($transaction) > 0;
    }

    public static function hasPendingNonCashPart(Transaction $transaction): bool
    {
        $payments = $transaction->relationLoaded('payments')
            ? $transaction->payments
            : $transaction->payments()->get();

        if ($payments->isEmpty()) {
            return in_array($transaction->payment_method, TransactionPayment::nonCashMethods(), true)
                && $transaction->payment_status !== 'paid';
        }

        return $payments->contains(
            fn (TransactionPayment $payment) => in_array($payment->method, TransactionPayment::nonCashMethods(), true)
                && $payment->payment_status === TransactionPayment::STATUS_PENDING,
        );
    }

    public static function transactionHasNonCashPart(Transaction $transaction): bool
    {
        $payments = $transaction->relationLoaded('payments')
            ? $transaction->payments
            : $transaction->payments()->get();

        if ($payments->isEmpty()) {
            return in_array($transaction->payment_method, TransactionPayment::nonCashMethods(), true);
        }

        return $payments->contains(
            fn (TransactionPayment $payment) => in_array($payment->method, TransactionPayment::nonCashMethods(), true)
                && $payment->payment_status !== TransactionPayment::STATUS_FAILED,
        );
    }

    private static function sumParts(Collection $transactions, callable $matcher): int
    {
        $total = 0;

        foreach ($transactions as $transaction) {
            $payments = $transaction->relationLoaded('payments')
                ? $transaction->payments
                : collect();

            if ($payments->isEmpty()) {
                if ($matcher($transaction, null)) {
                    $total += (int) $transaction->grand_total;
                }

                continue;
            }

            foreach ($payments as $payment) {
                if ($payment->payment_status === TransactionPayment::STATUS_FAILED) {
                    continue;
                }

                if ($matcher($transaction, $payment)) {
                    $total += (int) $payment->amount;
                }
            }
        }

        return $total;
    }
}
