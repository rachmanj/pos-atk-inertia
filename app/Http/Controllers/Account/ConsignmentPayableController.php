<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\ConsignmentPayment;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ConsignmentPayableController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->can('consignment_payments.create'), 403);

        $rows = $this->supplierPayableRows();

        $suppliers = collect($rows)
            ->filter(fn (array $row) => $row['remaining_debt'] > 0)
            ->values()
            ->all();

        $summary = [
            'total_remaining' => collect($suppliers)->sum('remaining_debt'),
            'supplier_count' => count($suppliers),
            'unpaid_item_count' => collect($suppliers)->sum('unpaid_item_count'),
        ];

        return Inertia::render('Account/ConsignmentPayables/Index', [
            'summary' => $summary,
            'suppliers' => $suppliers,
        ]);
    }

    public function show(Request $request, Supplier $supplier)
    {
        abort_unless($request->user()->can('consignment_payments.create'), 403);

        $totals = $this->supplierTotals($supplier->id);

        if ($totals['total_sold_value'] <= 0) {
            abort(404);
        }

        $unpaidLines = $this->unpaidConsignmentItemRows($supplier->id);

        $payments = ConsignmentPayment::query()
            ->where('supplier_id', $supplier->id)
            ->with(['user:id,name', 'items.consignmentItem.product:id,title,unit'])
            ->latest('paid_on')
            ->latest('id')
            ->get()
            ->map(fn (ConsignmentPayment $payment) => [
                'id' => $payment->id,
                'paid_on' => $payment->paid_on?->toDateString(),
                'amount' => (int) $payment->amount,
                'method' => $payment->method,
                'note' => $payment->note,
                'user' => $payment->user,
                'items' => $payment->items->map(fn ($item) => [
                    'id' => $item->id,
                    'qty' => (int) $item->qty,
                    'amount' => (int) $item->amount,
                    'consignment_item_id' => $item->consignment_item_id,
                    'product_title' => $item->consignmentItem?->product?->title,
                ]),
            ]);

        return Inertia::render('Account/ConsignmentPayables/Show', [
            'supplier' => [
                'id' => $supplier->id,
                'name' => $supplier->name,
                'no_telp' => $supplier->no_telp,
            ],
            'totals' => $totals,
            'unpaid_lines' => $unpaidLines,
            'payments' => $payments,
        ]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public static function supplierPayableRows(): array
    {
        $paidBySupplier = DB::table('consignment_payments')
            ->select('supplier_id', DB::raw('SUM(amount) as total_paid'))
            ->groupBy('supplier_id');

        $itemAgg = DB::table('consignment_items')
            ->join('consignments', 'consignments.id', '=', 'consignment_items.consignment_id')
            ->where('consignment_items.qty_sold', '>', 0)
            ->select(
                'consignments.supplier_id',
                DB::raw('SUM(consignment_items.qty_sold * consignment_items.cost_price) as total_sold_value'),
            )
            ->groupBy('consignments.supplier_id');

        $paidByItem = DB::table('consignment_payment_items')
            ->select(
                'consignment_item_id',
                DB::raw('SUM(qty) as paid_qty'),
                DB::raw('SUM(amount) as paid_amount'),
            )
            ->groupBy('consignment_item_id');

        $unpaidItems = DB::table('consignment_items')
            ->join('consignments', 'consignments.id', '=', 'consignment_items.consignment_id')
            ->leftJoinSub($paidByItem, 'paid', 'paid.consignment_item_id', '=', 'consignment_items.id')
            ->where('consignment_items.qty_sold', '>', 0)
            ->whereRaw(
                '(consignment_items.qty_sold * consignment_items.cost_price) - COALESCE(paid.paid_amount, 0) > 0'
            )
            ->select(
                'consignments.supplier_id',
                DB::raw('COUNT(*) as unpaid_item_count'),
            )
            ->groupBy('consignments.supplier_id');

        $rows = DB::table('suppliers')
            ->joinSub($itemAgg, 'sold', 'sold.supplier_id', '=', 'suppliers.id')
            ->leftJoinSub($paidBySupplier, 'pay_sup', 'pay_sup.supplier_id', '=', 'suppliers.id')
            ->leftJoinSub($unpaidItems, 'unpaid', 'unpaid.supplier_id', '=', 'suppliers.id')
            ->select([
                'suppliers.id',
                'suppliers.name',
                'sold.total_sold_value',
                DB::raw('COALESCE(pay_sup.total_paid, 0) as total_paid'),
                DB::raw('COALESCE(unpaid.unpaid_item_count, 0) as unpaid_item_count'),
            ])
            ->orderBy('suppliers.name')
            ->get();

        return $rows->map(function ($row) {
            $totalSold = (int) $row->total_sold_value;
            $totalPaid = (int) $row->total_paid;

            return [
                'id' => (int) $row->id,
                'name' => $row->name,
                'total_sold_value' => $totalSold,
                'total_paid' => $totalPaid,
                'remaining_debt' => max(0, $totalSold - $totalPaid),
                'unpaid_item_count' => (int) $row->unpaid_item_count,
            ];
        })->all();
    }

    /**
     * @return array{total_sold_value: int, total_paid: int, remaining_debt: int, unpaid_item_count: int}
     */
    public static function supplierTotals(int $supplierId): array
    {
        foreach (self::supplierPayableRows() as $row) {
            if ($row['id'] === $supplierId) {
                return [
                    'total_sold_value' => $row['total_sold_value'],
                    'total_paid' => $row['total_paid'],
                    'remaining_debt' => $row['remaining_debt'],
                    'unpaid_item_count' => $row['unpaid_item_count'],
                ];
            }
        }

        return [
            'total_sold_value' => 0,
            'total_paid' => 0,
            'remaining_debt' => 0,
            'unpaid_item_count' => 0,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public static function unpaidConsignmentItemRows(int $supplierId): array
    {
        $paidByItem = DB::table('consignment_payment_items')
            ->select(
                'consignment_item_id',
                DB::raw('SUM(qty) as paid_qty'),
                DB::raw('SUM(amount) as paid_amount'),
            )
            ->groupBy('consignment_item_id');

        $rows = DB::table('consignment_items')
            ->join('consignments', 'consignments.id', '=', 'consignment_items.consignment_id')
            ->join('products', 'products.id', '=', 'consignment_items.product_id')
            ->leftJoinSub($paidByItem, 'paid', 'paid.consignment_item_id', '=', 'consignment_items.id')
            ->where('consignments.supplier_id', $supplierId)
            ->where('consignment_items.qty_sold', '>', 0)
            ->whereRaw(
                '(consignment_items.qty_sold * consignment_items.cost_price) - COALESCE(paid.paid_amount, 0) > 0'
            )
            ->orderBy('consignments.received_date')
            ->orderBy('consignment_items.id')
            ->select([
                'consignment_items.id as consignment_item_id',
                'consignment_items.qty_sold',
                'consignment_items.cost_price',
                'consignments.id as consignment_id',
                'consignments.code as consignment_code',
                'consignments.received_date',
                'products.id as product_id',
                'products.title as product_title',
                'products.unit as product_unit',
                'products.barcode as product_barcode',
                DB::raw('COALESCE(paid.paid_qty, 0) as paid_qty'),
                DB::raw('COALESCE(paid.paid_amount, 0) as paid_amount'),
            ])
            ->get();

        return $rows->map(function ($row) {
            $qtySold = (int) $row->qty_sold;
            $costPrice = (int) $row->cost_price;
            $paidQty = (int) $row->paid_qty;
            $paidAmount = (int) $row->paid_amount;
            $soldValue = $qtySold * $costPrice;
            $remainingQty = max(0, $qtySold - $paidQty);
            $remainingValue = max(0, $soldValue - $paidAmount);

            return [
                'consignment_item_id' => (int) $row->consignment_item_id,
                'consignment_id' => (int) $row->consignment_id,
                'consignment_code' => $row->consignment_code,
                'received_date' => $row->received_date,
                'product' => [
                    'id' => (int) $row->product_id,
                    'title' => $row->product_title,
                    'unit' => $row->product_unit,
                    'barcode' => $row->product_barcode,
                ],
                'qty_sold' => $qtySold,
                'cost_price' => $costPrice,
                'sold_value' => $soldValue,
                'paid_qty' => $paidQty,
                'paid_amount' => $paidAmount,
                'remaining_qty' => $remainingQty,
                'remaining_value' => $remainingValue,
            ];
        })->all();
    }
}