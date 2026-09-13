<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashierShiftExpense extends Model
{
    protected function casts(): array
    {
        return [
            'amount' => 'integer',
        ];
    }

    protected $fillable = [
        'cashier_shift_id',
        'title',
        'amount',
    ];

    public function cashierShift(): BelongsTo
    {
        return $this->belongsTo(CashierShift::class);
    }
}
