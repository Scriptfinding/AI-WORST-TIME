<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notification_channels', function (Blueprint $table) {
            $table->string('messenger_integration_id', 32)
                ->nullable()
                ->after('user_id');
            $table->foreign('messenger_integration_id')->references('id')->on('integrations')->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('notification_channels', 'messenger_integration_id')) {
            Schema::table('notification_channels', function (Blueprint $table) {
                $table->dropConstrainedForeignId('messenger_integration_id');
            });
        }
    }
};
