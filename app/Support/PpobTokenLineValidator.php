<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Validation\Validator;

class PpobTokenLineValidator
{
    /**
     * @return array<string, string>
     */
    public static function tokenLineErrors(
        int $productId,
        ?int $tokenNominal,
        ?int $ppobCost,
        ?int $adminFee,
    ): array {
        if (! Setting::isPpobTokenProduct($productId)) {
            return [];
        }

        $errors = [];

        if (! $tokenNominal || $tokenNominal < 1) {
            $errors['token_nominal'] = 'Nominal token wajib diisi.';

            return $errors;
        }

        $expectedCost = Setting::expectedPpobCostForToken($tokenNominal);

        if ((int) $ppobCost !== $expectedCost) {
            $errors['ppob_cost'] = 'Biaya provider token tidak valid.';
        }

        if ((int) $adminFee < 0) {
            $errors['admin_fee'] = 'Harga jual tidak boleh kurang dari biaya provider.';
        }

        return $errors;
    }

    public static function validateTokenLine(
        Validator $validator,
        int $productId,
        ?int $tokenNominal,
        ?int $ppobCost,
        ?int $adminFee,
        string $prefix = '',
    ): void {
        foreach (self::tokenLineErrors($productId, $tokenNominal, $ppobCost, $adminFee) as $field => $message) {
            $key = $prefix !== '' ? "{$prefix}.{$field}" : $field;
            $validator->errors()->add($key, $message);
        }
    }
}
