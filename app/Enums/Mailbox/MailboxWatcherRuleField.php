<?php

namespace App\Enums\Mailbox;

enum MailboxWatcherRuleField: string
{
    case BODY = 'body';
    case SUBJECT = 'subject';
    case TO = 'to';
    case FROM = 'from';
    case HAS_ATTACHMENTS = 'has_attachments';
    case SIZE = 'size';
}
