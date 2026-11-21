<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\ConsignmentPayment;
use App\Models\ConsignmentPaymentItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class ConsignmentPaymentController extends Controller
{
    public function store(Request $request)
    {
        abort_unless($request->user()->can('consignment_payments.create'), 403);

        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'paid_on' => 'required|date',
            'amount' => 'required|integer|min:1',
            'method' => ['required', Rule::in([
                ConsignmentPayment::METHOD_TUNAI,
                ConsignmentPayment::METHOD_TRANSFER,
            ])],
            'note' => 'nullable|string|max:1000',
        ]);

        $supplierId = (int) $validated['supplier_id'];
        $amount = (int) $validated['amount'];

        $totals = ConsignmentPayableController::supplierTotals($supplierId);
        $remainingDebt = $totals['remaining_debt'];

        if ($amount > $remainingDebt) {
            throw ValidationException::withMessages([
                'amount' => 'Nominal melebihi sisa utang konsinyasi supplier (sisa Rp ' . number_format($remainingDebt, 0, ',', '.') . ').',
            ]);
        }

        try {
            DB::transaction(function () use ($request, $validated, $supplierId, $amount) {
                $unpaidLines = ConsignmentPayableController::unpaidConsignmentItemRows($supplierId);

                if ($unpaidLines === []) {
                    throw ValidationException::withMessages([
                        'amount' => 'Supplier tidak memiliki utang konsinyasi yang belum lunas.',
                    ]);
                }

                $payment = ConsignmentPayment::create([
                    'supplier_id' => $supplierId,
                    'user_id' => $request->user()->id,
                    'paid_on' => $validated['paid_on'],
                    'amount' => $amount,
                    'method' => $validated['method'],
                    'note' => filled($validated['note'] ?? null) ? trim($validated['note']) : null,
                ]);

                $allocations = $this->allocateFifo($unpaidLines, $amount);

                foreach ($allocations as $row) {
                    ConsignmentPaymentItem::create([
                        'consignment_payment_id' => $payment->id,
                        'consignment_item_id' => $row['consignment_item_id'],
                        'qty' => $row['qty'],
                        'amount' => $row['amount'],
                    ]);
                }

                $allocatedSum = (int) ConsignmentPaymentItem::query()
                    ->where('consignment_payment_id', $payment->id)
                    ->sum('amount');

                if ($allocatedSum !== $amount) {
                    throw new RuntimeException(
                        "Alokasi pembayaran konsinyasi tidak seimbang (diharapkan {$amount}, teralokasi {$allocatedSum})."
                    );
                }
            });
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages([
                'amount' => $e->getMessage(),
            ]);
        }

        return back()->with('success', 'Pembayaran utang konsinyasi berhasil dicatat.');
    }

    /**
     * @param  list<array<string, mixed>>  $unpaidLines
     * @return list<array{consignment_item_id: int, qty: int, amount: int}>
     */
    protected function allocateFifo(array $unpaidLines, int $paymentAmount): array
    {
        $remainingAmount = $paymentAmount;
        /** @var array<int, array{consignment_item_id: int, qty: int, amount: int}> $byItemId */
        $byItemId = [];

        foreach ($unpaidLines as $line) {
            if ($remainingAmount <= 0) {
                break;
            }

            $costPrice = (int) $line['cost_price'];
            $unpaidQty = (int) $line['remaining_qty'];
            $unpaidValue = (int) $line['remaining_value'];

            if ($costPrice <= 0 || $unpaidQty <= 0 || $unpaidValue <= 0) {
                continue;
            }

            $maxQtyFromMoney = intdiv($remainingAmount, $costPrice);
            $qty = min($unpaidQty, $maxQtyFromMoney);

            if ($qty <= 0) {
                continue;
            }

            $lineAmount = $qty * $costPrice;
            $itemId = (int) $line['consignment_item_id'];

            if (! isset($byItemId[$itemId])) {
                $byItemId[$itemId] = [
                    'consignment_item_id' => $itemId,
                    'qty' => 0,
                    'amount' => 0,
                ];
            }

            $byItemId[$itemId]['qty'] += $qty;
            $byItemId[$itemId]['amount'] += $lineAmount;
            $remainingAmount -= $lineAmount;
        }

        if ($remainingAmount > 0) {
            $lastUnpaidLine = null;

            foreach ($unpaidLines as $line) {
                $itemId = (int) $line['consignment_item_id'];
                $allocatedQty = $byItemId[$itemId]['qty'] ?? 0;

                if ((int) $line['remaining_qty'] > $allocatedQty) {
                    $lastUnpaidLine = $line;
                }
            }

            if ($lastUnpaidLine !== null) {
                $itemId = (int) $lastUnpaidLine['consignment_item_id'];
                $allocatedInPayment = $byItemId[$itemId]['amount'] ?? 0;
                $cap = (int) $lastUnpaidLine['remaining_value'] - $allocatedInPayment;
                $addAmount = min($remainingAmount, $cap);

                if ($addAmount > 0) {
                    if (! isset($byItemId[$itemId])) {
                        $byItemId[$itemId] = [
                            'consignment_item_id' => $itemId,
                            'qty' => 0,
                            'amount' => 0,
                        ];
                    }

                    $byItemId[$itemId]['amount'] += $addAmount;
                    $remainingAmount -= $addAmount;
                }
            }
        }

        if ($remainingAmount !== 0) {
            throw new RuntimeException('Sisa nominal pembayaran tidak dapat dialokasikan ke baris titipan.');
        }

        return array_values($byItemId);
    }
}