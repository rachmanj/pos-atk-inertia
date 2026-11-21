<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsignmentPaymentItem extends Model
{
    protected function casts(): array
    {
        return [
            'qty' => 'integer',
            'amount' => 'integer',
        ];
    }

    protected $fillable = [
        'consignment_payment_id',
        'consignment_item_id',
        'qty',
        'amount',
    ];

    public function payment(): BelongsTo
    {
        return $this->belongsTo(ConsignmentPayment::class, 'consignment_payment_id');
    }

    public function consignmentItem(): BelongsTo
    {
        return $this->belongsTo(ConsignmentItem::class);
    }
}