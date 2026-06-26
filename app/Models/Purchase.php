<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Purchase extends Model
{

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'total_items'   => 'integer',
            'total_qty'     => 'integer',
            'total_amount'  => 'integer',
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

    public function details(): HasMany
    {
        return $this->hasMany(PurchaseDetail::class);
    }

    public function supplierReturns(): HasMany
    {
        return $this->hasMany(SupplierReturn::class);
    }
}
