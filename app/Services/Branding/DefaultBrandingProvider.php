<?php

namespace App\Services\Branding;

use App\Contracts\BrandingProvider;

class DefaultBrandingProvider implements BrandingProvider
{
    public const DEFAULT_ACCENT_COLOR = '#48C591';

    public const DEFAULT_LOGO_URL = '/img/logo/logo.png';

    public function current(): array
    {
        $name = config('app.name', 'Puppetflow');

        return [
            'name' => is_scalar($name) || is_resource($name) || $name === null
                ? strval($name)
                : 'Puppetflow',
            'logo_url' => self::DEFAULT_LOGO_URL,
            'accent_color' => self::DEFAULT_ACCENT_COLOR,
            'customized' => false,
        ];
    }
}
