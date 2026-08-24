<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspace_invitations', function (Blueprint $table) {
            $table->string('registration_name')->nullable();
            $table->string('registration_password')->nullable();
            $table->timestamp('registration_submitted_at')->nullable();
            $table->timestamp('registration_email_verified_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('workspace_invitations', function (Blueprint $table) {
            $table->dropColumn([
                'registration_name',
                'registration_password',
                'registration_submitted_at',
                'registration_email_verified_at',
            ]);
        });
    }
};
