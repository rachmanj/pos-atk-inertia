<?php

namespace App\Exports;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ConsignmentReportExport implements WithMultipleSheets
{
    public function __construct(
        protected array $filters = [],
    ) {}

    public function sheets(): array
    {
        return [
            new ConsignmentReportSummarySheetExport($this->filters),
            new ConsignmentReportDetailSheetExport($this->filters),
        ];
    }

    public static function resolveFilters(array $input): array
    {
        return [
            'start_date' => $input['start_date'] ?? now()->startOfMonth()->toDateString(),
            'end_date' => $input['end_date'] ?? now()->toDateString(),
            'supplier_id' => !empty($input['supplier_id']) ? (int) $input['supplier_id'] : null,
        ];
    }

    protected static function soldQtyInPeriodSubquery(string $startDate, string $endDate)
    {
        $start = $startDate . ' 00:00:00';
        $end = $endDate . ' 23:59:59';

        return DB::table('transaction_details')
            ->join('transactions', 'transactions.id', '=', 'transaction_details.transaction_id')
            ->whereNotNull('transaction_details.consignment_item_id')
            ->where('transactions.payment_status', 'paid')
            ->where('transactions.status', '!=', 'voided')
            ->whereBetween(
                DB::raw('COALESCE(transactions.paid_at, transactions.created_at)'),
                [$start, $end]
            )
            ->select(
                'transaction_details.consignment_item_id',
                DB::raw('SUM(transaction_details.consignment_qty) as qty_sold_period'),
            )
            ->groupBy('transaction_details.consignment_item_id');
    }

    protected static function returnedQtyInPeriodSubquery(string $startDate, string $endDate)
    {
        return DB::table('supplier_return_details')
            ->join('supplier_returns', 'supplier_returns.id', '=', 'supplier_return_details.supplier_return_id')
            ->whereNotNull('supplier_return_details.consignment_item_id')
            ->whereBetween('supplier_returns.return_date', [$startDate, $endDate])
            ->select(
                'supplier_return_details.consignment_item_id',
                DB::raw('SUM(supplier_return_details.qty) as qty_returned_period'),
            )
            ->groupBy('supplier_return_details.consignment_item_id');
    }

    protected static function paidByItemSubquery()
    {
        return DB::table('consignment_payment_items')
            ->select(
                'consignment_item_id',
                DB::raw('SUM(amount) as paid_amount'),
            )
            ->groupBy('consignment_item_id');
    }

    /**
     * @return list<array<string, mixed>>
     */
    public static function supplierSummaryRows(array $filters): array
    {
        $filters = self::resolveFilters($filters);
        $startDate = $filters['start_date'];
        $endDate = $filters['end_date'];
        $supplierId = $filters['supplier_id'];

        $soldPeriod = self::soldQtyInPeriodSubquery($startDate, $endDate);
        $returnedPeriod = self::returnedQtyInPeriodSubquery($startDate, $endDate);
        $paidByItem = self::paidByItemSubquery();

        $itemRows = DB::table('consignment_items')
            ->join('consignments', 'consignments.id', '=', 'consignment_items.consignment_id')
            ->join('suppliers', 'suppliers.id', '=', 'consignments.supplier_id')
            ->leftJoinSub($soldPeriod, 'sold_p', 'sold_p.consignment_item_id', '=', 'consignment_items.id')
            ->leftJoinSub($returnedPeriod, 'ret_p', 'ret_p.consignment_item_id', '=', 'consignment_items.id')
            ->leftJoinSub($paidByItem, 'paid', 'paid.consignment_item_id', '=', 'consignment_items.id')
            ->whereBetween('consignments.received_date', [$startDate, $endDate])
            ->when($supplierId, fn ($q) => $q->where('consignments.supplier_id', $supplierId))
            ->select([
                'suppliers.id as supplier_id',
                'suppliers.name as supplier_name',
                'consignment_items.qty_in',
                'consignment_items.qty_sold',
                'consignment_items.qty_returned',
                'consignment_items.cost_price',
                DB::raw('COALESCE(sold_p.qty_sold_period, 0) as qty_sold_period'),
                DB::raw('COALESCE(ret_p.qty_returned_period, 0) as qty_returned_period'),
                DB::raw('COALESCE(paid.paid_amount, 0) as paid_amount'),
            ])
            ->get();

        $debtBySupplier = self::unpaidDebtBySupplier($supplierId);

        $grouped = [];
        foreach ($itemRows as $row) {
            $sid = (int) $row->supplier_id;
            if (!isset($grouped[$sid])) {
                $grouped[$sid] = [
                    'supplier_id' => $sid,
                    'supplier_name' => $row->supplier_name,
                    'qty_dititip' => 0,
                    'qty_terjual' => 0,
                    'qty_retur' => 0,
                    'sisa' => 0,
                    'nilai_utang_belum_dibayar' => $debtBySupplier[$sid] ?? 0,
                ];
            }

            $qtyIn = (int) $row->qty_in;
            $qtySoldTotal = (int) $row->qty_sold;
            $qtyReturnedTotal = (int) $row->qty_returned;
            $qtySoldPeriod = (int) $row->qty_sold_period;
            $qtyReturnedPeriod = (int) $row->qty_returned_period;

            $grouped[$sid]['qty_dititip'] += $qtyIn;
            $grouped[$sid]['qty_terjual'] += $qtySoldPeriod > 0 ? $qtySoldPeriod : $qtySoldTotal;
            $grouped[$sid]['qty_retur'] += $qtyReturnedPeriod > 0 ? $qtyReturnedPeriod : $qtyReturnedTotal;
            $grouped[$sid]['sisa'] += max(0, $qtyIn - $qtySoldTotal - $qtyReturnedTotal);
        }

        $rows = array_values($grouped);
        usort($rows, fn ($a, $b) => strcmp($a['supplier_name'], $b['supplier_name']));

        return $rows;
    }

