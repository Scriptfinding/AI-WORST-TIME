<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('flows', 'queue_index')) {
            Schema::table('flows', function (Blueprint $table) {
                $table->unsignedInteger('queue_index')->nullable()->after('is_published');
            });
        }

        if (Schema::hasTable('jobs')) {
            DB::table('jobs')->where('queue', 'default')->update(['queue' => '1']);
            DB::table('jobs')->where('queue', 'urgent')->update([
                'queue' => max(1, config()->integer('puppetflow.queues_counter', 1)) >= 2 ? '2' : '1',
            ]);
        }

        if (Schema::hasColumn('flows', 'is_urgent')) {
            Schema::table('flows', function (Blueprint $table) {
                $table->dropColumn('is_urgent');
            });
        }

        if (Schema::hasColumn('workspaces', 'allow_urgent_flows')) {
            Schema::table('workspaces', function (Blueprint $table) {
                $table->dropColumn('allow_urgent_flows');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('flows', 'queue_index')) {
            Schema::table('flows', function (Blueprint $table) {
                $table->dropColumn('queue_index');
            });
        }
    }
};
