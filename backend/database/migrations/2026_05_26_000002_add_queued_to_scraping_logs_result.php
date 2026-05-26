<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the existing check constraint
        DB::statement('ALTER TABLE scraping_logs DROP CONSTRAINT IF EXISTS scraping_logs_result_check');
        
        // Recreate with the new value
        DB::statement("ALTER TABLE scraping_logs ADD CONSTRAINT scraping_logs_result_check CHECK (result IN ('success', 'partial', 'failed', 'queued', 'running'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE scraping_logs DROP CONSTRAINT IF EXISTS scraping_logs_result_check');
        DB::statement("ALTER TABLE scraping_logs ADD CONSTRAINT scraping_logs_result_check CHECK (result IN ('success', 'partial', 'failed'))");
    }
};