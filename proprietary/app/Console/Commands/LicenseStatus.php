<?php

namespace App\Console\Commands;

use App\Services\Licensing\LicenseManager;
use Illuminate\Console\Command;

class LicenseStatus extends Command
{
    protected $signature = 'license:status';

    protected $description = 'Display the current cached license status';

    public function handle(LicenseManager $licenses): int
    {
        $status = $licenses->status();

        $this->line('Active: ' . ($status['active'] ? 'yes' : 'no'));
        foreach ([
            'Status' => 'status',
            'Plan' => 'plan',
            'Expires at' => 'expires_at',
            'Grace expires at' => 'grace_expires_at',
            'Next check at' => 'next_check_at',
        ] as $label => $key) {
            $value = $status[$key] ?? 'unknown';
            $this->line($label . ': ' . (is_scalar($value) ? (string) $value : 'unknown'));
        }

        return $status['active'] ? self::SUCCESS : self::FAILURE;
    }
}
