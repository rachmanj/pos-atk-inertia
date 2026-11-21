<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConsignmentPayment extends Model
{
    public const METHOD_TUNAI = 'tunai';

    public const METHOD_TRANSFER = 'transfer';

    protected function casts(): array
    {
        return [
            'paid_on' => 'date',
            'amount' => 'integer',
        ];
    }

    protected $fillable = [
        'supplier_id',
        'user_id',
        'paid_on',
        'amount',
        'method',
        'note',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ConsignmentPaymentItem::class);
    }
}