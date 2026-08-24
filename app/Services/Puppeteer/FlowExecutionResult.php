<?php

namespace App\Services\Puppeteer;

final readonly class FlowExecutionResult
{
    /**
     * @param  array<array-key, mixed>  $output
     * @param  array<array-key, mixed>|null  $partialOutput
     * @param  array<array-key, mixed>|null  $internalOutput
     * @param  array<int, array{level: string, message: string, ts: string}>|null  $actionLogs
     * @param  list<array{message_id: int, claim_token: string}>  $mailboxClaims
     * @param  array<string, mixed>  $executionData
     */
    public function __construct(
        public array $output = [],
        public ?array $partialOutput = null,
        public ?array $internalOutput = null,
        public ?array $actionLogs = null,
        public array $mailboxClaims = [],
        public array $executionData = [],
    ) {}
}
