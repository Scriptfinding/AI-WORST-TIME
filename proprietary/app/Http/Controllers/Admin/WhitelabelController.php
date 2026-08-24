<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\Branding\DefaultBrandingProvider;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Storage\UploadStorage;
use App\Services\Whitelabel\WhitelabelBrandingProvider;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class WhitelabelController extends Controller
{
    public function __construct(private readonly UploadStorage $uploads) {}

    public function update(Request $request, FeatureFlagService $features): RedirectResponse
    {
        $features->abortIfDisabled('whitelabel_enabled');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'accent_color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);

        Setting::set(WhitelabelBrandingProvider::NAME_KEY, trim($validated['name']));
        Setting::set(WhitelabelBrandingProvider::ACCENT_COLOR_KEY, strtoupper($validated['accent_color']));

        return back()->with('success', 'Branding updated.');
    }

    public function uploadLogo(Request $request, FeatureFlagService $features): RedirectResponse
    {
        $features->abortIfDisabled('whitelabel_enabled');

        $validated = $request->validate([
            'logo' => ['required', 'file', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
        ]);

        $file = $validated['logo'];
        abort_unless($file instanceof UploadedFile, 422, 'A valid logo file is required.');
        $path = $this->uploads->storeRasterImage($file, 'branding');

        $this->deleteStoredLogo();
        Setting::set(WhitelabelBrandingProvider::LOGO_PATH_KEY, $path);

        return back()->with('success', 'Logo updated.');
    }

    public function destroyLogo(FeatureFlagService $features): RedirectResponse
    {
        $features->abortIfDisabled('whitelabel_enabled');
        $this->deleteStoredLogo();
        Setting::set(WhitelabelBrandingProvider::LOGO_PATH_KEY, null);

        return back()->with('success', 'Logo removed.');
    }

    public function reset(FeatureFlagService $features): RedirectResponse
    {
        $features->abortIfDisabled('whitelabel_enabled');
        $this->deleteStoredLogo();

        Setting::set(WhitelabelBrandingProvider::NAME_KEY, null);
        Setting::set(WhitelabelBrandingProvider::ACCENT_COLOR_KEY, DefaultBrandingProvider::DEFAULT_ACCENT_COLOR);
        Setting::set(WhitelabelBrandingProvider::LOGO_PATH_KEY, null);

        return back()->with('success', 'Branding reset to Puppetflow defaults.');
    }

    private function deleteStoredLogo(): void
    {
        $storedPath = Setting::get(WhitelabelBrandingProvider::LOGO_PATH_KEY, '');
        $path = is_string($storedPath) ? trim($storedPath) : '';

        if ($path !== '' && str_starts_with($path, 'branding/')) {
            if ($this->uploads->find($path) !== null) {
                $this->uploads->delete($path);

                return;
            }

            // Remove logos stored by versions predating durable upload storage.
            Storage::disk('public')->delete($path);
        }
    }
}
