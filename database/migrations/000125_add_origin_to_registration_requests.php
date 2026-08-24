<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registration_requests', function (Blueprint $table): void {
            $table->string('origin', 32)->nullable()->after('email_verified_at');
        });

        DB::statement(<<<'SQL'
            UPDATE registration_requests
            SET origin = CASE
                WHEN password IS NOT NULL THEN 'password'
                ELSE 'email'
            END
            SQL);
        if (DB::getDriverName() === 'sqlite') {
            Schema::table('registration_requests', function (Blueprint $table): void {
                $table->enum('origin', ['password', 'email', 'sso'])->nullable(false)->change();
            });
        } else {
            DB::statement('ALTER TABLE registration_requests ALTER COLUMN origin SET NOT NULL');
            DB::statement(
                "ALTER TABLE registration_requests
                 ADD CONSTRAINT registration_requests_origin_check
                 CHECK (origin IN ('password', 'email', 'sso'))"
            );
        }

        Schema::table('registration_requests', function (Blueprint $table): void {
            $table->index('origin');
        });
    }

    public function down(): void
    {
        Schema::table('registration_requests', function (Blueprint $table): void {
            $table->dropIndex(['origin']);
        });
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE registration_requests DROP CONSTRAINT registration_requests_origin_check');
        }

        Schema::table('registration_requests', function (Blueprint $table): void {
            $table->dropColumn('origin');
        });
    }
};
