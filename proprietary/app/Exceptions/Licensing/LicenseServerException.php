<?php

namespace App\Exceptions\Licensing;

use RuntimeException;

class LicenseServerException extends RuntimeException
{
    public function __construct(string $message, private readonly ?int $statusCode = null)
    {
        parent::__construct($message);
    }

    public function statusCode(): ?int
    {
        return $this->statusCode;
    }

    public function isRejection(): bool
    {
        return $this->statusCode !== null && $this->statusCode >= 400 && $this->statusCode < 500;
    }
}
