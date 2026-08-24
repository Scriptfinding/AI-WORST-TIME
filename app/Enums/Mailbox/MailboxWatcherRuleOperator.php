<?php

namespace App\Enums\Mailbox;

enum MailboxWatcherRuleOperator: string
{
    case CONTAINS = 'contains';
    case NOT_CONTAINS = 'not_contains';
    case EQUALS = 'equals';
    case GREATER_THAN = 'greater_than';
    case LESS_THAN = 'less_than';
    case REGEX = 'regex';
}
