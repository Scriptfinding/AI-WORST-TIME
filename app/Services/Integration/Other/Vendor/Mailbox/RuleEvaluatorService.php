<?php

namespace App\Services\Integration\Other\Vendor\Mailbox;

use App\Enums\Mailbox\MailboxWatcherRuleField;
use App\Enums\Mailbox\MailboxWatcherRuleOperator;
use App\Models\MailboxEmail;
use App\Models\MailboxWatcherRule;
use Illuminate\Support\Collection;

class RuleEvaluatorService
{
    /**
     * Rules within the same rule_group are AND-ed.
     * Different rule_groups are OR-ed.
     * Empty rules = match all.
     *
     * @param  Collection<int, MailboxWatcherRule>  $rules
     */
    public function evaluate(Collection $rules, MailboxEmail $email): bool
    {
        if ($rules->isEmpty()) {
            return true;
        }

        $groups = $rules->groupBy('rule_group');

        foreach ($groups as $groupRules) {
            if ($this->evaluateGroup($groupRules, $email)) {
                return true;
            }
        }

        return false;
    }

    /** @param Collection<int, MailboxWatcherRule> $rules */
    private function evaluateGroup(Collection $rules, MailboxEmail $email): bool
    {
        foreach ($rules as $rule) {
            if (! $this->evaluateRule($rule, $email)) {
                return false;
            }
        }

        return true;
    }

    private function evaluateRule(MailboxWatcherRule $rule, MailboxEmail $email): bool
    {
        $field = $rule->field;
        $operator = $rule->operator;
        $value = $rule->value;

        switch ($field) {
            case MailboxWatcherRuleField::HAS_ATTACHMENTS:
                $has = ($email->raw_size ?? 0) > 0 && str_contains($email->html_body ?? '', 'attachment');
                $expected = strtolower($value) === 'true';

                return $has === $expected;

            case MailboxWatcherRuleField::SIZE:
                $size = $email->raw_size ?? 0;
                $threshold = (int) $value;

                return match ($operator) {
                    MailboxWatcherRuleOperator::GREATER_THAN => $size > $threshold,
                    MailboxWatcherRuleOperator::LESS_THAN => $size < $threshold,
                    default => false,
                };

            default:
                $fieldValue = $this->resolveFieldValue($field, $email);

                return $this->applyOperator($operator, $fieldValue, $value);
        }
    }

    private function resolveFieldValue(MailboxWatcherRuleField $field, MailboxEmail $email): string
    {
        return match ($field) {
            MailboxWatcherRuleField::SUBJECT => $email->subject ?? '',
            MailboxWatcherRuleField::FROM => $email->from_address ?? '',
            MailboxWatcherRuleField::TO => $email->to_address ?? '',
            MailboxWatcherRuleField::BODY => ($email->text_body ?: $email->html_body) ?? '',
            default => '',
        };
    }

    private function applyOperator(
        MailboxWatcherRuleOperator $operator,
        string $fieldValue,
        string $ruleValue,
    ): bool {
        return match ($operator) {
            MailboxWatcherRuleOperator::CONTAINS => str_contains(mb_strtolower($fieldValue), mb_strtolower($ruleValue)),
            MailboxWatcherRuleOperator::NOT_CONTAINS => ! str_contains(mb_strtolower($fieldValue), mb_strtolower($ruleValue)),
            MailboxWatcherRuleOperator::EQUALS => mb_strtolower($fieldValue) === mb_strtolower($ruleValue),
            MailboxWatcherRuleOperator::REGEX => (bool) @preg_match('/'.$ruleValue.'/u', $fieldValue),
            default => false,
        };
    }

    public function extractParsedValue(string $expression, MailboxEmail $email, string $mode = 'regex'): ?string
    {
        if ($mode === 'selector') {
            return $this->extractWithXPath($expression, $email);
        }

        $body = ($email->text_body ?: $email->html_body) ?? '';

        if (@preg_match('/'.$expression.'/u', $body, $matches)) {
            return $matches[1] ?? $matches[0] ?? null;
        }

        return null;
    }

    private function extractWithXPath(string $xpath, MailboxEmail $email): ?string
    {
        $html = $email->html_body ?? $email->text_body ?? '';
        if ($html === '') {
            return null;
        }

        libxml_use_internal_errors(true);
        $doc = new \DOMDocument;
        $doc->loadHTML('<?xml encoding="UTF-8">'.$html, LIBXML_NOERROR | LIBXML_NOWARNING);
        libxml_clear_errors();

        $xp = new \DOMXPath($doc);
        $nodes = @$xp->query($xpath);

        if ($nodes === false || $nodes->length === 0) {
            return null;
        }

        $node = $nodes->item(0);
        if ($node instanceof \DOMAttr) {
            return $node->value;
        }

        return $node instanceof \DOMNode ? $node->textContent : null;
    }
}
