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
                $table->enum('status', ['pending', 'running', 'success', 'error', 'cancelled'])
                    ->default('pending')
                    ->change();
            });

            return;
        }

        DB::statement('ALTER TABLE flow_runs DROP CONSTRAINT flow_runs_status_check');
        DB::statement("ALTER TABLE flow_runs ADD CONSTRAINT flow_runs_status_check CHECK (status::text = ANY (ARRAY['pending', 'running', 'success', 'error', 'cancelled']::text[]))");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            Schema::table('flow_runs', function (Blueprint $table): void {
                $table->enum('status', ['pending', 'running', 'success', 'error'])
                    ->default('pending')
                    ->change();
            });

            return;
        }

        DB::statement('ALTER TABLE flow_runs DROP CONSTRAINT flow_runs_status_check');
        DB::statement("ALTER TABLE flow_runs ADD CONSTRAINT flow_runs_status_check CHECK (status::text = ANY (ARRAY['pending', 'running', 'success', 'error']::text[]))");
    }
};
