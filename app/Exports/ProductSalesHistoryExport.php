<?php

namespace App\Exports;

use App\Models\Product;
use App\Models\TransactionDetail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProductSalesHistoryExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    public function __construct(
        protected Product $product,
        protected array $filters = []
    ) {}

    public static function baseQuery(Product $product, array $filters): Builder
    {
        $query = TransactionDetail::query()
            ->select([
                'transaction_details.id',
                'transaction_details.qty',
                'transaction_details.price',
                'transaction_details.subtotal',
                'transaction_details.buy_price',
                'transactions.invoice',
                'users.name as cashier_name',
                DB::raw('COALESCE(transactions.paid_at, transactions.created_at) as waktu_raw'),
            ])
            ->join('transactions', 'transaction_details.transaction_id', '=', 'transactions.id')
            ->join('users', 'transactions.cashier_id', '=', 'users.id')
            ->where('transaction_details.product_id', $product->id)
            ->where('transactions.payment_status', 'paid')
            ->where('transactions.status', '!=', 'voided');

        if (!empty($filters['start_date'])) {
            $query->whereDate(
                DB::raw('COALESCE(transactions.paid_at, transactions.created_at)'),
                '>=',
                $filters['start_date']
            );
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate(
                DB::raw('COALESCE(transactions.paid_at, transactions.created_at)'),
                '<=',
                $filters['end_date']
            );
        }

        if (!empty($filters['cashier_id'])) {
            $query->where('transactions.cashier_id', $filters['cashier_id']);
        }

        return $query
            ->orderByDesc('transactions.created_at')
            ->orderByDesc('transaction_details.id');
    }

    public function query()
    {
        return self::baseQuery($this->product, $this->filters);
    }

    public function headings(): array
    {
        return [
            'Waktu',
            'No. Invoice',
            'Kasir',
            'Qty',
            'Harga Satuan',
            'Subtotal',
            'Laba',
        ];
    }

    public function map($row): array
    {
        $laba = (int) ($row->subtotal - ($row->buy_price * $row->qty));

        return [
            Carbon::parse($row->waktu_raw)->format('d/m/Y H:i'),
            $row->invoice,
            $row->cashier_name,
            (int) $row->qty,
            (int) $row->price,
            (int) $row->subtotal,
            $laba,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
