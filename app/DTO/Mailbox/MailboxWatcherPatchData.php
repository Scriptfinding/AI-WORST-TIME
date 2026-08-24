<?php

namespace App\DTO\Mailbox;

final readonly class MailboxWatcherPatchData
{
    /**
     * @param  list<string>  $presentFields
     * @param  list<MailboxWatcherRuleData>|null  $rules
     */
    private function __construct(
        private array $presentFields,
        public ?string $name,
        public ?string $mailboxId,
        public ?string $group,
        public ?bool $extractEnabled,
        public ?string $extractMode,
        public ?string $extractExpression,
        public ?bool $isActive,
        public ?int $timeout,
        public ?string $scope,
        public ?string $teamId,
        public ?string $userId,
        public ?array $rules,
    ) {}

    /** @param array<string, mixed> $validated */
    public static function fromValidated(array $validated): self
    {
        return new self(
            presentFields: array_keys($validated),
            name: self::nullableString($validated['name'] ?? null, 'name'),
            mailboxId: self::nullableString($validated['mailbox_id'] ?? null, 'mailbox_id'),
            group: self::nullableString($validated['group'] ?? null, 'group'),
            extractEnabled: self::nullableBool($validated['extract_enabled'] ?? null, 'extract_enabled'),
            extractMode: self::nullableString($validated['extract_mode'] ?? null, 'extract_mode'),
            extractExpression: self::nullableString($validated['extract_expression'] ?? null, 'extract_expression'),
            isActive: self::nullableBool($validated['is_active'] ?? null, 'is_active'),
            timeout: self::nullableInt($validated['timeout'] ?? null, 'timeout'),
            scope: self::nullableString($validated['scope'] ?? null, 'scope'),
            teamId: self::nullableString($validated['team_id'] ?? null, 'team_id'),
            userId: self::nullableString($validated['user_id'] ?? null, 'user_id'),
            rules: self::rules($validated['rules'] ?? null),
        );
    }

    public function has(string $field): bool
    {
        return in_array($field, $this->presentFields, true);
    }

    /** @return array<string, int|string|bool|null> */
    public function persistenceAttributes(): array
    {
        $attributes = [];
        $this->put($attributes, 'name', $this->name);
        $this->put($attributes, 'mailbox_id', $this->mailboxId);
        $this->put($attributes, 'group', $this->group);
        $this->put($attributes, 'extract_enabled', $this->extractEnabled);
        $this->put($attributes, 'extract_mode', $this->extractMode);
        $this->put($attributes, 'extract_expression', $this->extractExpression);
        $this->put($attributes, 'is_active', $this->isActive);
        $this->put($attributes, 'timeout', $this->timeout);
        $this->put($attributes, 'scope', $this->scope);
        $this->put($attributes, 'team_id', $this->teamId);

        return $attributes;
    }

    /** @return array{user_id?: string|null} */
    public function ownerData(): array
    {
        return $this->has('user_id') ? ['user_id' => $this->userId] : [];
    }

    /**
     * @param  array<string, int|string|bool|null>  $attributes
     */
    private function put(array &$attributes, string $key, int|string|bool|null $value): void
    {
        if ($this->has($key)) {
            $attributes[$key] = $value;
        }
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

    private static function nullableInt(mixed $value, string $key): ?int
    {
        if ($value !== null && ! is_int($value)) {
            throw new \UnexpectedValueException("Validated {$key} must be an integer or null.");
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

    private static function nullableBool(mixed $value, string $key): ?bool
    {
        if ($value !== null && ! is_bool($value)) {
            throw new \UnexpectedValueException("Validated {$key} must be a boolean or null.");
        }

        return $value;
    }
}
