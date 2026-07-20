<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PpobReportController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        abort_unless($user->can('reports.ppob'), 403);

        $request->validate([
            'q' => 'nullable|string|max:100',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'cashier_id' => 'nullable|exists:users,id',
            'group_by' => 'nullable|in:product,date',
        ]);

        $startDate = $request->start_date
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->startOfMonth();

        $endDate = $request->end_date
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay();

        $groupBy = $request->group_by ?: 'product';

        $baseQuery = \App\Models\TransactionDetail::query()
            ->select([
                'transaction_details.product_id',
                DB::raw('SUM(transaction_details.qty) as total_qty'),
                DB::raw('SUM(transaction_details.subtotal) as total_omzet'),
                DB::raw('SUM(transaction_details.admin_fee) as total_admin_fee'),
                DB::raw('SUM(transaction_details.ppob_cost * transaction_details.qty) as total_cost'),
            ])
            ->join('transactions', 'transaction_details.transaction_id', '=', 'transactions.id')
            ->whereNotNull('transaction_details.ppob_cost')
            ->where('transactions.payment_status', 'paid')
            ->where('transactions.status', '!=', 'voided')
            ->whereBetween(
                DB::raw('COALESCE(transactions.paid_at, transactions.created_at)'),
                [$startDate, $endDate]
            )
            ->when(!$user->isAdminUser(), function (Builder $query) use ($user) {
                $query->where('transactions.cashier_id', $user->id);
            })
            ->when($user->isAdminUser() && filled($request->cashier_id), function (Builder $query) use ($request) {
                $query->where('transactions.cashier_id', $request->cashier_id);
            })
            ->when(filled($request->q), function (Builder $query) use ($request) {
                $search = trim($request->q);
                $query->join('products', 'transaction_details.product_id', '=', 'products.id')
                    ->where(function (Builder $searchQuery) use ($search) {
                        $searchQuery->where('products.title', 'like', '%' . $search . '%')
                            ->orWhere('products.barcode', 'like', '%' . $search . '%');
                    });
            });

        if ($groupBy === 'date') {
            $baseQuery->addSelect(
                DB::raw('DATE(COALESCE(transactions.paid_at, transactions.created_at)) as sale_date')
            );
            $baseQuery->groupBy(
                DB::raw('DATE(COALESCE(transactions.paid_at, transactions.created_at))'),
                'transaction_details.product_id'
            );
        } else {
            $baseQuery->groupBy('transaction_details.product_id');
        }

        $ppobData = (clone $baseQuery)
            ->with(['product:id,title,barcode'])
            ->orderByDesc('total_omzet')
            ->paginate(20)
            ->withQueryString();

        // Enrich: laba = total_admin_fee
        $ppobData->getCollection()->transform(function ($item) {
            $item->total_laba = (int) $item->total_admin_fee;
            return $item;
        });

        // Summary
        $summaryQuery = \App\Models\TransactionDetail::query()
            ->join('transactions', 'transaction_details.transaction_id', '=', 'transactions.id')
            ->whereNotNull('transaction_details.ppob_cost')
            ->where('transactions.payment_status', 'paid')
            ->where('transactions.status', '!=', 'voided')
            ->whereBetween(
                DB::raw('COALESCE(transactions.paid_at, transactions.created_at)'),
                [$startDate, $endDate]
            )
            ->when(!$user->isAdminUser(), function (Builder $query) use ($user) {
                $query->where('transactions.cashier_id', $user->id);
            })
            ->when($user->isAdminUser() && filled($request->cashier_id), function (Builder $query) use ($request) {
                $query->where('transactions.cashier_id', $request->cashier_id);
            });

        $totalOmzet = (int) (clone $summaryQuery)->sum('transaction_details.subtotal');
        $totalQty = (int) (clone $summaryQuery)->sum('transaction_details.qty');
        $totalAdminFee = (int) (clone $summaryQuery)->sum('transaction_details.admin_fee');
        $totalCost = (int) ((clone $summaryQuery)
            ->selectRaw('SUM(transaction_details.ppob_cost * transaction_details.qty) as total')
            ->value('total') ?? 0);

        return Inertia::render('Account/Reports/Ppob', [
            'ppobData' => $ppobData,
            'summary' => [
                'total_omzet' => $totalOmzet,
                'total_qty' => $totalQty,
                'total_admin_fee' => $totalAdminFee,
                'total_cost' => $totalCost,
                'total_laba' => $totalAdminFee,
            ],
            'filters' => [
                'q' => $request->q ?? '',
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'cashier_id' => $request->cashier_id ?? '',
                'group_by' => $groupBy,
            ],
            'cashiers' => $user->isAdminUser()
                ? User::query()
                    ->whereHas('transactions')
                    ->orderBy('name')
                    ->get(['id', 'name'])
                : [],
            'isAdmin' => $user->isAdminUser(),
        ]);
    }
}
