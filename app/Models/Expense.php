<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Expense extends Model
{
    public const PAYMENT_SOURCE_CASH = 'cash';

    public const PAYMENT_SOURCE_BANK = 'bank';

    public const PAYMENT_SOURCE_PPOB = 'ppob';

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
        'payment_source',
        'ppob_account_id',
        'cashier_shift_id',
        'balance_log_id',
    ];

    public static function paymentSourceLabels(): array
    {
        return [
            self::PAYMENT_SOURCE_CASH => 'Kas (Laci)',
            self::PAYMENT_SOURCE_BANK => 'Bank (Transfer)',
            self::PAYMENT_SOURCE_PPOB => 'Saldo PPOB',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(ExpenseLine::class);
    }

    public function ppobAccount(): BelongsTo
    {
        return $this->belongsTo(PpobAccount::class);
    }

    public function cashierShift(): BelongsTo
    {
        return $this->belongsTo(CashierShift::class);
    }

    public function balanceLog(): BelongsTo
    {
        return $this->belongsTo(PpobBalanceLog::class, 'balance_log_id');
    }
}
