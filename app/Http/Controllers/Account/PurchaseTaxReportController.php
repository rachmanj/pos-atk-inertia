<?php

namespace App\Http\Controllers\Account;

use App\Exports\PurchaseTaxReportExport;
use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class PurchaseTaxReportController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->can('purchases.index'), 403);

        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'supplier_id' => 'nullable|exists:suppliers,id',
        ]);

        $startDate = $request->start_date
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->startOfMonth();

        $endDate = $request->end_date
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay();

        $filters = [
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'supplier_id' => $request->supplier_id,
        ];

        $baseQuery = PurchaseTaxReportExport::baseQuery($filters);

        $summary = [
            'total_count' => (int) (clone $baseQuery)->count(),
            'total_dpp' => (int) (clone $baseQuery)->sum('dpp_amount'),
            'total_tax' => (int) (clone $baseQuery)->sum('tax_amount'),
            'total_amount' => (int) (clone $baseQuery)->sum('total_amount'),
        ];

        $purchases = (clone $baseQuery)
            ->with('supplier:id,name')
            ->orderByDesc('purchase_date')
            ->orderByDesc('id')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Account/Reports/PurchaseTax', [
            'purchases' => $purchases,
            'summary' => $summary,
            'filters' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'supplier_id' => $request->supplier_id ?? '',
            ],
            'suppliers' => Supplier::query()
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function export(Request $request)
    {
        abort_unless($request->user()->can('purchases.index'), 403);

        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'supplier_id' => 'nullable|exists:suppliers,id',
        ]);

        $filters = [
            'start_date' => $request->start_date ?: now()->startOfMonth()->toDateString(),
            'end_date' => $request->end_date ?: now()->toDateString(),
            'supplier_id' => $request->supplier_id,
        ];

        $baseQuery = PurchaseTaxReportExport::baseQuery($filters);

        $summary = [
            'total_count' => (int) (clone $baseQuery)->count(),
            'total_dpp' => (int) (clone $baseQuery)->sum('dpp_amount'),
            'total_tax' => (int) (clone $baseQuery)->sum('tax_amount'),
            'total_amount' => (int) (clone $baseQuery)->sum('total_amount'),
        ];

        return Excel::download(
            new PurchaseTaxReportExport($filters, $summary),
            'laporan-ppn-masukan-' . now()->format('Ymd_His') . '.xlsx'
        );
    }
}
