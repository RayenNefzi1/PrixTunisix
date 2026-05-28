<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = ['user_id', 'name', 'prename', 'cin', 'phone', 'auto_id'];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($employee) {
            if (empty($employee->auto_id)) {
                $employee->auto_id = 'EMP' . strtoupper(uniqid());
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewedMatches()
    {
        return $this->hasMany(ProductMatch::class, 'reviewed_by');
    }
}
