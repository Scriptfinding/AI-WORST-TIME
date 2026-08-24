<?php

namespace App\Services\Flow;

/**
 * Inserts `__nopRunLine(N);` markers before executable statements inside the
 * body of `run()` so the runtime can report line-by-line progress.
 *
 * A character-level scanner tracks strings, template literals (including
 * nested `${}`), and comments so that brace/paren counting is accurate and
 * markers are never injected inside multi-line expressions, string contents,
 * or brace-less control-flow bodies (which would corrupt the executed code).
 */
class RunProgressInstrumenter
{
    private bool $inBlockComment = false;

    /** @var list<string> stack of 'template' | 'interp' */
    private array $templateStack = [];

    public function instrument(?string $code): ?string
    {
        if ($code === null || $code === '') {
            return $code;
        }

        if (str_contains($code, '__nopRunLine(')) {
            return $code;
        }

        $lines = preg_split('/\R/', $code);
        if ($lines === false) {
            return $code;
        }

        $this->inBlockComment = false;
        $this->templateStack = [];

        $output = [];
        $inRun = false;
        $braceDepth = 0;
        $exprDepth = 0;
        $nestedFunctionDepth = null;
        $pendingControlHeader = false;
        $openExprIsControlHeader = false;
        $prevEndsWithOperator = false;

        foreach ($lines as $index => $line) {
            $startedInsideNonCode = $this->isInsideNonCode();
            $stripped = $this->stripNonCode($line);

            $opens = substr_count($stripped, '{');
            $closes = substr_count($stripped, '}');
            $parenDelta = substr_count($stripped, '(') - substr_count($stripped, ')')
                + substr_count($stripped, '[') - substr_count($stripped, ']');
            $exprDepthAfter = max(0, $exprDepth + $parenDelta);

            $startsRun = ! $inRun && preg_match('/\b(?:async\s+)?function\s+run\s*\(/', $stripped) === 1;
            $startsNestedFunction = ! $startsRun && $this->startsNestedFunctionBlock($stripped, $inRun, $braceDepth);
            $insideNestedFunction = $nestedFunctionDepth !== null && $braceDepth >= $nestedFunctionDepth;

            $markLine = $inRun
                && $braceDepth > 0
                && $exprDepth === 0
                && ! $startedInsideNonCode
                && ! $insideNestedFunction
                && ! $pendingControlHeader
                && ! $prevEndsWithOperator
                && ! $this->isContinuationLine($stripped)
                && $this->shouldMarkCodeLine($stripped);

            if ($markLine) {
                $output[] = $this->indent($line).'__nopRunLine('.($index + 1).');';
            }

            $output[] = $line;

            if ($startsRun) {
                $inRun = true;
            }

            if ($inRun && trim($stripped) !== '') {
                $prevEndsWithOperator = $this->endsWithOperator($stripped);
            }

            if ($inRun && ! $startedInsideNonCode && trim($stripped) !== '') {
                if ($exprDepth === 0 && $exprDepthAfter > 0) {
                    $openExprIsControlHeader = ! $startsRun
                        && preg_match('/\b(?:if|for|while)\s*\(/', $stripped) === 1;
                } elseif ($exprDepth > 0 && $exprDepthAfter === 0) {
                    // A multi-line expression just closed; if it was a control
                    // header without an opening brace, the next statement is its body.
                    $pendingControlHeader = $openExprIsControlHeader
                        && ! str_ends_with(rtrim($stripped), '{');
                    $openExprIsControlHeader = false;
                } elseif ($exprDepthAfter === 0) {
                    $pendingControlHeader = $this->endsWithBracelessControlHeader($stripped);
                }
            }

            if ($startsNestedFunction) {
                $functionDepth = $braceDepth + $opens - $closes;
                if ($functionDepth > $braceDepth) {
                    $nestedFunctionDepth = $functionDepth;
                }
            }

            if ($inRun) {
                $exprDepth = $exprDepthAfter;
                $braceDepth += $opens - $closes;

                if ($nestedFunctionDepth !== null && $braceDepth < $nestedFunctionDepth) {
                    $nestedFunctionDepth = null;
                }

                if ($braceDepth <= 0) {
                    if ($startsRun && $opens === 0) {
                        // `function run(` header whose `{` is on a later line.
                        $braceDepth = 0;
                    } else {
                        $inRun = false;
                        $braceDepth = 0;
                        $exprDepth = 0;
                        $nestedFunctionDepth = null;
                        $pendingControlHeader = false;
                        $openExprIsControlHeader = false;
                        $prevEndsWithOperator = false;
                    }
                }
            }
        }

        return implode("\n", $output);
    }

    private function isInsideNonCode(): bool
    {
        return $this->inBlockComment || $this->templateStack !== [];
    }

