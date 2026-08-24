<?php

namespace App\DTO\Mailbox;

use App\Enums\Mailbox\MailboxWatcherRuleField;
use App\Enums\Mailbox\MailboxWatcherRuleOperator;

final readonly class MailboxWatcherRuleData
{
    private function __construct(
        public int $ruleGroup,
        public MailboxWatcherRuleField $field,
        public MailboxWatcherRuleOperator $operator,
        public string $value,
    ) {}

    /** @param array<mixed, mixed> $validated */
    public static function fromValidated(array $validated): self
    {
        return new self(
            ruleGroup: self::requiredInt($validated['rule_group'] ?? null, 'rule_group'),
            field: MailboxWatcherRuleField::from(self::requiredString($validated['field'] ?? null, 'field')),
            operator: MailboxWatcherRuleOperator::from(self::requiredString($validated['operator'] ?? null, 'operator')),
            value: self::requiredString($validated['value'] ?? null, 'value'),
        );
    }

    /**
     * @return array{rule_group: int, field: string, operator: string, value: string}
     */
    public function persistenceAttributes(): array
    {
        return [
            'rule_group' => $this->ruleGroup,
            'field' => $this->field->value,
            'operator' => $this->operator->value,
            'value' => $this->value,
        ];
    }

    private static function requiredInt(mixed $value, string $key): int
    {
        if (! is_int($value)) {
            throw new \UnexpectedValueException("Validated {$key} must be an integer.");
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
}
