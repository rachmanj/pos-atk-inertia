<?php

namespace App\Http\Controllers\Account;

use App\Exports\ConsignmentReportExport;
use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ConsignmentReportController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->can('reports.consignment'), 403);

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

        $bySupplier = ConsignmentReportExport::supplierSummaryRows($filters);
        $details = ConsignmentReportExport::detailRows($filters);

        $summary = [
            'qty_dititip' => (int) collect($bySupplier)->sum('qty_dititip'),
            'qty_terjual' => (int) collect($bySupplier)->sum('qty_terjual'),
            'qty_retur' => (int) collect($bySupplier)->sum('qty_retur'),
            'sisa' => (int) collect($bySupplier)->sum('sisa'),
            'nilai_utang_belum_dibayar' => (int) collect($bySupplier)->sum('nilai_utang_belum_dibayar'),
            'supplier_count' => count($bySupplier),
            'line_count' => count($details),
        ];

        $suppliers = Supplier::query()
            ->whereIn('id', function ($q) {
                $q->select('supplier_id')->from('consignments');
            })
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Account/Reports/Consignment', [
            'summary' => $summary,
            'bySupplier' => $bySupplier,
            'details' => $details,
            'filters' => [
                'start_date' => $filters['start_date'],
                'end_date' => $filters['end_date'],
                'supplier_id' => $request->supplier_id ?? '',
            ],
            'suppliers' => $suppliers,
        ]);
    }

    public function export(Request $request)
    {
        abort_unless($request->user()->can('reports.consignment'), 403);

        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'supplier_id' => 'nullable|exists:suppliers,id',
        ]);

        $filters = ConsignmentReportExport::resolveFilters([
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'supplier_id' => $request->supplier_id,
        ]);

        return Excel::download(
            new ConsignmentReportExport($filters),
            'laporan-konsinyasi-' . now()->format('Ymd_His') . '.xlsx'
        );
    }
}