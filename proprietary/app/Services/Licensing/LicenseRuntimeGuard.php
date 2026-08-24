<?php

namespace App\Services\Licensing;

use App\Exceptions\Licensing\LicenseRuntimeLockedException;

class LicenseRuntimeGuard
{
    public function __construct(private readonly LicenseManager $licenses) {}

    public function ensure(string $context = 'runtime'): void
    {
        if ($this->licenses->ensureUsable()) {
            return;
        }

        throw new LicenseRuntimeLockedException("Puppetflow {$context} is locked until a valid license is activated.");
    }
}
