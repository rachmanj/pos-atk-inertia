<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransactionPayment extends Model
{
    public const METHOD_CASH = 'cash';

    public const METHOD_QRIS = 'qris';

    public const METHOD_TRANSFER = 'transfer';

    public const METHOD_DIGITAL = 'digital';

    public const STATUS_PENDING = 'pending';

    public const STATUS_PAID = 'paid';

    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'transaction_id',
        'method',
        'amount',
        'payment_status',
        'channel',
        'reference',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'paid_at' => 'datetime',
        ];
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public static function nonCashMethods(): array
    {
        return [
            self::METHOD_QRIS,
            self::METHOD_TRANSFER,
            self::METHOD_DIGITAL,
        ];
    }
}
