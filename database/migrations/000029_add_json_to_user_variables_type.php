<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Type column is now a plain string (not enum) since the create migration.
        // This migration is kept for existing installs that already ran it.
    }

    public function down(): void
    {
        //
    }
};
