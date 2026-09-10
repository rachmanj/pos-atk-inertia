<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionHistoryController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $transactions = Transaction::query()
            ->with(['cashier', 'customer'])
            ->withCount([
                'returnTransactions as blocking_returns_count' => function ($query) {
                    $query->whereIn('status', ['pending', 'approved']);
                },
            ])
            ->when(!$user->isAdminUser(), function ($query) use ($user) {
                $query->where('cashier_id', $user->id);
            })
            ->when($request->search, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('invoice', 'like', '%' . $search . '%')
                        ->orWhereHas('cashier', function ($query) use ($search) {
                            $query->where('name', 'like', '%' . $search . '%');
                        })
                        ->orWhereHas('customer', function ($query) use ($search) {
                            $query->where('name', 'like', '%' . $search . '%');
                        });
                });
            })
            ->when($request->payment_method, function ($query, $paymentMethod) {
                $query->where('payment_method', $paymentMethod);
            })
            ->when($request->payment_status, function ($query, $paymentStatus) {
                $query->where('payment_status', $paymentStatus);
            })
            ->when($request->start_date, fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($request->end_date, fn ($q, $d) => $q->whereDate('created_at', '<=', $d))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return inertia('Account/Transactions/Index', [
            'transactions' => $transactions,
            'filters' => [
                'search' => $request->search,
                'payment_method' => $request->payment_method,
                'payment_status' => $request->payment_status,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
            ],
        ]);
    }
}
