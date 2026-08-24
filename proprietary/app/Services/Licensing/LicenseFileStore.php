<?php

namespace App\Services\Licensing;

use App\Models\Setting;
use Illuminate\Support\Facades\Crypt;

/**
 * Stores the signed license file content. The file itself is the
 * activation credential sent to the license server.
 */
class LicenseFileStore
{
    private const SETTING_KEY = 'license.file_content';

    public function get(): ?string
    {
        $encrypted = Setting::get(self::SETTING_KEY);
        if (! is_string($encrypted) || $encrypted === '') {
            return null;
        }

        try {
            return Crypt::decryptString($encrypted);
        } catch (\Throwable) {
            return null;
        }
    }

    public function set(string $content): void
    {
        Setting::set(self::SETTING_KEY, Crypt::encryptString(trim($content)));
    }

    public function forget(): void
    {
        Setting::set(self::SETTING_KEY, '');
    }

    public function has(): bool
    {
        return $this->get() !== null;
    }
}
