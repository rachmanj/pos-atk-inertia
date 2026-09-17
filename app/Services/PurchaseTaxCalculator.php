<?php

namespace App\Services;

class PurchaseTaxCalculator
{
    public function allocate(array $lines, int $taxAmount): array
    {
        if ($taxAmount === 0) {
            return array_map(
                fn (array $line) => array_merge($line, ['tax_amount' => 0]),
                $lines,
            );
        }

        $totalSubtotal = (int) array_sum(array_column($lines, 'subtotal'));

        if ($totalSubtotal === 0) {
            return array_map(
                fn (array $line) => array_merge($line, ['tax_amount' => 0]),
                $lines,
            );
        }

        $allocated = [];
        $sumAllocated = 0;
        $lineCount = count($lines);

        foreach ($lines as $index => $line) {
            if ($index === $lineCount - 1) {
                $lineTax = $taxAmount - $sumAllocated;
            } else {
                $lineTax = (int) round($taxAmount * $line['subtotal'] / $totalSubtotal);
                $sumAllocated += $lineTax;
            }

            $allocated[] = array_merge($line, ['tax_amount' => $lineTax]);
        }

        return $allocated;
    }

    public function dppAmount(array $lines, int $taxAmount, bool $taxIncluded): int
    {
        $sumSubtotal = (int) array_sum(array_column($lines, 'subtotal'));

        return $taxIncluded ? max(0, $sumSubtotal - $taxAmount) : $sumSubtotal;
    }

    public function totalAmount(int $dpp, int $tax): int
    {
        return $dpp + $tax;
    }

    public function buyPricePerBase(
        int $lineSubtotal,
        int $lineTax,
        int $qtyInBase,
        bool $hppIncludesTax,
    ): int {
        if ($qtyInBase === 0) {
            return 0;
        }

        return (int) round(($lineSubtotal + ($hppIncludesTax ? $lineTax : 0)) / $qtyInBase);
    }
}
