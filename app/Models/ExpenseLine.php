<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpenseLine extends Model
{
    protected function casts(): array
    {
        return [
            'amount' => 'integer',
        ];
    }

    protected $fillable = [
        'expense_id',
        'category',
        'title',
        'amount',
    ];

    public function expense(): BelongsTo
    {
        return $this->belongsTo(Expense::class);
    }
}
