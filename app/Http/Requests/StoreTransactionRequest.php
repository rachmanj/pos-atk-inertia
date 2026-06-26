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
            'payment_method' => 'required|in:cash,digital',
            'cash' => 'nullable|integer|min:0|required_if:payment_method,cash',
            'discount' => 'nullable|integer|min:0',
            'customer_id' => 'nullable|exists:customers,id',
            'note' => 'nullable|string|max:1000',
        ];
    }
}
