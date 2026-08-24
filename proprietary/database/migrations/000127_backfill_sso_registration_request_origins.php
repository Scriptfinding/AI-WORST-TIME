<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
            UPDATE registration_requests
            SET origin = 'sso'
            WHERE EXISTS (
                SELECT 1
                FROM sso_registration_requests
                WHERE sso_registration_requests.registration_request_id = registration_requests.id
            )
            SQL);
    }

    public function down(): void
    {
        DB::statement(<<<'SQL'
            UPDATE registration_requests
            SET origin = CASE
                WHEN password IS NOT NULL THEN 'password'
                ELSE 'email'
            END
            WHERE origin = 'sso'
            SQL);
    }
};
