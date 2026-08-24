<?php

namespace App\Contracts;

interface BrandingProvider
{
    /**
     * @return array{name: string, logo_url: string, accent_color: string, customized: bool}
     */
    public function current(): array;
}
