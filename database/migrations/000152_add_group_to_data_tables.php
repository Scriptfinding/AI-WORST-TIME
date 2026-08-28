<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('data_tables', function (Blueprint $table) {
            $table->string('group', 100)->nullable()->after('description');
            $table->index(['workspace_id', 'group']);
        });
    }

    public function down(): void
    {
        Schema::table('data_tables', function (Blueprint $table) {
            $table->dropIndex(['workspace_id', 'group']);
            $table->dropColumn('group');
        });
    }
};
