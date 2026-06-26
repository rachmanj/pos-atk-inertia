<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PpobAccount extends Model
{
    protected function casts(): array
    {
        return [
            'current_balance' => 'integer',
            'min_balance_alert' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    protected $fillable = [
        'name',
        'current_balance',
        'min_balance_alert',
        'is_active',
        'note',
    ];

    public function balanceLogs(): HasMany
    {
        return $this->hasMany(PpobBalanceLog::class);
    }

    public function isLowBalance(): bool
    {
        return $this->current_balance <= $this->min_balance_alert;
    }

    public static function activeAccount(): ?self
    {
        return static::query()
            ->where('is_active', true)
            ->orderBy('id')
            ->first();
    }
}
