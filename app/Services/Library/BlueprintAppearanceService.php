<?php

namespace App\Services\Library;

use App\DTO\Library\LibraryBlueprint;
use App\Models\Flow;
use App\Services\Flow\FlowIconService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

final class BlueprintAppearanceService
{
    private const COLORS = [
        'green' => '#16a34a',
        'blue' => '#2563eb',
        'cyan' => '#0891b2',
        'purple' => '#7c3aed',
        'pink' => '#db2777',
        'orange' => '#ea580c',
        'amber' => '#d97706',
        'slate' => '#475569',
        'white' => '#ffffff',
    ];

    public function __construct(private readonly FlowIconService $flowIcons) {}

    public function apply(Flow $flow, LibraryBlueprint $blueprint): void
    {
        $color = $this->resolveColor($blueprint->color);
        if ($blueprint->iconUrl === null) {
            $this->flowIcons->remove($flow);
            $flow->update([
                'cover_color' => $color,
                'icon_color' => $color,
            ]);

            return;
        }

        $flow->update([
            'cover_color' => $color,
            'icon_color' => $color,
        ]);

        $url = parse_url($blueprint->iconUrl);
        if (! is_array($url) || ! $this->isAllowedIconUrl($url, $blueprint)) {
            report(new \UnexpectedValueException('Blueprint icon URL uses an untrusted origin.'));

            return;
        }

        $temporaryPath = null;
        try {
            $response = Http::timeout(10)->get($this->iconFetchUrl($url, $blueprint->iconUrl));
            if (! $response->successful()) {
                throw new \RuntimeException("Unable to download blueprint icon ({$response->status()}).");
            }

            $contents = $response->body();
            if ($contents === '' || strlen($contents) > 2 * 1024 * 1024) {
                throw new \RuntimeException('Blueprint icon must be between 1 byte and 2 MB.');
            }

            $temporaryPath = tempnam(sys_get_temp_dir(), 'puppetflow-blueprint-icon-');
            if ($temporaryPath === false || file_put_contents($temporaryPath, $contents) === false) {
                throw new \RuntimeException('Unable to create the temporary blueprint icon.');
            }

            $filename = basename((string) ($url['path'] ?? 'icon.png')) ?: 'icon.png';
            $this->flowIcons->update(
                $flow,
                new UploadedFile($temporaryPath, $filename, null, UPLOAD_ERR_OK, true),
            );
        } catch (\Throwable $exception) {
            report($exception);
        } finally {
            if (is_string($temporaryPath) && is_file($temporaryPath)) {
                @unlink($temporaryPath);
            }
        }
    }

    private function resolveColor(string $color): string
    {
        $normalized = strtolower($color);

        if (preg_match('/^#[0-9a-f]{6}$/', $normalized) === 1) {
            return $normalized;
        }

        return self::COLORS[$normalized] ?? self::COLORS['green'];
    }

    /**
     * The public API can advertise an origin that is unreachable from a local
     * instance, so public icons are fetched through the configured catalog origin.
     *
     * @param  array<string, mixed>  $url
     */
    private function iconFetchUrl(array $url, string $iconUrl): string
    {
        if (strtolower($this->stringPart($url, 'host')) === 'raw.githubusercontent.com') {
            return $iconUrl;
        }

        $catalogUrl = config('puppetflow.blueprints_api_url');
        if (! is_string($catalogUrl)) {
            return $iconUrl;
        }
        $catalogOrigin = parse_url($catalogUrl);
        if (! is_array($catalogOrigin) || ! isset($catalogOrigin['scheme'], $catalogOrigin['host'])) {
            return $iconUrl;
        }

        return $catalogOrigin['scheme'].'://'.$catalogOrigin['host']
            .(isset($catalogOrigin['port']) ? ':'.$catalogOrigin['port'] : '')
            .$this->stringPart($url, 'path')
            .($this->stringPart($url, 'query') !== '' ? '?'.$this->stringPart($url, 'query') : '');
    }

    /** @param array<string, mixed> $url */
    private function isAllowedIconUrl(array $url, LibraryBlueprint $blueprint): bool
    {
        if (isset($url['user']) || isset($url['pass'])) {
            return false;
        }

        $scheme = strtolower($this->stringPart($url, 'scheme'));
        $host = strtolower($this->stringPart($url, 'host'));
        $port = $url['port'] ?? null;
        if ($scheme === 'https' && $host === 'raw.githubusercontent.com' && ($port === null || $port === 443)) {
            return true;
        }

        foreach ([
            config('puppetflow.blueprints_api_url'),
            $blueprint->sourceUrl,
        ] as $trustedUrl) {
            if (! is_string($trustedUrl)) {
                continue;
            }
            $trustedOrigin = parse_url($trustedUrl);
            if (
                is_array($trustedOrigin)
                && $scheme === strtolower($this->stringPart($trustedOrigin, 'scheme'))
                && $host === strtolower($this->stringPart($trustedOrigin, 'host'))
                && $port === ($trustedOrigin['port'] ?? null)
            ) {
                return true;
            }
        }

        return false;
    }

    /** @param array<string, mixed> $parts */
    private function stringPart(array $parts, string $key): string
    {
        $value = $parts[$key] ?? null;

        return is_string($value) ? $value : '';
    }
}
