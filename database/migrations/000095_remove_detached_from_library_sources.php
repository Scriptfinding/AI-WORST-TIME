<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('flows', 'detached')) {
            DB::table('flows')
                ->where('detached', true)
                ->update([
                    'source_type' => 'code',
                    'library_external_id' => null,
                    'library_external_key' => null,
                    'library_namespace' => null,
                    'library_reference' => null,
                    'library_source_path' => null,
                    'library_source_sha' => null,
                    'library_source_url' => null,
                    'library_imported_at' => null,
                ]);

            Schema::table('flows', function (Blueprint $table) {
                $table->dropColumn('detached');
            });
        }

        if (Schema::hasColumn('snippets', 'detached')) {
            DB::table('snippets')
                ->where('detached', true)
                ->update([
                    'library_external_id' => null,
                    'library_external_key' => null,
                    'library_namespace' => null,
                    'library_reference' => null,
                    'library_source_path' => null,
                    'library_source_sha' => null,
                    'library_source_url' => null,
                    'library_imported_at' => null,
                ]);

            Schema::table('snippets', function (Blueprint $table) {
                $table->dropColumn('detached');
            });
        }
    }

    public function down(): void
    {
        //
    }
};
