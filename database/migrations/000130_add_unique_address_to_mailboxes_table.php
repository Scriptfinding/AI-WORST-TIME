<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mailboxes', function (Blueprint $table) {
            $table->string('address', 355)->nullable()->after('slug');
        });

        DB::table('mailboxes')
            ->join('mailbox_domains', 'mailbox_domains.id', '=', 'mailboxes.domain_id')
            ->select('mailboxes.id', 'mailboxes.slug', 'mailbox_domains.name')
            ->orderBy('mailboxes.id')
            ->chunkById(500, function ($mailboxes): void {
                foreach ($mailboxes as $mailbox) {
                    DB::table('mailboxes')
                        ->where('id', $mailbox->id)
                        ->update([
                            'address' => mb_strtolower(trim($mailbox->slug).'@'.trim($mailbox->name)),
                        ]);
                }
            }, 'mailboxes.id', 'id');

        $duplicate = DB::table('mailboxes')
            ->select('address')
            ->groupBy('address')
            ->havingRaw('COUNT(*) > 1')
            ->value('address');

        if (is_string($duplicate)) {
            throw new \RuntimeException(
                "Duplicate mailbox address {$duplicate} must be resolved before this migration can continue.",
            );
        }

        Schema::table('mailboxes', function (Blueprint $table) {
            $table->string('address', 355)->nullable(false)->change();
            $table->unique('address');
        });
    }

    public function down(): void
    {
        Schema::table('mailboxes', function (Blueprint $table) {
            $table->dropUnique(['address']);
            $table->dropColumn('address');
        });
    }
};
