<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_variables', function (Blueprint $table) {
            $table->string('vault_vault_name')->nullable()->after('vault_vault_id');
            $table->string('vault_item_name')->nullable()->after('vault_item_id');
        });
    }

    public function down(): void
    {
        Schema::table('user_variables', function (Blueprint $table) {
            $table->dropColumn(['vault_vault_name', 'vault_item_name']);
        });
    }
};
