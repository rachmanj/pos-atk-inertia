<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Expense extends Model
{
    protected function casts(): array
    {
        return [
            'expense_date' => 'date',
            'amount'       => 'integer',
        ];
    }

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'code',
        'expense_date',
        'amount',
        'note',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(ExpenseLine::class);
    }
}
