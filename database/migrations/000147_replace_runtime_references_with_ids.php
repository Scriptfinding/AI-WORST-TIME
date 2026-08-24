<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Runtime references use immutable model ids, while name columns are free-form labels.
 * Name columns are non-unique, and snippets have no dedicated reference column.
 */
return new class extends Migration
{
    public function up(): void
    {
        $this->dropUniqueIfExists('user_variables', 'user_variables_workspace_key_unique');
        $this->dropUniqueIfExists('user_variables', 'user_variables_user_id_workspace_id_key_scope_unique');
        $this->dropUniqueIfExists('notification_channels', 'notification_channels_workspace_name_unique');
        $this->dropUniqueIfExists('notification_channels', 'notification_channels_workspace_id_name_scope_user_id_unique');
        $this->dropUniqueIfExists('ai_models', 'ai_models_workspace_name_unique');
        $this->dropIndexIfExists('ai_models', 'ai_models_workspace_id_name_scope_user_id_unique');
        $this->dropIndexIfExists('ai_models', 'ai_models_workspace_name_user_scope_unique');
        $this->dropIndexIfExists('ai_models', 'ai_models_workspace_name_team_scope_unique');
        $this->dropIndexIfExists('ai_models', 'ai_models_workspace_name_workspace_scope_unique');
        $this->dropUniqueIfExists('snippets', 'snippets_workspace_id_reference_unique');
        $this->dropUniqueIfExists('mailbox_watchers', 'mailbox_watchers_flow_id_name_unique');
        $this->dropUniqueIfExists('integrations', 'integrations_workspace_id_provider_name_unique');

        if (Schema::hasColumn('snippets', 'reference')) {
            Schema::table('snippets', function (Blueprint $table): void {
                $table->dropColumn('reference');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('snippets', 'reference')) {
            Schema::table('snippets', function (Blueprint $table): void {
                $table->string('reference')->nullable()->after('name');
            });
        }
    }

    private function dropUniqueIfExists(string $table, string $index): void
    {
        if (! Schema::hasTable($table) || ! $this->hasIndex($table, $index)) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) use ($index): void {
            $blueprint->dropUnique($index);
        });
    }

    private function dropIndexIfExists(string $table, string $index): void
    {
        if (! Schema::hasTable($table) || ! $this->hasIndex($table, $index)) {
            return;
        }

        DB::statement('DROP INDEX '.$index);
    }

    private function hasIndex(string $table, string $index): bool
    {
        return collect(Schema::getIndexes($table))->contains(
            fn (array $existing): bool => ($existing['name'] ?? null) === $index,
        );
    }
};
