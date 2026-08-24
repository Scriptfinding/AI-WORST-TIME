<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mailbox_watchers', function (Blueprint $table) {
            $table->string('extract_mode', 20)->default('regex')->after('extract_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('mailbox_watchers', function (Blueprint $table) {
            $table->dropColumn('extract_mode');
        });
    }
};
