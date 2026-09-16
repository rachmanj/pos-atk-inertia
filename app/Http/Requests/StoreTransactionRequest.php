<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payment_method' => 'required|in:cash,digital,qris,transfer',
            'cash' => 'nullable|integer|min:0|required_if:payment_method,cash',
            'discount' => 'nullable|integer|min:0',
            'discount_type' => 'nullable|in:nominal,percent',
            'customer_id' => 'nullable|exists:customers,id',
            'note' => 'nullable|string|max:1000',
            'payments' => [
                'nullable',
                'array',
                'max:3',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (is_array($value) && $value !== [] && count($value) < 2) {
                        $fail('Struk campuran membutuhkan minimal 2 metode pembayaran.');
                    }
                },
            ],
            'payments.*.method' => 'required_with:payments|in:cash,qris,transfer',
            'payments.*.amount' => 'required_with:payments|integer|min:1',
            'payments.*.reference' => 'nullable|string|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'payments.max' => 'Jumlah metode pembayaran maksimal 3.',
            'payments.*.method.required_with' => 'Metode pembayaran wajib diisi.',
            'payments.*.method.in' => 'Metode pembayaran tidak dikenali.',
            'payments.*.amount.required_with' => 'Nominal pembayaran wajib diisi.',
            'payments.*.amount.integer' => 'Nominal pembayaran harus berupa angka bulat.',
            'payments.*.amount.min' => 'Nominal pembayaran minimal 1.',
        ];
    }
}
