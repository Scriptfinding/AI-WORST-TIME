<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mailbox_watchers', function (Blueprint $table) {
            $table->unsignedInteger('timeout')->nullable()->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('mailbox_watchers', function (Blueprint $table) {
            $table->dropColumn('timeout');
        });
    }
};