    /**
     * Replaces the contents of strings, template literals and comments with
     * spaces (delimiters removed too), carrying multi-line state across calls.
     */
    private function stripNonCode(string $line): string
    {
        $result = '';
        $length = strlen($line);
        $i = 0;
        $inLineComment = false;
        $stringDelimiter = null;

        while ($i < $length) {
            $char = $line[$i];
            $next = $i + 1 < $length ? $line[$i + 1] : '';

            if ($inLineComment) {
                $result .= ' ';
                $i++;

                continue;
            }

            if ($this->inBlockComment) {
                if ($char === '*' && $next === '/') {
                    $this->inBlockComment = false;
                    $result .= '  ';
                    $i += 2;

                    continue;
                }
                $result .= ' ';
                $i++;

                continue;
            }

            if ($stringDelimiter !== null) {
                if ($char === '\\') {
                    $result .= '  ';
                    $i += 2;

                    continue;
                }
                if ($char === $stringDelimiter) {
                    $stringDelimiter = null;
                }
                $result .= ' ';
                $i++;

                continue;
            }

            if ($this->templateStack !== [] && end($this->templateStack) === 'template') {
                if ($char === '\\') {
                    $result .= '  ';
                    $i += 2;

                    continue;
                }
                if ($char === '`') {
                    array_pop($this->templateStack);
                    $result .= ' ';
                    $i++;

                    continue;
                }
                if ($char === '$' && $next === '{') {
                    $this->templateStack[] = 'interp';
                    $result .= '  ';
                    $i += 2;

                    continue;
                }
                $result .= ' ';
                $i++;

                continue;
            }

            // Plain code (possibly inside a template interpolation).
            if ($char === '/' && $next === '/') {
                $inLineComment = true;
                $result .= '  ';
                $i += 2;

                continue;
            }
            if ($char === '/' && $next === '*') {
                $this->inBlockComment = true;
                $result .= '  ';
                $i += 2;

                continue;
            }
            if ($char === "'" || $char === '"') {
                $stringDelimiter = $char;
                $result .= ' ';
                $i++;

                continue;
            }
            if ($char === '`') {
                $this->templateStack[] = 'template';
                $result .= ' ';
                $i++;

                continue;
            }
            if ($char === '}' && $this->templateStack !== [] && end($this->templateStack) === 'interp') {
                array_pop($this->templateStack);
                $result .= ' ';
                $i++;

                continue;
            }

            $result .= $char;
            $i++;
        }

        return $result;
    }

    /**
     * A trailing binary/assignment operator means the next line continues the
     * same expression: a marker in between would become the right operand.
     */
    private function endsWithOperator(string $stripped): bool
    {
        $trimmed = rtrim($stripped);
        if ($trimmed === '') {
            return false;
        }

        return preg_match('/(?:&&|\|\||\?\?|[+\-*\/%^&|]|={1,3}|!==?|<=?|>=?|=>|\?|:|\.|,|\bin\b|\bof\b|\binstanceof\b|\btypeof\b|\bnew\b|\breturn\b|\bawait\b)$/', $trimmed) === 1;
    }

    /**
     * Lines that syntactically continue the previous expression must never be
     * preceded by a marker statement.
     */
    private function isContinuationLine(string $stripped): bool
    {
        $trimmed = trim($stripped);
        if ($trimmed === '') {
            return false;
        }

        return preg_match('/^(?:\.|\?|:|&&|\|\||[+\-*\/%]=?\s|=>|,|\)|\])/', $trimmed) === 1;
    }

    /**
     * Detects `if (...)`, `else`, `for (...)`, `while (...)`, `do` headers with
     * no `{`, whose body is the next statement: injecting a marker there would
     * hijack the control-flow body.
     */
    private function endsWithBracelessControlHeader(string $stripped): bool
    {
        $trimmed = rtrim($stripped);
        if ($trimmed === '' || str_ends_with($trimmed, '{') || str_ends_with($trimmed, ';') || str_ends_with($trimmed, '}')) {
            return false;
        }

        if (preg_match('/\b(?:if|for|while)\s*\([^()]*(?:\([^()]*\)[^()]*)*\)\s*$/', $trimmed) === 1) {
            return true;
        }

        return preg_match('/(?:^|\W)(?:else|do)\s*$/', $trimmed) === 1;
    }

    private function shouldMarkCodeLine(string $stripped): bool
    {
        $trimmed = trim($stripped);
        if ($trimmed === '' || str_starts_with($trimmed, '*')) {
            return false;
        }
        if (preg_match('/^(?:\}|\{|\)|\]|else\b|catch\b|finally\b|case\b|default\b)/', $trimmed) === 1) {
            return false;
        }

        return preg_match('/^(await|return|const|let|var|if|for|while|throw|try|switch|break|continue|delete|void)\b/', $trimmed) === 1
            || preg_match('/^[\w$.[\]]+\s*(?:=(?!=)|\+=|-=|\*=|\/=|\?\?=|\|\|=|&&=|\+\+|--)/', $trimmed) === 1
            || preg_match('/^(?:await\s+)?[\w$.[\]]+\s*\(/', $trimmed) === 1;
    }

    private function startsNestedFunctionBlock(string $stripped, bool $inRun, int $braceDepth): bool
    {
        if (! $inRun || $braceDepth <= 0 || ! str_contains($stripped, '{')) {
            return false;
        }
        if (preg_match('/\b(?:async\s+)?function\b/', $stripped) === 1) {
            return true;
        }

        return preg_match('/=>\s*\{/', $stripped) === 1;
    }

    private function indent(string $line): string
    {
        preg_match('/^\s*/', $line, $match);

        return $match[0] ?? '';
    }
}
