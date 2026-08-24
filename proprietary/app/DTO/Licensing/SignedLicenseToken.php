<?php

namespace App\DTO\Licensing;

use RuntimeException;

final readonly class SignedLicenseToken
{
    private function __construct(
        public string $payload,
        public string $signature,
    ) {}

    /**
     * @param  array<string, mixed>  $value
     */
    public static function fromArray(array $value): self
    {
        $payload = $value['payload'] ?? null;
        $signature = $value['signature'] ?? null;

        if (! is_string($payload) || ! is_string($signature)) {
            throw new RuntimeException('Invalid signed license token.');
        }

        return new self($payload, $signature);
    }

    /**
     * @return array{payload: string, signature: string}
     */
    public function toArray(): array
    {
        return [
            'payload' => $this->payload,
            'signature' => $this->signature,
        ];
    }
}
