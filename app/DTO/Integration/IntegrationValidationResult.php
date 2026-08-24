<?php

namespace App\DTO\Integration;

final readonly class IntegrationValidationResult
{
    private function __construct(
        public bool $valid,
        public ?string $error = null,
        public ?string $botName = null,
        public ?string $username = null,
    ) {}

    public static function success(?string $botName = null, ?string $username = null): self
    {
        return new self(true, botName: $botName, username: $username);
    }

    public static function failure(string $error): self
    {
        return new self(false, error: $error);
    }

    /** @return array{valid: bool, error?: string, bot_name?: string, username?: string} */
    public function toArray(): array
    {
        $result = ['valid' => $this->valid];

        if ($this->error !== null) {
            $result['error'] = $this->error;
        }
        if ($this->botName !== null) {
            $result['bot_name'] = $this->botName;
        }
        if ($this->username !== null) {
            $result['username'] = $this->username;
        }

        return $result;
    }
}
