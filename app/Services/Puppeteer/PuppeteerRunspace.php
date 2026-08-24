<?php

namespace App\Services\Puppeteer;

final readonly class PuppeteerRunspace
{
    /**
     * @param  array<string, string>  $directories
     * @param  array<string, string>  $files
     * @param  array{dir: string}  $sandbox
     * @param  array<string, string>  $cookieJars
     */
    public function __construct(
        public array $directories,
        public array $files,
        public array $sandbox,
        public array $cookieJars,
    ) {}
}
