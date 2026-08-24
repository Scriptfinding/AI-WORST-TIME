<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flows', function (Blueprint $table): void {
            $table->json('blueprint_input_definitions')->nullable()->after('default_inputs');
        });
    }

    public function down(): void
    {
        Schema::table('flows', function (Blueprint $table): void {
            $table->dropColumn('blueprint_input_definitions');
        });
    }
};
