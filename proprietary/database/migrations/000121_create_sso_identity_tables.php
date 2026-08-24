<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('identity_providers', function (Blueprint $table): void {
            $table->id();
            $table->string('type', 16)->unique();
            $table->string('name');
            $table->text('config');
            $table->boolean('is_enabled')->default(false);
            $table->boolean('jit_enabled')->default(false);
            $table->timestamp('validated_at')->nullable();
            $table->timestamps();
        });

        Schema::create('user_external_identities', function (Blueprint $table): void {
            $table->id();
            $table->string('user_id', 32);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreignId('identity_provider_id')->constrained()->cascadeOnDelete();
            $table->text('external_subject');
            $table->char('external_subject_hash', 64);
            $table->string('email_snapshot')->nullable();
            $table->timestamps();

            $table->unique(
                ['identity_provider_id', 'external_subject_hash'],
                'external_identity_provider_subject_unique',
            );
            $table->unique(
                ['user_id', 'identity_provider_id'],
                'external_identity_user_provider_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_external_identities');
        Schema::dropIfExists('identity_providers');
    }
};
