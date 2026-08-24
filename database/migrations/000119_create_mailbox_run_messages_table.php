<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        Schema::create('mailbox_run_messages', function (Blueprint $table) use ($driver) {
            $table->id();
            $table->foreignId('flow_run_id')->constrained('flow_runs')->cascadeOnDelete();
            $table->foreignId('mailbox_email_id')->nullable()->constrained('mailbox_emails')->nullOnDelete();
            $table->string('mailbox_watcher_id', 32)->nullable();
            $table->foreign('mailbox_watcher_id')->references('id')->on('mailbox_watchers')->nullOnDelete();
            $table->string('watcher_name');
            $table->jsonb('payload');
            if ($driver === 'sqlite') {
                $table->enum('status', ['pending', 'claimed', 'consumed', 'expired'])->default('pending');
            } else {
                $table->string('status', 16)->default('pending');
            }
            $table->unsignedInteger('attempts')->default(0);
            $table->string('claim_token_hash', 64)->nullable();
            $table->timestamp('claimed_at')->nullable();
            $table->timestamp('lease_expires_at')->nullable();
            $table->timestamp('consumed_at')->nullable();
            $table->timestamp('expires_at');
            $table->timestamp('expired_at')->nullable();
            $table->timestamp('payload_scrubbed_at')->nullable();
            $table->timestamps();

            $table->index(
                ['flow_run_id', 'watcher_name', 'status', 'created_at'],
                'mailbox_run_messages_claim_index',
            );
            $table->index(['status', 'lease_expires_at']);
            $table->index(
                ['flow_run_id', 'status', 'expires_at'],
                'mailbox_run_messages_expiry_index',
            );
            $table->index(
                ['status', 'consumed_at'],
                'mailbox_run_messages_consumed_retention_index',
            );
            $table->index(
                ['status', 'expired_at'],
                'mailbox_run_messages_expired_retention_index',
            );
            $table->index('mailbox_email_id');
            $table->index('mailbox_watcher_id');
            $table->unique(
                ['flow_run_id', 'mailbox_email_id', 'mailbox_watcher_id'],
                'mailbox_run_messages_delivery_unique',
            );
        });

        Schema::create('mailbox_run_watchers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flow_run_id')->constrained('flow_runs')->cascadeOnDelete();
            $table->string('mailbox_watcher_id', 32)->nullable();
            $table->foreign('mailbox_watcher_id')->references('id')->on('mailbox_watchers')->nullOnDelete();
            $table->string('mailbox_id', 32)->nullable();
            $table->foreign('mailbox_id')->references('id')->on('mailboxes')->nullOnDelete();
            $table->string('watcher_name');
            $table->timestamp('authorized_at');
            $table->timestamps();

            $table->unique(['flow_run_id', 'watcher_name'], 'mailbox_run_watchers_run_name_unique');
            $table->index(['mailbox_watcher_id', 'flow_run_id']);
        });

        Schema::table('mailbox_emails', function (Blueprint $table) use ($driver) {
            $table->string('ingestion_key', 64)->nullable()->after('mailbox_id');
            if ($driver === 'sqlite') {
                $table->enum('sender_authentication', ['unverified'])->default('unverified')->after('from_address');
                $table->enum('delivery_status', ['pending', 'awaiting_run', 'delivered', 'unmatched', 'failed'])
                    ->default('unmatched')
                    ->after('is_read');
            } else {
                $table->string('sender_authentication', 16)->default('unverified')->after('from_address');
                $table->string('delivery_status', 16)->default('unmatched')->after('is_read');
            }
            $table->unsignedInteger('delivery_attempts')->default(0)->after('delivery_status');
            $table->text('delivery_last_error')->nullable()->after('delivery_attempts');
            $table->timestamp('delivery_attempted_at')->nullable()->after('delivery_last_error');
            $table->timestamp('delivered_at')->nullable()->after('delivery_attempted_at');
            $table->timestamp('delivery_deadline_at')->nullable()->after('delivered_at');
            $table->timestamp('payload_scrubbed_at')->nullable()->after('delivery_deadline_at');

            $table->unique(
                ['mailbox_id', 'ingestion_key'],
                'mailbox_emails_ingestion_unique',
            );
            $table->index(
                ['delivery_status', 'delivery_attempted_at'],
                'mailbox_emails_delivery_retry_index',
            );
            $table->index(
                ['payload_scrubbed_at', 'received_at'],
                'mailbox_emails_payload_retention_index',
            );
        });

        if ($driver === 'pgsql') {
            DB::statement(
                "ALTER TABLE mailbox_run_messages
                 ADD CONSTRAINT mailbox_run_messages_status_check
                 CHECK (status IN ('pending', 'claimed', 'consumed', 'expired'))"
            );
            DB::statement(
                "ALTER TABLE mailbox_emails
                 ADD CONSTRAINT mailbox_emails_delivery_status_check
                 CHECK (delivery_status IN ('pending', 'awaiting_run', 'delivered', 'unmatched', 'failed'))"
            );
            DB::statement(
                "ALTER TABLE mailbox_emails
                 ADD CONSTRAINT mailbox_emails_sender_authentication_check
                 CHECK (sender_authentication IN ('unverified'))"
            );
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE mailbox_emails DROP CONSTRAINT mailbox_emails_sender_authentication_check');
            DB::statement('ALTER TABLE mailbox_emails DROP CONSTRAINT mailbox_emails_delivery_status_check');
            DB::statement('ALTER TABLE mailbox_run_messages DROP CONSTRAINT mailbox_run_messages_status_check');
        }

        Schema::table('mailbox_emails', function (Blueprint $table) {
            $table->dropUnique('mailbox_emails_ingestion_unique');
            $table->dropIndex('mailbox_emails_delivery_retry_index');
            $table->dropIndex('mailbox_emails_payload_retention_index');
            $table->dropColumn([
                'ingestion_key',
                'sender_authentication',
                'delivery_status',
                'delivery_attempts',
                'delivery_last_error',
                'delivery_attempted_at',
                'delivered_at',
                'delivery_deadline_at',
                'payload_scrubbed_at',
            ]);
        });

        Schema::dropIfExists('mailbox_run_watchers');
        Schema::dropIfExists('mailbox_run_messages');
    }
};
