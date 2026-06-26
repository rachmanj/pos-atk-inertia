<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReturnTransaction extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'total_refund' => 'integer',
        ];
    }

    protected $fillable = [
        'transaction_id',
        'cashier_id',
        'invoice',
        'reason',
        'note',
        'total_refund',
        'refund_method',
        'status',
    ];

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function details(): HasMany
    {
        return $this->hasMany(ReturnDetail::class);
    }
}
