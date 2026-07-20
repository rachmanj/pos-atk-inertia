<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CustomerReportController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        abort_unless($user->can('reports.customers'), 403);

        $request->validate([
            'q' => 'nullable|string|max:100',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'cashier_id' => 'nullable|exists:users,id',
        ]);

        $startDate = $request->start_date
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->startOfMonth();

        $endDate = $request->end_date
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay();

        $customerData = Transaction::query()
            ->select([
                'customer_id',
                DB::raw('SUM(grand_total) as total_omzet'),
                DB::raw('COUNT(*) as total_transactions'),
                DB::raw('MAX(COALESCE(paid_at, created_at)) as last_visit'),
            ])
            ->with(['customer:id,name,no_telp'])
            ->whereNotNull('customer_id')
            ->where('payment_status', 'paid')
            ->where('status', '!=', 'voided')
            ->whereBetween(
                DB::raw('COALESCE(paid_at, created_at)'),
                [$startDate, $endDate]
            )
            ->when(!$user->isAdminUser(), function (Builder $query) use ($user) {
                $query->where('cashier_id', $user->id);
            })
            ->when($user->isAdminUser() && filled($request->cashier_id), function (Builder $query) use ($request) {
                $query->where('cashier_id', $request->cashier_id);
            })
            ->when(filled($request->q), function (Builder $query) use ($request) {
                $search = trim($request->q);
                $query->whereHas('customer', function (Builder $customerQuery) use ($search) {
                    $customerQuery->where('name', 'like', '%' . $search . '%')
                        ->orWhere('no_telp', 'like', '%' . $search . '%');
                });
            })
            ->groupBy('customer_id')
            ->orderByDesc('total_omzet');

        $customers = (clone $customerData)
            ->paginate(20)
            ->withQueryString();

        // Enrich data
        $customers->getCollection()->transform(function ($item) {
            $item->average_transaction = $item->total_transactions > 0
                ? (int) round($item->total_omzet / $item->total_transactions)
                : 0;
            return $item;
        });

        // Summary
        $summaryQuery = Transaction::query()
            ->whereNotNull('customer_id')
            ->where('payment_status', 'paid')
            ->where('status', '!=', 'voided')
            ->whereBetween(
                DB::raw('COALESCE(paid_at, created_at)'),
                [$startDate, $endDate]
            )
            ->when(!$user->isAdminUser(), function (Builder $query) use ($user) {
                $query->where('cashier_id', $user->id);
            })
            ->when($user->isAdminUser() && filled($request->cashier_id), function (Builder $query) use ($request) {
                $query->where('cashier_id', $request->cashier_id);
            });

        $totalCustomerTransactions = (int) (clone $summaryQuery)->count();
        $totalCustomerOmzet = (int) (clone $summaryQuery)->sum('grand_total');
        $uniqueCustomers = (int) (clone $summaryQuery)->distinct('customer_id')->count('customer_id');

        return Inertia::render('Account/Reports/CustomerReport', [
            'customers' => $customers,
            'summary' => [
                'total_customers' => $uniqueCustomers,
                'total_transactions' => $totalCustomerTransactions,
                'total_omzet' => $totalCustomerOmzet,
                'avg_per_customer' => $uniqueCustomers > 0
                    ? (int) round($totalCustomerOmzet / $uniqueCustomers)
                    : 0,
            ],
            'filters' => [
                'q' => $request->q ?? '',
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'cashier_id' => $request->cashier_id ?? '',
            ],
            'cashiers' => $user->isAdminUser()
                ? \App\Models\User::query()
                    ->whereHas('transactions')
                    ->orderBy('name')
                    ->get(['id', 'name'])
                : [],
            'isAdmin' => $user->isAdminUser(),
        ]);
    }
}
