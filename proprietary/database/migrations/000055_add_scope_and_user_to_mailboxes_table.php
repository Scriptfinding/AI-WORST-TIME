<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mailboxes', function (Blueprint $table) {
            $table->string('user_id', 32)->nullable()->after('workspace_id');
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->string('scope', 20)->default('workspace')->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('mailboxes', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id', 'scope']);
        });
    }
};
