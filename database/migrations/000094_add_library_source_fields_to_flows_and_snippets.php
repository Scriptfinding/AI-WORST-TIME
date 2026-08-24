<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flows', function (Blueprint $table) {
            $table->unsignedBigInteger('library_external_id')->nullable()->after('source_type');
            $table->string('library_external_key')->nullable()->after('library_external_id');
            $table->string('library_namespace')->nullable()->after('library_external_key');
            $table->string('library_reference')->nullable()->after('library_namespace');
            $table->string('library_source_path')->nullable()->after('library_reference');
            $table->string('library_source_sha', 80)->nullable()->after('library_source_path');
            $table->string('library_source_url')->nullable()->after('library_source_sha');
            $table->timestamp('library_imported_at')->nullable()->after('library_source_url');
            $table->index(['library_namespace', 'library_reference']);
        });

        Schema::table('snippets', function (Blueprint $table) {
            $table->unsignedBigInteger('library_external_id')->nullable()->after('is_active');
            $table->string('library_external_key')->nullable()->after('library_external_id');
            $table->string('library_namespace')->nullable()->after('library_external_key');
            $table->string('library_reference')->nullable()->after('library_namespace');
            $table->string('library_source_path')->nullable()->after('library_reference');
            $table->string('library_source_sha', 80)->nullable()->after('library_source_path');
            $table->string('library_source_url')->nullable()->after('library_source_sha');
            $table->timestamp('library_imported_at')->nullable()->after('library_source_url');
            $table->index(['library_namespace', 'library_reference']);
        });
    }

    public function down(): void
    {
        Schema::table('snippets', function (Blueprint $table) {
            $table->dropIndex(['library_namespace', 'library_reference']);
            $table->dropColumn([
                'library_external_id',
                'library_external_key',
                'library_namespace',
                'library_reference',
                'library_source_path',
                'library_source_sha',
                'library_source_url',
                'library_imported_at',
            ]);
        });

        Schema::table('flows', function (Blueprint $table) {
            $table->dropIndex(['library_namespace', 'library_reference']);
            $table->dropColumn([
                'library_external_id',
                'library_external_key',
                'library_namespace',
                'library_reference',
                'library_source_path',
                'library_source_sha',
                'library_source_url',
                'library_imported_at',
            ]);
        });
    }
};
