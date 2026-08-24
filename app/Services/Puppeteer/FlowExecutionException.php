<?php

namespace App\Services\Puppeteer;

final class FlowExecutionException extends \RuntimeException
{
    public function __construct(
        string $message,
        public readonly FlowExecutionResult $result,
        \Throwable $previous,
    ) {
        parent::__construct($message, (int) $previous->getCode(), $previous);
    }
}
