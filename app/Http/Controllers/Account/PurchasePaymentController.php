<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\PurchasePayment;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PurchasePaymentController extends Controller
{
    public function store(Request $request, string $purchase)
    {
        abort_unless($request->user()->can('purchases.edit'), 403);

        $purchaseModel = $this->findPurchase($purchase);

        if ($purchaseModel->payment_status === Purchase::PAYMENT_STATUS_PAID) {
            throw ValidationException::withMessages([
                'amount' => 'Nota pembelian ini sudah lunas.',
            ]);
        }

        $remaining = $purchaseModel->remaining();

        $validated = $request->validate([
            'paid_on' => 'required|date',
            'amount' => 'required|integer|min:1|max:' . $remaining,
            'method' => ['required', Rule::in([
                PurchasePayment::METHOD_TUNAI,
                PurchasePayment::METHOD_TRANSFER,
                PurchasePayment::METHOD_LAINNYA,
            ])],
            'note' => 'nullable|string|max:1000',
        ], [
            'amount.max' => 'Jumlah pembayaran tidak boleh melebihi sisa utang.',
        ]);

        PurchasePayment::create([
            'purchase_id' => $purchaseModel->id,
            'user_id' => $request->user()->id,
            'paid_on' => $validated['paid_on'],
            'amount' => (int) $validated['amount'],
            'method' => $validated['method'],
            'note' => filled($validated['note'] ?? null) ? trim($validated['note']) : null,
        ]);

        $purchaseModel->refreshPaymentStatus();

        return back()->with('success', 'Pembayaran supplier berhasil dicatat.');
    }

    public function destroy(Request $request, string $purchase, PurchasePayment $payment)
    {
        abort_unless($request->user()->can('purchases.edit'), 403);

        $purchaseModel = $this->findPurchase($purchase);

        if ($payment->purchase_id !== $purchaseModel->id) {
            abort(404);
        }

        $payment->delete();
        $purchaseModel->refreshPaymentStatus();

        return back()->with('success', 'Pembayaran supplier berhasil dihapus.');
    }

    protected function findPurchase(string $invoice): Purchase
    {
        return Purchase::query()
            ->where('invoice', $invoice)
            ->firstOrFail();
    }
}
