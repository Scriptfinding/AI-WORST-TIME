<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mailbox_emails', function (Blueprint $table) {
            $table->id();
            $table->string('mailbox_id', 32);
            $table->foreign('mailbox_id')->references('id')->on('mailboxes')->cascadeOnDelete();
            $table->string('message_id')->nullable();
            $table->string('from_address');
            $table->string('to_address');
            $table->string('subject')->nullable();
            $table->timestamp('date')->nullable();
            $table->jsonb('headers')->nullable();
            $table->text('text_body')->nullable();
            $table->text('html_body')->nullable();
            $table->unsignedBigInteger('raw_size')->default(0);
            $table->timestamp('received_at')->useCurrent();
            $table->boolean('is_read')->default(false);
            $table->timestamps();

            $table->index(['mailbox_id', 'received_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mailbox_emails');
    }
};
