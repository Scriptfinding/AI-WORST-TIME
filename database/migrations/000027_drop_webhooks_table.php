<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('webhooks');
    }

    public function down(): void
    {
        Schema::create('webhooks', function (\Illuminate\Database\Schema\Blueprint $table) {
            $table->id();
            $table->string('flow_id', 32);
            $table->foreign('flow_id')->references('id')->on('flows')->cascadeOnDelete();
            $table->enum('direction', ['incoming', 'outgoing']);
            $table->string('url')->nullable();
            $table->string('secret')->nullable();
            $table->json('headers')->nullable();
            $table->string('token')->unique()->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('last_payload')->nullable();
            $table->timestamp('last_triggered_at')->nullable();
            $table->timestamps();
            $table->index(['flow_id', 'direction']);
            $table->index('token');
        });
    }
};
