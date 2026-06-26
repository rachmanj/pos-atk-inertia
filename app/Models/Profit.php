<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Profit extends Model
{

    protected function casts(): array
    {
        return [
            'total_revenue' => 'integer',
            'total_cost'    => 'integer',
            'profit_amount' => 'integer',
        ];
    }

    protected $fillable = [
        'transaction_id',
        'total_revenue',
        'total_cost',
        'profit_amount',
    ];

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }
}
