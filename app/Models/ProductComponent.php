<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductComponent extends Model
{
    protected $fillable = [
        'service_product_id',
        'component_product_id',
        'qty_per_unit',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'qty_per_unit' => 'decimal:4',
        ];
    }

    public function serviceProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'service_product_id');
    }

    public function componentProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'component_product_id');
    }
}
