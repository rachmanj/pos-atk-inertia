<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierReturnDetail extends Model
{
    protected function casts(): array
    {
        return [
            'qty'       => 'integer',
            'buy_price' => 'integer',
            'subtotal'  => 'integer',
        ];
    }

    protected $fillable = [
        'supplier_return_id',
        'purchase_detail_id',
        'product_id',
        'qty',
        'buy_price',
        'subtotal',
    ];

    public function supplierReturn(): BelongsTo
    {
        return $this->belongsTo(SupplierReturn::class);
    }

    public function purchaseDetail(): BelongsTo
    {
        return $this->belongsTo(PurchaseDetail::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
