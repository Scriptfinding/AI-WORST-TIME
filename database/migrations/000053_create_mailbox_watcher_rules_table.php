<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mailbox_watcher_rules', function (Blueprint $table) {
            $table->id();
            $table->string('mailbox_watcher_id', 32);
            $table->foreign('mailbox_watcher_id')->references('id')->on('mailbox_watchers')->cascadeOnDelete();
            $table->unsignedInteger('rule_group')->default(0);
            $table->string('field');
            $table->string('operator');
            $table->string('value');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mailbox_watcher_rules');
    }
};
