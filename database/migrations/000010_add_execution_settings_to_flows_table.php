<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flows', function (Blueprint $table) {
            $table->unsignedInteger('timeout_seconds')->default(300)->after('is_active');
            $table->unsignedTinyInteger('max_retries')->default(0)->after('timeout_seconds');
            $table->boolean('include_raw_output')->default(false)->after('max_retries');
        });
    }

    public function down(): void
    {
        Schema::table('flows', function (Blueprint $table) {
            $table->dropColumn(['timeout_seconds', 'max_retries', 'include_raw_output']);
        });
    }
};
