<?php

namespace App\Http\Controllers\Account;

use App\Exports\ExpenseReportExport;
use App\Http\Controllers\Controller;
use App\Models\ExpenseLine;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

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

        $filters = [
            'q' => $request->q,
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'category' => $request->category,
            'cashier_id' => $user->isAdminUser() ? $request->cashier_id : $user->id,
        ];

        $baseQuery = ExpenseReportExport::baseQuery($filters, $user);

        $byCategory = (clone $baseQuery)
            ->select(
                'expense_lines.category',
                DB::raw('SUM(expense_lines.amount) as total_amount'),
                DB::raw('COUNT(*) as total_count')
            )
            ->groupBy('expense_lines.category')
            ->orderByDesc('total_amount')
            ->get();

        $byMonth = (clone $baseQuery)
            ->select(
                DB::raw("DATE_FORMAT(expenses.expense_date, '%Y-%m') as month"),
                DB::raw('SUM(expense_lines.amount) as total_amount'),
                DB::raw('COUNT(*) as total_count')
            )
            ->groupBy(DB::raw("DATE_FORMAT(expenses.expense_date, '%Y-%m')"))
            ->orderBy('month')
            ->get();

        $expenses = (clone $baseQuery)
            ->with(['expense.user:id,name'])
            ->orderByDesc('expenses.expense_date')
            ->orderByDesc('expense_lines.id')
            ->paginate(10)
            ->withQueryString();

        $totalAmount = (int) (clone $baseQuery)->sum('expense_lines.amount');
        $totalCount = (int) (clone $baseQuery)->count('expense_lines.id');

        $categories = ExpenseLine::query()
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

    public function export(Request $request)
    {
        $user = $request->user();

        abort_unless($user->can('reports.export'), 403);
        abort_unless($user->can('reports.expense'), 403);

        $request->validate([
            'q' => 'nullable|string|max:100',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'category' => 'nullable|string|max:100',
            'cashier_id' => 'nullable|exists:users,id',
        ]);

        $filters = [
            'q' => $request->q,
            'start_date' => $request->start_date ?: now()->startOfMonth()->toDateString(),
            'end_date' => $request->end_date ?: now()->toDateString(),
            'category' => $request->category,
            'cashier_id' => !$user->isAdminUser() ? $user->id : $request->cashier_id,
        ];

        return Excel::download(
            new ExpenseReportExport($filters, $user),
            'laporan-pengeluaran-' . now()->format('Ymd_His') . '.xlsx'
        );
    }
}
