<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class Purchase extends Model
{
    public const PAYMENT_STATUS_UNPAID = 'unpaid';

    public const PAYMENT_STATUS_PARTIAL = 'partial';

    public const PAYMENT_STATUS_PAID = 'paid';

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'due_date' => 'date',
            'total_items' => 'integer',
            'total_qty' => 'integer',
            'total_amount' => 'integer',
            'dpp_amount' => 'integer',
            'tax_amount' => 'integer',
            'tax_rate' => 'decimal:2',
            'tax_included' => 'boolean',
            'hpp_includes_tax' => 'boolean',
            'payment_term_days' => 'integer',
        ];
    }

    protected $fillable = [
        'supplier_id',
        'user_id',
        'invoice',
        'purchase_date',
        'total_items',
        'total_qty',
        'total_amount',
        'dpp_amount',
        'tax_amount',
        'tax_rate',
        'tax_included',
        'hpp_includes_tax',
        'note',
        'payment_status',
        'payment_term_days',
        'due_date',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function details(): HasMany
    {
        return $this->hasMany(PurchaseDetail::class);
    }

    public function supplierReturns(): HasMany
    {
        return $this->hasMany(SupplierReturn::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(PurchasePayment::class);
    }

    public function scopeNotFullyPaid(Builder $query): Builder
    {
        return $query->where('payment_status', '!=', self::PAYMENT_STATUS_PAID);
    }

    public function paidAmount(): int
    {
        if (array_key_exists('paid_amount_sum', $this->attributes)) {
            return (int) $this->attributes['paid_amount_sum'];
        }

        if ($this->relationLoaded('payments')) {
            return (int) $this->payments->sum('amount');
        }

        return (int) $this->payments()->sum('amount');
    }

    public function remaining(): int
    {
        return max(0, (int) $this->total_amount - $this->paidAmount());
    }

    public function isOverdue(): bool
    {
        if ($this->payment_status === self::PAYMENT_STATUS_PAID || !$this->due_date) {
            return false;
        }

        return $this->due_date->lt(Carbon::today());
    }

    public function isDueSoon(int $days = 7): bool
    {
        if ($this->payment_status === self::PAYMENT_STATUS_PAID || !$this->due_date) {
            return false;
        }

        return $this->due_date->lte(Carbon::today()->addDays($days));
    }

    public function payableAgeBucket(): string
    {
        if ($this->payment_status === self::PAYMENT_STATUS_PAID) {
            return '';
        }

        $today = Carbon::today();

        if (!$this->due_date || $this->due_date->gte($today)) {
            return 'not_due';
        }

        $daysOverdue = (int) $this->due_date->diffInDays($today);

        if ($daysOverdue <= 30) {
            return '1_30';
        }

        return 'over_30';
    }

    public function payableAgeLabel(): string
    {
        return match ($this->payableAgeBucket()) {
            'not_due' => 'Belum jatuh tempo',
            '1_30' => '1–30 hari',
            'over_30' => '>30 hari',
            default => '',
        };
    }

    public function refreshPaymentStatus(): void
    {
        $paid = $this->paidAmount();
        $remaining = (int) $this->total_amount - $paid;

        if ($remaining <= 0) {
            $status = self::PAYMENT_STATUS_PAID;
        } elseif ($paid > 0) {
            $status = self::PAYMENT_STATUS_PARTIAL;
        } else {
            $status = self::PAYMENT_STATUS_UNPAID;
        }

        $this->forceFill(['payment_status' => $status])->save();
    }

    /**
     * @return array{payment_term_days: ?int, due_date: ?string, payment_status: string}
     */
    public static function resolvePaymentTerms(string $purchaseDate, mixed $paymentTerm): array
    {
        $purchaseDay = Carbon::parse($purchaseDate)->startOfDay();

        if ($paymentTerm === null || $paymentTerm === '') {
            $paymentTerm = '30';
        }

        $paymentTerm = is_string($paymentTerm) ? trim($paymentTerm) : (string) $paymentTerm;

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $paymentTerm)) {
            $dueDate = Carbon::parse($paymentTerm)->startOfDay();

            return [
                'payment_term_days' => null,
                'due_date' => $dueDate->toDateString(),
                'payment_status' => self::PAYMENT_STATUS_UNPAID,
            ];
        }

        $days = (int) $paymentTerm;

        if ($days === 0) {
            return [
                'payment_term_days' => 0,
                'due_date' => null,
                'payment_status' => self::PAYMENT_STATUS_PAID,
            ];
        }

        return [
            'payment_term_days' => $days,
            'due_date' => $purchaseDay->copy()->addDays($days)->toDateString(),
            'payment_status' => self::PAYMENT_STATUS_UNPAID,
        ];
    }
}
