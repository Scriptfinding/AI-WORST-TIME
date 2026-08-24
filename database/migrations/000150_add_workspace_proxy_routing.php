<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspace_proxies', function (Blueprint $table) {
            $table->id();
            $table->string('workspace_id', 32);
            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->string('user_id', 32)->nullable();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->string('team_id', 32)->nullable();
            $table->foreign('team_id')->references('id')->on('workspace_teams')->restrictOnDelete();
            $table->string('label');
            $table->string('visibility', 20)->default('owner');
            $table->string('group')->nullable();
            $table->string('scheme', 16);
            $table->string('host');
            $table->unsignedSmallInteger('port');
            $table->text('username')->nullable();
            $table->text('password')->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'label']);
            $table->index(['workspace_id', 'id']);
            $table->index(['workspace_id', 'visibility']);
            $table->index(['workspace_id', 'user_id']);
            $table->index(['workspace_id', 'team_id']);
        });

        Schema::table('flows', function (Blueprint $table) {
            $table->string('proxy_mode', 16)->default('none')->after('queue_index');
            $table->unsignedBigInteger('workspace_proxy_id')->nullable()->after('proxy_mode');
            $table->foreign('workspace_proxy_id')->references('id')->on('workspace_proxies')->restrictOnDelete();
        });

        Schema::table('flow_runs', function (Blueprint $table) {
            $table->text('proxy_snapshot')->nullable()->after('queue_index');
        });
    }

    public function down(): void
    {
        Schema::table('flow_runs', function (Blueprint $table) {
            $table->dropColumn('proxy_snapshot');
        });

        Schema::table('flows', function (Blueprint $table) {
            $table->dropForeign(['workspace_proxy_id']);
            $table->dropColumn(['workspace_proxy_id', 'proxy_mode']);
        });

        Schema::dropIfExists('workspace_proxies');
    }
};
