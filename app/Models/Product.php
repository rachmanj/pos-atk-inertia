<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Str;

class Product extends Model
{

    protected function casts(): array
    {
        return [
            'buy_price'  => 'integer',
            'sell_price' => 'integer',
            'avg_cost'   => 'integer',
            'stock'      => 'integer',
            'is_active'  => 'boolean',
        ];
    }

    protected $fillable = [
        'category_id',
        'image',
        'barcode',
        'title',
        'slug',
        'description',
        'product_type',
        'buy_price',
        'sell_price',
        'avg_cost',
        'unit',
        'stock',
        'is_active',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function productUnits(): HasMany
    {
        return $this->hasMany(ProductUnit::class);
    }

    public function baseUnit(): HasOne
    {
        return $this->hasOne(ProductUnit::class)->where('is_base_unit', true);
    }

    public function defaultSellUnit(): HasOne
    {
        return $this->hasOne(ProductUnit::class)->where('is_default_sell', true);
    }

    public function carts(): HasMany
    {
        return $this->hasMany(Cart::class);
    }

    public function transactionDetails(): HasMany
    {
        return $this->hasMany(TransactionDetail::class);
    }

    public function purchaseDetails(): HasMany
    {
        return $this->hasMany(PurchaseDetail::class);
    }

    public function stockOpnameDetails(): HasMany
    {
        return $this->hasMany(StockOpnameDetail::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function latestStockMovement(): HasOne
    {
        return $this->hasOne(StockMovement::class)->latestOfMany();
    }

    public function components(): HasMany
    {
        return $this->hasMany(ProductComponent::class, 'service_product_id');
    }

    public function usedInServices(): HasMany
    {
        return $this->hasMany(ProductComponent::class, 'component_product_id');
    }

    public function isPpob(): bool
    {
        return $this->product_type === 'ppob';
    }

    public function isPhysical(): bool
    {
        return $this->product_type === 'physical';
    }

    public function isService(): bool
    {
        return $this->product_type === 'service';
    }

    public function scopePhysical(Builder $query): Builder
    {
        return $query->where('product_type', 'physical');
    }

    public function scopePpob(Builder $query): Builder
    {
        return $query->where('product_type', 'ppob');
    }

    public function scopeService(Builder $query): Builder
    {
        return $query->where('product_type', 'service');
    }

    public function displayUnit(): ?string
    {
        return $this->baseUnit?->unit?->abbreviation ?? $this->unit;
    }

    protected function image(): Attribute
    {
        return Attribute::make(
            get: fn($image) => $image
                ? asset('/storage/products/' . $image)
                : null,
        );
    }

    protected static function booted(): void
    {
        static::creating(function (Product $product) {
            if (empty($product->slug)) {
                $product->slug = Str::slug($product->title);
            }
        });

        static::updating(function (Product $product) {
            if ($product->isDirty('title') && ! $product->isDirty('slug')) {
                $product->slug = Str::slug($product->title);
            }
        });
    }
}
