<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_variables', function (Blueprint $table) {
            $table->string('vault_field_type')->nullable()->after('vault_field_label');
        });
    }

    public function down(): void
    {
        Schema::table('user_variables', function (Blueprint $table) {
            $table->dropColumn('vault_field_type');
        });
    }
};
