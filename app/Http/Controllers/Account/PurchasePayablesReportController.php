<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class PurchasePayablesReportController extends Controller
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

        $baseQuery = Purchase::query()
            ->notFullyPaid()
            ->withSum('payments as paid_amount_sum', 'amount')
            ->with(['supplier:id,name'])
            ->whereBetween('purchase_date', [
                $startDate->toDateString(),
                $endDate->toDateString(),
            ])
            ->when(filled($request->supplier_id), function ($query) use ($request) {
                $query->where('supplier_id', $request->supplier_id);
            });

        $allForSummary = (clone $baseQuery)->get();

        $bucketDefaults = [
            'not_due' => ['count' => 0, 'total_remaining' => 0],
            '1_30' => ['count' => 0, 'total_remaining' => 0],
            'over_30' => ['count' => 0, 'total_remaining' => 0],
        ];

        $totalPayable = 0;

        foreach ($allForSummary as $purchase) {
            $remaining = $purchase->remaining();
            $totalPayable += $remaining;
            $bucket = $purchase->payableAgeBucket();

            if ($bucket !== '' && isset($bucketDefaults[$bucket])) {
                $bucketDefaults[$bucket]['count']++;
                $bucketDefaults[$bucket]['total_remaining'] += $remaining;
            }
        }

        $purchases = (clone $baseQuery)
            ->latest('purchase_date')
            ->latest('id')
            ->paginate(25)
            ->withQueryString();

        $purchases->getCollection()->transform(function (Purchase $purchase) {
            return [
                'id' => $purchase->id,
                'invoice' => $purchase->invoice,
                'purchase_date' => $purchase->purchase_date,
                'due_date' => $purchase->due_date,
                'payment_status' => $purchase->payment_status,
                'total_amount' => (int) $purchase->total_amount,
                'paid_amount' => $purchase->paidAmount(),
                'remaining' => $purchase->remaining(),
                'age_bucket' => $purchase->payableAgeBucket(),
                'age_label' => $purchase->payableAgeLabel(),
                'supplier' => $purchase->supplier,
            ];
        });

        return Inertia::render('Account/Reports/PurchasePayables', [
            'purchases' => $purchases,
            'summary' => [
                'total_payable' => $totalPayable,
                'invoice_count' => $allForSummary->count(),
                'buckets' => $bucketDefaults,
            ],
            'filters' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'supplier_id' => $request->supplier_id ?? '',
            ],
            'suppliers' => Supplier::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'canRecordPayment' => $request->user()->can('purchases.edit'),
        ]);
    }
}
