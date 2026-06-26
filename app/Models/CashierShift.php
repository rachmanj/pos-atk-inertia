<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashierShift extends Model
{

    protected function casts(): array
    {
        return [
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
            'cash_in_hand' => 'integer',
            'expected_cash' => 'integer',
            'actual_cash' => 'integer',
            'difference' => 'integer',
            'total_transactions' => 'integer',
            'ppob_opening_balance' => 'integer',
            'ppob_closing_balance' => 'integer',
            'ppob_expected_balance' => 'integer',
        ];
    }

    protected $fillable = [
        'user_id',
        'opened_at',
        'closed_at',
        'cash_in_hand',
        'ppob_opening_balance',
        'ppob_closing_balance',
        'ppob_expected_balance',
        'expected_cash',
        'actual_cash',
        'difference',
        'total_transactions',
        'note',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ppobBalanceLogs(): HasMany
    {
        return $this->hasMany(PpobBalanceLog::class);
    }

    public function isOpen(): bool
    {
        return $this->status === 'open';
    }
}
