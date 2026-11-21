<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConsignmentItem extends Model
{
    protected function casts(): array
    {
        return [
            'qty_in' => 'integer',
            'qty_sold' => 'integer',
            'qty_returned' => 'integer',
            'cost_price' => 'integer',
        ];
    }

    protected $fillable = [
        'consignment_id',
        'product_id',
        'qty_in',
        'qty_sold',
        'qty_returned',
        'cost_price',
    ];

    public function consignment(): BelongsTo
    {
        return $this->belongsTo(Consignment::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function paymentItems(): HasMany
    {
        return $this->hasMany(ConsignmentPaymentItem::class);
    }

    public function payments(): BelongsToMany
    {
        return $this->belongsToMany(ConsignmentPayment::class, 'consignment_payment_items')
            ->withPivot(['qty', 'amount'])
            ->withTimestamps();
    }

    public function remainingQty(): int
    {
        return max(0, (int) $this->qty_in - (int) $this->qty_sold - (int) $this->qty_returned);
    }
}