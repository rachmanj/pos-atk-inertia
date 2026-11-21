<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Consignment extends Model
{
    public const STATUS_OPEN = 'open';

    public const STATUS_CLOSED = 'closed';

    protected function casts(): array
    {
        return [
            'received_date' => 'date',
        ];
    }

    protected $fillable = [
        'supplier_id',
        'user_id',
        'code',
        'received_date',
        'note',
        'status',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ConsignmentItem::class);
    }

    public function returns(): HasMany
    {
        return $this->hasMany(SupplierReturn::class);
    }

    public function scopeStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_OPEN);
    }

    public function scopeClosed(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_CLOSED);
    }
}