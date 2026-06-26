<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Transaction extends Model
{
    protected function casts(): array
    {
        return [
            'cash'        => 'integer',
            'change'      => 'integer',
            'discount'    => 'integer',
            'grand_total' => 'integer',
            'paid_at'     => 'datetime',
            'voided_at'   => 'datetime',
        ];
    }

    protected $fillable = [
        'cashier_id',
        'customer_id',
        'invoice',
        'cash',
        'change',
        'discount',
        'grand_total',
        'payment_method',
        'payment_channel',
        'payment_status',
        'snap_token',
        'midtrans_transaction_id',
        'paid_at',
        'status',
        'void_reason',
        'voided_by',
        'voided_at',
        'note',
    ];

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function voidedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    public function details(): HasMany
    {
        return $this->hasMany(TransactionDetail::class);
    }

    public function profit(): HasOne
    {
        return $this->hasOne(Profit::class);
    }

    public function returnTransactions(): HasMany
    {
        return $this->hasMany(ReturnTransaction::class);
    }

    public function activeReturn(): HasOne
    {
        return $this->hasOne(ReturnTransaction::class)
            ->where('status', 'pending')
            ->latestOfMany();
    }

    public function isVoided(): bool
    {
        return $this->status === 'voided';
    }
}
