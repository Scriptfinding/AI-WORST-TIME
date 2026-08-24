<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mailbox_watchers', function (Blueprint $table) {
            $table->renameColumn('extract_regex', 'extract_expression');
        });
    }

    public function down(): void
    {
        Schema::table('mailbox_watchers', function (Blueprint $table) {
            $table->renameColumn('extract_expression', 'extract_regex');
        });
    }
};
