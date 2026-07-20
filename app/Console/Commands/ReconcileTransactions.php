<?php

namespace App\Console\Commands;

use App\Models\StockMovement;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ReconcileTransactions extends Command
{
    protected $signature = 'transactions:reconcile {--minutes=30}';
    protected $description = 'Reconcile pending digital payment transactions';

    public function handle(): int
    {
        $cutoff = now()->subMinutes((int) $this->option('minutes'));

        $pending = Transaction::where('payment_method', 'digital')
            ->where('payment_status', 'pending')
            ->where('status', 'pending')
            ->where('created_at', '<', $cutoff)
            ->get();

        if ($pending->isEmpty()) {
            Log::info('ReconcileTransactions: no pending transactions found.');
            return self::SUCCESS;
        }

        $serverKey = config('midtrans.server_key');
        $isProduction = config('midtrans.is_production', false);
        $baseUrl = $isProduction ? 'https://api.midtrans.com/v2' : 'https://api.sandbox.midtrans.com/v2';

        $reconciled = 0;

        foreach ($pending as $transaction) {
            try {
                if (empty($serverKey)) {
                    // No Midtrans configured — expire old pending transactions
                    $this->expireTransaction($transaction);
                    $reconciled++;
                    continue;
                }

                $response = Http::withBasicAuth($serverKey, '')
                    ->timeout(10)
                    ->get("{$baseUrl}/{$transaction->invoice}/status");

                if (!$response->successful()) {
                    continue;
                }

                $status = $response->json('transaction_status');

                if (in_array($status, ['settlement', 'capture'])) {
                    $transaction->update(['payment_status' => 'paid', 'status' => 'completed']);
                    $reconciled++;
                } elseif (in_array($status, ['expire', 'deny', 'cancel', 'failure'])) {
                    $this->expireTransaction($transaction);
                    $reconciled++;
                }
            } catch (\Throwable $e) {
                Log::error("ReconcileTransactions: {$transaction->invoice}", ['error' => $e->getMessage()]);
            }
        }

        Log::info("ReconcileTransactions: done — {$reconciled} updated");
        $this->info("{$reconciled} transaction(s) reconciled.");
        return self::SUCCESS;
    }

    private function expireTransaction(Transaction $transaction): void
    {
        DB::transaction(function () use ($transaction) {
            $transaction->update([
                'payment_status' => 'failed',
                'status' => 'voided',
                'void_reason' => 'Auto-void: pembayaran digital expired/gagal',
            ]);

            // Restore stock for physical and service component products
            $movementsOut = StockMovement::where('reference_type', Transaction::class)
                ->where('reference_id', $transaction->id)
                ->where('type', 'out')
                ->get();

            foreach ($movementsOut as $movement) {
                $product = $movement->product;
                if ($product && $product->stock !== null) {
                    $stockBefore = $product->stock;
                    $product->increment('stock', $movement->quantity);
                    $product->refresh();

                    StockMovement::create([
                        'product_id' => $movement->product_id,
                        'user_id' => $transaction->user_id,
                        'type' => 'in',
                        'quantity' => $movement->quantity,
                        'stock_before' => $stockBefore,
                        'stock_after' => $product->stock,
                        'reference_type' => Transaction::class,
                        'reference_id' => $transaction->id,
                        'note' => 'Auto-restore: pembayaran digital expired',
                    ]);
                }
            }

            // Reverse PPOB balance if PPOB transaction
            $ppobBalanceService = app(\App\Services\PpobBalanceService::class);
            foreach ($transaction->details as $detail) {
                if ($detail->ppob_cost > 0) {
                    try {
                        $ppobBalanceService->topUp(
                            $detail->ppob_account_id ?? 0,
                            $detail->ppob_cost * $detail->quantity,
                            "Refund: transaksi #{$transaction->invoice} expired"
                        );
                    } catch (\Throwable $e) {
                        Log::warning("Failed to reverse PPOB for {$transaction->invoice}", [
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }
        });
    }
}