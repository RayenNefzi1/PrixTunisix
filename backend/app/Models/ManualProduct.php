<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ManualProduct extends Model
{
    protected $fillable = [
        'request_id',
        'fournisseur_id',
        'name',
        'description',
        'price',
        'image_url',
        'reference',
        'category_id',
        'brand_id',
        'matched_product_id',
        'status',
        'rejection_reason',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'reviewed_at' => 'datetime',
    ];

    public function request()
    {
        return $this->belongsTo(ManualProductRequest::class, 'request_id');
    }

    public function fournisseur()
    {
        return $this->belongsTo(Fournisseur::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}