<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Coupon extends Model
{
    protected $fillable = [
        'code',
        'description',
        'discount_value',
        'discount_type',
        'min_order_amount',
        'max_discount',
        'usage_limit',
        'usage_count',
        'offer_id',
        'valid_from',
        'valid_until',
        'is_active',
    ];

    protected $casts = [
        'discount_value' => 'decimal:3',
        'min_order_amount' => 'decimal:3',
        'max_discount' => 'decimal:3',
        'usage_limit' => 'integer',
        'usage_count' => 'integer',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class);
    }

    public function isValid(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->usage_limit && $this->usage_count >= $this->usage_limit) {
            return false;
        }

        $now = now();
        if ($this->valid_from && $now->lt($this->valid_from)) {
            return false;
        }

        if ($this->valid_until && $now->gt($this->valid_until)) {
            return false;
        }

        return true;
    }

    public function calculateDiscount(float $orderAmount): float
    {
        if (!$this->isValid()) {
            return 0;
        }

        if ($this->min_order_amount && $orderAmount < $this->min_order_amount) {
            return 0;
        }

        $discount = $this->discount_type === 'percentage'
            ? $orderAmount * ($this->discount_value / 100)
            : $this->discount_value;

        if ($this->max_discount && $discount > $this->max_discount) {
            return $this->max_discount;
        }

        return $discount;
    }
}