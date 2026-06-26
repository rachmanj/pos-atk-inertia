<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupplierReturn extends Model
{

    protected function casts(): array
    {
        return [
            'return_date'  => 'date',
            'total_items'  => 'integer',
            'total_qty'    => 'integer',
            'total_amount' => 'integer',
        ];
    }

    protected $fillable = [
        'purchase_id',
        'supplier_id',
        'user_id',
        'invoice',
        'return_date',
        'total_items',
        'total_qty',
        'total_amount',
        'reason',
        'note',
    ];

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

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
        return $this->hasMany(SupplierReturnDetail::class);
    }
}
