<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE UNIQUE INDEX users_email_lower_unique ON users (LOWER(email))');
        DB::statement(
            'CREATE UNIQUE INDEX workspace_invitations_workspace_email_lower_unique
             ON workspace_invitations (workspace_id, LOWER(email))'
        );

        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement(<<<'SQL'
            ALTER TABLE users
            ADD CONSTRAINT users_email_canonical_check
            CHECK (
                email = BTRIM(email, E' \t\n\r\v')
                AND email = normalize(email, NFC)
                AND email <> ''
                AND email !~ '[[:cntrl:]]'
            )
            SQL);
        DB::statement(<<<'SQL'
            ALTER TABLE workspace_invitations
            ADD CONSTRAINT workspace_invitations_email_canonical_check
            CHECK (
                email = BTRIM(email, E' \t\n\r\v')
                AND email = normalize(email, NFC)
                AND email <> ''
                AND email !~ '[[:cntrl:]]'
            )
            SQL);
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE workspace_invitations DROP CONSTRAINT workspace_invitations_email_canonical_check');
            DB::statement('ALTER TABLE users DROP CONSTRAINT users_email_canonical_check');
        }

        DB::statement('DROP INDEX workspace_invitations_workspace_email_lower_unique');
        DB::statement('DROP INDEX users_email_lower_unique');
    }
};
