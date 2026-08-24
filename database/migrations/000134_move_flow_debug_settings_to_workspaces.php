<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $depth = $this->globalSetting('debug_log_object_depth', 8, 0, 20);
        $arrayLimit = $this->globalSetting('debug_log_array_limit', 100, 1, 1000);

        Schema::table('workspaces', function (Blueprint $table) {
            $table->unsignedTinyInteger('debug_log_object_depth')->default(8);
            $table->unsignedSmallInteger('debug_log_array_limit')->default(100);
        });

        DB::table('workspaces')->update([
            'debug_log_object_depth' => $depth,
            'debug_log_array_limit' => $arrayLimit,
        ]);

        DB::table('settings')
            ->whereIn('key', ['debug_log_object_depth', 'debug_log_array_limit'])
            ->delete();
    }

    public function down(): void
    {
        $workspace = DB::table('workspaces')
            ->select(['debug_log_object_depth', 'debug_log_array_limit'])
            ->first();

        DB::table('settings')->updateOrInsert(
            ['key' => 'debug_log_object_depth'],
            ['value' => (string) ($workspace->debug_log_object_depth ?? 8)],
        );
        DB::table('settings')->updateOrInsert(
            ['key' => 'debug_log_array_limit'],
            ['value' => (string) ($workspace->debug_log_array_limit ?? 100)],
        );

        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropColumn(['debug_log_object_depth', 'debug_log_array_limit']);
        });
    }

    private function globalSetting(string $key, int $default, int $minimum, int $maximum): int
    {
        $value = DB::table('settings')->where('key', $key)->value('value');
        $integer = filter_var($value, FILTER_VALIDATE_INT);

        return is_int($integer) ? min($maximum, max($minimum, $integer)) : $default;
    }
};
