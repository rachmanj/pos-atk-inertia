<?php

namespace App\Exports;

use App\Models\ExpenseLine;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ExpenseReportExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    public function __construct(
        protected array $filters = [],
        protected ?User $user = null,
    ) {}

    public static function baseQuery(array $filters, ?User $user = null): Builder
    {
        $startDate = $filters['start_date'] ?? now()->startOfMonth()->toDateString();
        $endDate = $filters['end_date'] ?? now()->toDateString();

        $query = ExpenseLine::query()
            ->select('expense_lines.*')
            ->join('expenses', 'expense_lines.expense_id', '=', 'expenses.id')
            ->whereBetween('expenses.expense_date', [$startDate, $endDate]);

        if ($user !== null && !$user->isAdminUser()) {
            $query->where('expenses.user_id', $user->id);
        } elseif (!empty($filters['cashier_id'])) {
            $query->where('expenses.user_id', $filters['cashier_id']);
        }

        if (!empty($filters['category'])) {
            $query->where('expense_lines.category', $filters['category']);
        }

        if (!empty($filters['q'])) {
            $search = trim($filters['q']);
            $query->where(function (Builder $searchQuery) use ($search) {
                $searchQuery->where('expense_lines.title', 'like', '%' . $search . '%')
                    ->orWhere('expenses.code', 'like', '%' . $search . '%')
                    ->orWhere('expenses.note', 'like', '%' . $search . '%');
            });
        }

        return $query;
    }

    public function query()
    {
        return self::baseQuery($this->filters, $this->user)
            ->with(['expense.user:id,name'])
            ->orderByDesc('expenses.expense_date')
            ->orderByDesc('expense_lines.id');
    }

    public function headings(): array
    {
        return [
            'No',
            'Kode',
            'Tanggal',
            'Kategori',
            'Judul',
            'Jumlah',
            'Petugas',
            'Catatan',
        ];
    }

    public function map($row): array
    {
        static $no = 0;
        $no++;

        return [
            $no,
            $row->expense?->code,
            $row->expense?->expense_date?->format('d/m/Y') ?? $row->expense?->expense_date,
            $row->category,
            $row->title,
            (int) $row->amount,
            $row->expense?->user?->name ?? '-',
            $row->expense?->note ?? '',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
