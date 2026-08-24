<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            Schema::table('flow_runs', function (Blueprint $table): void {
                $table->enum('trigger_type', ['manual', 'webhook', 'schedule', 'api'])
                    ->default('manual')
                    ->change();
            });

            return;
        }

        DB::statement('ALTER TABLE flow_runs DROP CONSTRAINT flow_runs_trigger_type_check');
        DB::statement("ALTER TABLE flow_runs ADD CONSTRAINT flow_runs_trigger_type_check CHECK (trigger_type::text = ANY (ARRAY['manual', 'webhook', 'schedule', 'api']::text[]))");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            Schema::table('flow_runs', function (Blueprint $table): void {
                $table->enum('trigger_type', ['manual', 'webhook', 'schedule'])
                    ->default('manual')
                    ->change();
            });

            return;
        }

        DB::statement('ALTER TABLE flow_runs DROP CONSTRAINT flow_runs_trigger_type_check');
        DB::statement("ALTER TABLE flow_runs ADD CONSTRAINT flow_runs_trigger_type_check CHECK (trigger_type::text = ANY (ARRAY['manual', 'webhook', 'schedule']::text[]))");
    }
};
