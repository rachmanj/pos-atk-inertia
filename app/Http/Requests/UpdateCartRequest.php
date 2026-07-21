<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCartRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'qty' => 'required|integer|min:1',
            'discount' => 'nullable|integer|min:0',
            'discount_type' => 'nullable|in:nominal,percent',
        ];
    }
}
