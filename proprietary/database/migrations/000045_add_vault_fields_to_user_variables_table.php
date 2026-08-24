<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_variables', function (Blueprint $table) {
            $table->string('vault_provider')->nullable()->after('group');
            $table->string('vault_integration_id', 32)->nullable()->after('vault_provider');
            $table->foreign('vault_integration_id')->references('id')->on('integrations')->nullOnDelete();
            $table->string('vault_vault_id')->nullable()->after('vault_integration_id');
            $table->string('vault_item_id')->nullable()->after('vault_vault_id');
            $table->string('vault_field_label')->nullable()->after('vault_item_id');
        });
    }

    public function down(): void
    {
        Schema::table('user_variables', function (Blueprint $table) {
            $table->dropForeign(['vault_integration_id']);
            $table->dropColumn([
                'vault_provider',
                'vault_integration_id',
                'vault_vault_id',
                'vault_item_id',
                'vault_field_label',
            ]);
        });
    }
};
