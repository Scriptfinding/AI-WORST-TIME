<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mailboxes', function (Blueprint $table) {
            $table->string('group', 100)->nullable()->after('slug');
        });

        Schema::table('flow_triggers', function (Blueprint $table) {
            $table->string('group', 100)->nullable()->after('label');
        });

        Schema::table('flow_actions', function (Blueprint $table) {
            $table->string('group', 100)->nullable()->after('label');
        });
    }

    public function down(): void
    {
        Schema::table('mailboxes', function (Blueprint $table) {
            $table->dropColumn('group');
        });

        Schema::table('flow_triggers', function (Blueprint $table) {
            $table->dropColumn('group');
        });

        Schema::table('flow_actions', function (Blueprint $table) {
            $table->dropColumn('group');
        });
    }
};