    /**
     * @return array<int, int>
     */
    protected static function unpaidDebtBySupplier(?int $supplierId = null): array
    {
        $paidByItem = self::paidByItemSubquery();

        $query = DB::table('consignment_items')
            ->join('consignments', 'consignments.id', '=', 'consignment_items.consignment_id')
            ->leftJoinSub($paidByItem, 'paid', 'paid.consignment_item_id', '=', 'consignment_items.id')
            ->where('consignment_items.qty_sold', '>', 0)
            ->when($supplierId, fn ($q) => $q->where('consignments.supplier_id', $supplierId))
            ->select([
                'consignments.supplier_id',
                DB::raw(
                    'SUM(GREATEST(0, (consignment_items.qty_sold * consignment_items.cost_price) - COALESCE(paid.paid_amount, 0))) as remaining_debt'
                ),
            ])
            ->groupBy('consignments.supplier_id');

        $result = [];
        foreach ($query->get() as $row) {
            $result[(int) $row->supplier_id] = (int) $row->remaining_debt;
        }

        return $result;
    }

    public static function detailQuery(array $filters): Builder
    {
        $filters = self::resolveFilters($filters);
        $startDate = $filters['start_date'];
        $endDate = $filters['end_date'];
        $supplierId = $filters['supplier_id'];

        $soldPeriod = self::soldQtyInPeriodSubquery($startDate, $endDate);
        $returnedPeriod = self::returnedQtyInPeriodSubquery($startDate, $endDate);

        return \App\Models\ConsignmentItem::query()
            ->join('consignments', 'consignments.id', '=', 'consignment_items.consignment_id')
            ->join('suppliers', 'suppliers.id', '=', 'consignments.supplier_id')
            ->join('products', 'products.id', '=', 'consignment_items.product_id')
            ->leftJoinSub($soldPeriod, 'sold_p', 'sold_p.consignment_item_id', '=', 'consignment_items.id')
            ->leftJoinSub($returnedPeriod, 'ret_p', 'ret_p.consignment_item_id', '=', 'consignment_items.id')
            ->whereBetween('consignments.received_date', [$startDate, $endDate])
            ->when($supplierId, fn ($q) => $q->where('consignments.supplier_id', $supplierId))
            ->orderBy('consignments.received_date')
            ->orderBy('consignments.code')
            ->orderBy('consignment_items.id')
            ->select([
                'consignment_items.*',
                'consignments.code as consignment_code',
                'consignments.received_date',
                'suppliers.id as supplier_id',
                'suppliers.name as supplier_name',
                'products.title as product_title',
                'products.barcode as product_barcode',
                DB::raw('COALESCE(sold_p.qty_sold_period, 0) as qty_sold_period'),
                DB::raw('COALESCE(ret_p.qty_returned_period, 0) as qty_returned_period'),
            ]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public static function detailRows(array $filters): array
    {
        return self::detailQuery($filters)->get()->map(function ($row) {
            $qtyIn = (int) $row->qty_in;
            $qtySoldTotal = (int) $row->qty_sold;
            $qtyReturnedTotal = (int) $row->qty_returned;
            $qtySoldPeriod = (int) $row->qty_sold_period;
            $qtyReturnedPeriod = (int) $row->qty_returned_period;
            $costPrice = (int) $row->cost_price;

            $qtyTerjual = $qtySoldPeriod > 0 ? $qtySoldPeriod : $qtySoldTotal;
            $qtyRetur = $qtyReturnedPeriod > 0 ? $qtyReturnedPeriod : $qtyReturnedTotal;
            $sisa = max(0, $qtyIn - $qtySoldTotal - $qtyReturnedTotal);

            return [
                'consignment_item_id' => (int) $row->id,
                'consignment_code' => $row->consignment_code,
                'received_date' => $row->received_date instanceof \Carbon\Carbon
                    ? $row->received_date->toDateString()
                    : (string) $row->received_date,
                'supplier_id' => (int) $row->supplier_id,
                'supplier_name' => $row->supplier_name,
                'product_title' => $row->product_title,
                'product_barcode' => $row->product_barcode,
                'qty_in' => $qtyIn,
                'qty_terjual' => $qtyTerjual,
                'qty_retur' => $qtyRetur,
                'sisa' => $sisa,
                'cost_price' => $costPrice,
                'nilai_terjual' => $qtyTerjual * $costPrice,
            ];
        })->all();
    }
}

class ConsignmentReportSummarySheetExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithTitle
{
    public function __construct(
        protected array $filters = [],
    ) {}

    public function title(): string
    {
        return 'Ringkasan Supplier';
    }

    public function collection(): Collection
    {
        return collect(ConsignmentReportExport::supplierSummaryRows($this->filters));
    }

    public function headings(): array
    {
        return [
            'No',
            'Supplier',
            'Qty Dititip',
            'Qty Terjual',
            'Qty Retur',
            'Sisa',
            'Utang Belum Dibayar',
        ];
    }

    public function map($row): array
    {
        static $no = 0;
        $no++;

        return [
            $no,
            $row['supplier_name'],
            (int) $row['qty_dititip'],
            (int) $row['qty_terjual'],
            (int) $row['qty_retur'],
            (int) $row['sisa'],
            (int) $row['nilai_utang_belum_dibayar'],
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}

class ConsignmentReportDetailSheetExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithTitle
{
    public function __construct(
        protected array $filters = [],
    ) {}

    public function title(): string
    {
        return 'Rincian';
    }

    public function collection(): Collection
    {
        return collect(ConsignmentReportExport::detailRows($this->filters));
    }

    public function headings(): array
    {
        return [
            'No',
            'Kode Konsinyasi',
            'Tanggal Terima',
            'Supplier',
            'Produk',
            'Barcode',
            'Qty Dititip',
            'Qty Terjual',
            'Qty Retur',
            'Sisa',
            'Harga Konsinyasi',
            'Nilai Terjual',
        ];
    }

    public function map($row): array
    {
        static $no = 0;
        $no++;

        $received = $row['received_date'];
        if ($received) {
            try {
                $received = \Illuminate\Support\Carbon::parse($received)->format('d/m/Y');
            } catch (\Throwable) {
                // keep raw
            }
        }

        return [
            $no,
            $row['consignment_code'],
            $received,
            $row['supplier_name'],
            $row['product_title'],
            $row['product_barcode'] ?? '',
            (int) $row['qty_in'],
            (int) $row['qty_terjual'],
            (int) $row['qty_retur'],
            (int) $row['sisa'],
            (int) $row['cost_price'],
            (int) $row['nilai_terjual'],
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}