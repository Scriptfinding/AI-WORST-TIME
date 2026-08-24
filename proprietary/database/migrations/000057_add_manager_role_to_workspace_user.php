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
            Schema::table('user_workspace', function (Blueprint $table): void {
                $table->enum('role', ['admin', 'manager', 'member'])
                    ->default('member')
                    ->change();
            });

            return;
        }

        DB::statement('ALTER TABLE user_workspace DROP CONSTRAINT IF EXISTS user_workspace_role_check');
        DB::statement("ALTER TABLE user_workspace ADD CONSTRAINT user_workspace_role_check CHECK (role::text = ANY (ARRAY['admin', 'manager', 'member']::text[]))");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            Schema::table('user_workspace', function (Blueprint $table): void {
                $table->enum('role', ['admin', 'member'])
                    ->default('member')
                    ->change();
            });

            return;
        }

        DB::statement('ALTER TABLE user_workspace DROP CONSTRAINT IF EXISTS user_workspace_role_check');
        DB::statement("ALTER TABLE user_workspace ADD CONSTRAINT user_workspace_role_check CHECK (role::text = ANY (ARRAY['admin', 'member']::text[]))");
    }
};
