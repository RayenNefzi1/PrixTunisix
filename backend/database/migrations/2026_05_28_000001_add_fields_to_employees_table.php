<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('name')->nullable()->after('user_id');
            $table->string('prename')->nullable()->after('name');
            $table->string('cin')->nullable()->unique()->after('prename');
            $table->string('phone')->nullable()->after('cin');
            $table->string('auto_id')->nullable()->unique()->after('phone');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['name', 'prename', 'cin', 'phone', 'auto_id']);
        });
    }
};