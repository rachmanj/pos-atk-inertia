<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchasePayment extends Model
{
    public const METHOD_TUNAI = 'tunai';

    public const METHOD_TRANSFER = 'transfer';

    public const METHOD_LAINNYA = 'lainnya';

    protected function casts(): array
    {
        return [
            'paid_on' => 'date',
            'amount' => 'integer',
        ];
    }

    protected $fillable = [
        'purchase_id',
        'user_id',
        'paid_on',
        'amount',
        'method',
        'note',
    ];

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
