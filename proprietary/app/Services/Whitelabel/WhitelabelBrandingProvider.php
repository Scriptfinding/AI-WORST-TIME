<?php

namespace App\Services\Whitelabel;

use App\Models\Setting;
use App\Services\Branding\DefaultBrandingProvider;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Storage\UploadStorage;
use Illuminate\Support\Facades\Storage;

class WhitelabelBrandingProvider extends DefaultBrandingProvider
{
    public const NAME_KEY = 'whitelabel_name';

    public const ACCENT_COLOR_KEY = 'whitelabel_accent_color';

    public const LOGO_PATH_KEY = 'whitelabel_logo_path';

    public function __construct(
        private readonly FeatureFlagService $features,
        private readonly UploadStorage $uploads,
    ) {}

    public function current(): array
    {
        $defaults = parent::current();

        if (! $this->features->enabled('whitelabel_enabled')) {
            return $defaults;
        }

        $storedName = Setting::get(self::NAME_KEY, '');
        $storedAccentColor = Setting::get(self::ACCENT_COLOR_KEY, '');
        $storedLogoPath = Setting::get(self::LOGO_PATH_KEY, '');
        $name = is_string($storedName) ? trim($storedName) : '';
        $accentColor = is_string($storedAccentColor) ? $storedAccentColor : '';
        $logoPath = is_string($storedLogoPath) ? trim($storedLogoPath) : '';

        if (! preg_match('/^#[0-9A-Fa-f]{6}$/', $accentColor)) {
            $accentColor = $defaults['accent_color'];
        }

        $logoUrl = $defaults['logo_url'];
        if ($logoPath !== '' && $this->uploads->exists($logoPath)) {
            $logoUrl = $this->uploads->url($logoPath);
        } elseif ($logoPath !== '' && Storage::disk('public')->exists($logoPath)) {
            // Keep logos stored by versions predating durable upload storage visible.
            $logoUrl = asset('storage/'.$logoPath);
        }

        return [
            'name' => $name !== '' ? $name : $defaults['name'],
            'logo_url' => $logoUrl,
            'accent_color' => strtoupper($accentColor),
            'customized' => $name !== ''
                || $accentColor !== $defaults['accent_color']
                || $logoUrl !== $defaults['logo_url'],
        ];
    }
}
