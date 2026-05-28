<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ManualProductRequest extends Model
{
    protected $fillable = [
        'fournisseur_id',
        'file_path',
        'file_name',
        'file_type',
        'total_rows',
        'processed_rows',
        'status',
        'notes',
        'completed_at',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    public function fournisseur()
    {
        return $this->belongsTo(Fournisseur::class);
    }

    public function products()
    {
        return $this->hasMany(ManualProduct::class, 'request_id');
    }

    public function pendingProducts()
    {
        return $this->hasMany(ManualProduct::class, 'request_id')->where('status', 'pending');
    }
}