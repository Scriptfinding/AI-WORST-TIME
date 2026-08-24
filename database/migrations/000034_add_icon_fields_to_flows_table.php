<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flows', function (Blueprint $table) {
            $table->string('icon_type', 10)->default('emoji')->after('name');
            $table->string('icon_value', 100)->nullable()->after('icon_type');
            $table->string('icon_color', 7)->nullable()->after('icon_value');
            $table->string('icon_upload_path')->nullable()->after('icon_color');
        });
    }

    public function down(): void
    {
        Schema::table('flows', function (Blueprint $table) {
            $table->dropColumn(['icon_type', 'icon_value', 'icon_color', 'icon_upload_path']);
        });
    }
};
