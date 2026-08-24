<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flows', function (Blueprint $table) {
            $table->timestamp('content_updated_at')->nullable()->after('updated_at');
        });

        DB::table('flows')->update([
            'content_updated_at' => DB::raw('updated_at'),
        ]);

        Schema::table('workspaces', function (Blueprint $table) {
            $table->string('lookup_key')->nullable()->unique()->after('slug');
            $table->unsignedInteger('default_flow_timeout_seconds')->default(0)->after('lookup_key');
            $table->unsignedInteger('max_flow_timeout_seconds')->default(0)->after('default_flow_timeout_seconds');
            $table->unsignedTinyInteger('max_retries_default')->default(0)->after('max_flow_timeout_seconds');
            $table->unsignedTinyInteger('max_retries_max')->default(0)->after('max_retries_default');
        });
    }

    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropUnique(['lookup_key']);
            $table->dropColumn([
                'lookup_key',
                'default_flow_timeout_seconds',
                'max_flow_timeout_seconds',
                'max_retries_default',
                'max_retries_max',
            ]);
        });

        Schema::table('flows', function (Blueprint $table) {
            $table->dropColumn('content_updated_at');
        });
    }
};
