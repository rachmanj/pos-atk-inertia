<?php

namespace Tests\Feature;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RegexIterator;
use Tests\TestCase;

class PaymentBreakdownUsageGuardTest extends TestCase
{
    /**
     * @var list<string>
     */
    private array $exceptions = [
        'app/Services/CheckoutService.php',
        'app/Http/Requests/StoreTransactionRequest.php',
        'app/Console/Commands/ReconcileTransactions.php',
        'app/Models/Transaction.php',
        'app/Models/TransactionPayment.php',
        'app/Services/ShiftReportBuilder.php',
        'app/Services/ShiftCashReconciliation.php',
        'app/Services/ShiftLiveSummary.php',
        'app/Exports/ShiftSalesReportExport.php',
    ];

    public function test_money_summation_by_payment_method_must_use_payment_breakdown_helpers(): void
    {
        $violations = [];

        foreach ($this->phpFilesUnderApp() as $relativePath) {
            if (in_array($relativePath, $this->exceptions, true)) {
                continue;
            }

            $absolutePath = base_path($relativePath);
            $contents = file_get_contents($absolutePath);

            if (! $this->hasMoneyByMethodPattern($contents)) {
                continue;
            }

            if ($this->usesBreakdownHelpers($contents)) {
                continue;
            }

            $violations[] = $relativePath . ' — penjumlahan uang per metode tanpa paymentBreakdown()/cashPart()/nonCashPart()/TransactionPaymentAggregator';
        }

        $this->assertSame(
            [],
            $violations,
            "Ditemukan berkas yang menjumlah uang per metode tanpa helper rincian:\n" . implode("\n", $violations),
        );
    }

    /**
     * @return list<string>
     */
    private function phpFilesUnderApp(): array
    {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator(base_path('app')),
        );

        $regex = new RegexIterator($iterator, '/^.+\.php$/i', RegexIterator::GET_MATCH);
        $files = [];

        foreach ($regex as $match) {
            $absolutePath = $match[0];
            $files[] = 'app/' . str_replace(base_path('app') . DIRECTORY_SEPARATOR, '', $absolutePath);
        }

        sort($files);

        return $files;
    }

    private function hasMoneyByMethodPattern(string $contents): bool
    {
        if (preg_match("/groupBy\(\s*['\"]payment_method['\"]/", $contents)) {
            return true;
        }

        if (preg_match("/groupBy\(\s*DB::raw\(\s*['\"]transactions\.payment_method['\"]\s*\)/", $contents)) {
            return true;
        }

        if (str_contains($contents, "sum('grand_total')")
            && preg_match("/where\(\s*['\"]payment_method['\"]/", $contents)) {
            return true;
        }

        if (preg_match("/where\(\s*['\"]payment_method['\"]/", $contents)
            && preg_match('/->sum\(/', $contents)) {
            return true;
        }

        return false;
    }

    private function usesBreakdownHelpers(string $contents): bool
    {
        return str_contains($contents, 'paymentBreakdown(')
            || str_contains($contents, 'cashPart(')
            || str_contains($contents, 'nonCashPart(')
            || str_contains($contents, 'TransactionPaymentAggregator::');
    }
}
