<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreCartRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id' => 'required|exists:products,id',
            'unit_id' => 'nullable|exists:units,id',
            'customer_ref' => 'nullable|string|max:100',
            'ppob_cost' => 'nullable|integer|min:0',
            'admin_fee' => 'nullable|integer|min:0',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $product = Product::query()->find($this->input('product_id'));

            if (!$product?->isPpob()) {
                return;
            }

            if (!filled($this->input('ppob_cost')) || (int) $this->input('ppob_cost') < 1) {
                $validator->errors()->add('ppob_cost', 'Biaya PPOB wajib diisi.');
            }

            if (!filled($this->input('admin_fee')) || (int) $this->input('admin_fee') < 0) {
                $validator->errors()->add('admin_fee', 'Biaya admin wajib diisi.');
            }
        });
    }
}
