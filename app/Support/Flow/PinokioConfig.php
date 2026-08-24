<?php

namespace App\Support\Flow;

class PinokioConfig
{
    public readonly bool $enabled;

    public readonly string $host;

    public readonly string $port;

    public readonly string $token;

    public readonly bool $secure;

    public readonly bool $disableWebSecurity;

    public function __construct()
    {
        $this->enabled = (bool) config('services.pinokio.enabled', false);
        $host = config('services.pinokio.host', 'localhost');
        $port = config('services.pinokio.port', '3000');
        $token = config('services.pinokio.token', '');
        $this->host = is_string($host) ? $host : 'localhost';
        $this->port = is_string($port) ? $port : '3000';
        $this->token = is_string($token) ? $token : '';
        $this->secure = (bool) config('services.pinokio.secure', false);
        $this->disableWebSecurity = (bool) config('services.browser.disable_web_security', false);
    }

    /**
     * @return array{
     *     PINOKIO_ENABLED: string,
     *     PINOKIO_HOST: string,
     *     PINOKIO_PORT: string,
     *     PINOKIO_TOKEN: string,
     *     PINOKIO_SECURE: string,
     *     BROWSER_DISABLE_WEB_SECURITY: string
     * }
     */
    public function toEnv(): array
    {
        return [
            'PINOKIO_ENABLED' => $this->enabled ? 'true' : 'false',
            'PINOKIO_HOST' => $this->host,
            'PINOKIO_PORT' => $this->port,
            'PINOKIO_TOKEN' => $this->token,
            'PINOKIO_SECURE' => $this->secure ? 'true' : 'false',
            'BROWSER_DISABLE_WEB_SECURITY' => $this->disableWebSecurity ? 'true' : 'false',
        ];
    }
}
