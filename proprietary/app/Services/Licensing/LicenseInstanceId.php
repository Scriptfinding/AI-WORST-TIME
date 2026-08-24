<?php

namespace App\Services\Licensing;

use App\Models\Setting;

/**
 * Installation identifier, generated randomly on first use and persisted.
 */
class LicenseInstanceId
{
    private const SETTING_KEY = 'license.instance_id';

    private ?string $resolved = null;

    public function get(): string
    {
        if ($this->resolved !== null) {
            return $this->resolved;
        }

        $existing = Setting::get(self::SETTING_KEY);
        if (is_string($existing) && $existing !== '') {
            return $this->resolved = $existing;
        }

        $generated = bin2hex(random_bytes(32));
        Setting::set(self::SETTING_KEY, $generated);

        return $this->resolved = $generated;
    }
}
