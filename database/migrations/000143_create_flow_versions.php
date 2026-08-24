<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flow_versions', function (Blueprint $table): void {
            $table->id();
            $table->string('flow_id', 32);
            $table->foreign('flow_id')->references('id')->on('flows')->cascadeOnDelete();
            $table->unsignedInteger('version');
            $table->longText('code')->nullable();
            $table->json('nodal_graph')->nullable();
            $table->string('flow_type')->default('code');
            $table->string('published_by', 32)->nullable();
            $table->foreign('published_by')->references('id')->on('users')->nullOnDelete();
            $table->timestamp('published_at');
            $table->timestamps();

            $table->unique(['flow_id', 'version']);
        });

        Schema::table('flows', function (Blueprint $table): void {
            $table->foreignId('published_version_id')
                ->nullable()
                ->after('is_published')
                ->constrained('flow_versions')
                ->nullOnDelete();
        });

        Schema::table('flow_runs', function (Blueprint $table): void {
            $table->foreignId('flow_version_id')
                ->nullable()
                ->after('flow_id')
                ->constrained('flow_versions')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('flow_runs', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('flow_version_id');
        });

        Schema::table('flows', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('published_version_id');
        });

        Schema::dropIfExists('flow_versions');
    }
};
