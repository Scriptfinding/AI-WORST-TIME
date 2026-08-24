<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('flows', 'include_context_in_output')) {
            return;
        }

        Schema::table('flows', function (Blueprint $table) {
            $table->boolean('include_context_in_output')->default(true)->after('include_input_in_output');
        });
    }

    public function down(): void
    {
        // The preceding migration owns and removes this column.
    }
};
