<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('private_libraries', function (Blueprint $table) {
            $table->boolean('stale')->default(false)->index();
        });
    }

    public function down(): void
    {
        Schema::table('private_libraries', function (Blueprint $table) {
            $table->dropIndex(['stale']);
            $table->dropColumn('stale');
        });
    }
};
