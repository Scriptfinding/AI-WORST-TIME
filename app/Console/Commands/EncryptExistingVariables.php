<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class EncryptExistingVariables extends Command
{
    protected $signature = 'variables:encrypt {--dry-run : Show what would be encrypted without changing data}';
    protected $description = 'Encrypt existing unencrypted variable values in the database';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $rows = DB::table('user_variables')->select('id', 'key', 'value')->get();

        $encrypted = 0;
        $skipped = 0;

        foreach ($rows as $row) {
            if ($row->value === null || $row->value === '') {
                $skipped++;
                continue;
            }

            if ($this->isAlreadyEncrypted($row->value)) {
                $skipped++;
                continue;
            }

            if ($dryRun) {
                $this->line("Would encrypt: [{$row->id}] {$row->key}");
                $encrypted++;
                continue;
            }

            DB::table('user_variables')
                ->where('id', $row->id)
                ->update(['value' => Crypt::encryptString($row->value)]);

            $encrypted++;
        }

        $label = $dryRun ? 'Would encrypt' : 'Encrypted';
        $this->info("{$label}: {$encrypted} variable(s). Skipped: {$skipped}.");

        return self::SUCCESS;
    }

    private function isAlreadyEncrypted(string $value): bool
    {
        try {
            Crypt::decryptString($value);
            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}
