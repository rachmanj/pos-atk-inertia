<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Cart extends Model
{

    protected function casts(): array
    {
        return [
            'qty' => 'integer',
            'price' => 'integer',
            'ppob_cost' => 'integer',
            'admin_fee' => 'integer',
            'is_held' => 'boolean',
        ];
    }

    protected $fillable = [
        'cashier_id',
        'product_id',
        'unit_id',
        'qty',
        'price',
        'customer_ref',
        'ppob_cost',
        'admin_fee',
        'is_held',
    ];

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }
}
