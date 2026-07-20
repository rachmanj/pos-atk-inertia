<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ExpenseReportController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        abort_unless($user->can('reports.expense'), 403);

        $request->validate([
            'q' => 'nullable|string|max:100',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'category' => 'nullable|string|max:100',
            'cashier_id' => 'nullable|exists:users,id',
        ]);

        $startDate = $request->start_date
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->startOfMonth();

        $endDate = $request->end_date
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay();

        // Group by category
        $baseQuery = Expense::query()
            ->whereBetween('expense_date', [
                $startDate->toDateString(),
                $endDate->toDateString(),
            ])
            ->when(!$user->isAdminUser(), function (Builder $query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->when($user->isAdminUser() && filled($request->cashier_id), function (Builder $query) use ($request) {
                $query->where('user_id', $request->cashier_id);
            })
            ->when(filled($request->category), function (Builder $query) use ($request) {
                $query->where('category', $request->category);
            })
            ->when(filled($request->q), function (Builder $query) use ($request) {
                $search = trim($request->q);
                $query->where(function (Builder $searchQuery) use ($search) {
                    $searchQuery->where('title', 'like', '%' . $search . '%')
                        ->orWhere('code', 'like', '%' . $search . '%')
                        ->orWhere('note', 'like', '%' . $search . '%');
                });
            });

        // By category breakdown
        $byCategory = (clone $baseQuery)
            ->select('category', DB::raw('SUM(amount) as total_amount'), DB::raw('COUNT(*) as total_count'))
            ->groupBy('category')
            ->orderByDesc('total_amount')
            ->get();

        // By month trend
        $byMonth = (clone $baseQuery)
            ->select(
                DB::raw("DATE_FORMAT(expense_date, '%Y-%m') as month"),
                DB::raw('SUM(amount) as total_amount'),
                DB::raw('COUNT(*) as total_count')
            )
            ->groupBy(DB::raw("DATE_FORMAT(expense_date, '%Y-%m')"))
            ->orderBy('month')
            ->get();

        // Detail list (paginated)
        $expenses = (clone $baseQuery)
            ->with(['user:id,name'])
            ->orderByDesc('expense_date')
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        // Summary totals
        $totalAmount = (int) (clone $baseQuery)->sum('amount');
        $totalCount = (int) (clone $baseQuery)->count();

        // Category list for filter dropdown
        $categories = Expense::query()
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return Inertia::render('Account/Reports/Expense', [
            'expenses' => $expenses,
            'byCategory' => $byCategory,
            'byMonth' => $byMonth,
            'summary' => [
                'total_amount' => $totalAmount,
                'total_count' => $totalCount,
                'avg_per_transaction' => $totalCount > 0
                    ? (int) round($totalAmount / $totalCount)
                    : 0,
            ],
            'filters' => [
                'q' => $request->q ?? '',
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'category' => $request->category ?? '',
                'cashier_id' => $request->cashier_id ?? '',
            ],
            'categoryList' => $categories,
            'cashiers' => $user->isAdminUser()
                ? User::query()
                    ->whereHas('expenses')
                    ->orderBy('name')
                    ->get(['id', 'name'])
                : [],
            'isAdmin' => $user->isAdminUser(),
        ]);
    }
}
