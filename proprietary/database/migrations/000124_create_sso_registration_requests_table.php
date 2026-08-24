<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sso_registration_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('registration_request_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('identity_provider_id')->constrained()->cascadeOnDelete();
            $table->text('external_subject');
            $table->char('external_subject_hash', 64);
            $table->string('username')->nullable();
            $table->timestamps();

            $table->unique(
                ['identity_provider_id', 'external_subject_hash'],
                'sso_registration_provider_subject_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sso_registration_requests');
    }
};
