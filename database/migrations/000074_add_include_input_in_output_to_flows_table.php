<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flows', function (Blueprint $table) {
            $table->boolean('include_input_in_output')->default(false)->after('include_raw_output');
            $table->boolean('include_context_in_output')->default(true)->after('include_input_in_output');
        });
    }

    public function down(): void
    {
        Schema::table('flows', function (Blueprint $table) {
            $table->dropColumn(['include_input_in_output', 'include_context_in_output']);
        });
    }
};
