<?php

namespace App\Http\Controllers\Account;

use App\Exports\ProductImportTemplate;
use App\Http\Controllers\Controller;
use App\Imports\ProductsImport;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ProductImportController extends Controller
{
    public function template()
    {
        return Excel::download(
            new ProductImportTemplate(),
            'template-import-produk.xlsx'
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:5120',
        ]);

        $import = new ProductsImport();

        try {
            Excel::import($import, $request->file('file'));
        } catch (\Throwable $exception) {
            return redirect()
                ->route('account.products.index')
                ->with('error', 'Gagal membaca file: ' . $exception->getMessage());
        }

        $summary = $this->buildSummary($import);

        if ($import->created > 0) {
            return redirect()
                ->route('account.products.index')
                ->with('success', $summary);
        }

        return redirect()
            ->route('account.products.index')
            ->with('error', $summary);
    }

    protected function buildSummary(ProductsImport $import): string
    {
        $parts = [
            "Berhasil: {$import->created} produk dibuat.",
            "Dilewati: {$import->skipped} baris.",
        ];

        if (count($import->errors) > 0) {
            $errorPreview = array_slice($import->errors, 0, 5);
            $parts[] = 'Detail: ' . implode(' ', $errorPreview);

            if (count($import->errors) > 5) {
                $remaining = count($import->errors) - 5;
                $parts[] = "(+{$remaining} pesan lainnya)";
            }
        }

        return implode(' ', $parts);
    }
}
