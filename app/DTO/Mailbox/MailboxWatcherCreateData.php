<?php

namespace App\DTO\Mailbox;

final readonly class MailboxWatcherCreateData
{
    /**
     * @param  list<MailboxWatcherRuleData>|null  $rules
     */
    private function __construct(
        public string $name,
        public string $mailboxId,
        public ?string $group,
        public bool $extractEnabled,
        public string $extractMode,
        public ?string $extractExpression,
        public bool $isActive,
        public ?int $timeout,
        public string $scope,
        public ?string $teamId,
        public bool $hasRules,
        public ?array $rules,
    ) {}

    /** @param array<string, mixed> $validated */
    public static function fromValidated(array $validated): self
    {
        return new self(
            name: self::requiredString($validated['name'] ?? null, 'name'),
            mailboxId: self::requiredString($validated['mailbox_id'] ?? null, 'mailbox_id'),
            group: self::nullableString($validated['group'] ?? null, 'group'),
            extractEnabled: self::optionalBool($validated, 'extract_enabled', false),
            extractMode: self::optionalString($validated, 'extract_mode', 'regex'),
            extractExpression: self::nullableString($validated['extract_expression'] ?? null, 'extract_expression'),
            isActive: self::optionalBool($validated, 'is_active', true),
            timeout: self::nullableInt($validated['timeout'] ?? null, 'timeout'),
            scope: self::optionalString($validated, 'scope', 'owner'),
            teamId: self::nullableString($validated['team_id'] ?? null, 'team_id'),
            hasRules: array_key_exists('rules', $validated),
            rules: self::rules($validated['rules'] ?? null),
        );
    }

    /** @return array<string, int|string|bool|null> */
    public function persistenceAttributes(string $ownerId, ?string $teamId): array
    {
        return [
            'user_id' => $ownerId,
            'name' => $this->name,
            'group' => $this->group,
            'mailbox_id' => $this->mailboxId,
            'extract_enabled' => $this->extractEnabled,
            'extract_mode' => $this->extractMode,
            'extract_expression' => $this->extractExpression,
            'is_active' => $this->isActive,
            'timeout' => $this->timeout,
            'scope' => $this->scope,
            'team_id' => $teamId,
        ];
    }

    /**
     * @return list<MailboxWatcherRuleData>|null
     */
    private static function rules(mixed $value): ?array
    {
        if ($value === null) {
            return null;
        }
        if (! is_array($value)) {
            throw new \UnexpectedValueException('Validated rules must be an array or null.');
        }

        $rules = [];
        foreach ($value as $rule) {
            if (! is_array($rule)) {
                throw new \UnexpectedValueException('Each validated rule must be an array.');
            }
            $rules[] = MailboxWatcherRuleData::fromValidated($rule);
        }

        return $rules;
    }

    /** @param array<string, mixed> $values */
    private static function optionalBool(array $values, string $key, bool $default): bool
    {
        $value = $values[$key] ?? $default;
        if (! is_bool($value)) {
            throw new \UnexpectedValueException("Validated {$key} must be a boolean.");
        }

        return $value;
    }

    /** @param array<string, mixed> $values */
    private static function optionalString(array $values, string $key, string $default): string
    {
        $value = $values[$key] ?? $default;

        return self::requiredString($value, $key);
    }

    private static function nullableInt(mixed $value, string $key): ?int
    {
        if ($value !== null && ! is_int($value)) {
            throw new \UnexpectedValueException("Validated {$key} must be an integer or null.");
        }

        return $value;
    }

    private static function requiredString(mixed $value, string $key): string
    {
        if (! is_string($value)) {
            throw new \UnexpectedValueException("Validated {$key} must be a string.");
        }

        return $value;
    }

    private static function nullableString(mixed $value, string $key): ?string
    {
        if ($value !== null && ! is_string($value)) {
            throw new \UnexpectedValueException("Validated {$key} must be a string or null.");
        }

        return $value;
    }
}
