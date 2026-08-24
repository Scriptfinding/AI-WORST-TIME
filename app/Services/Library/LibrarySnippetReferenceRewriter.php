<?php

namespace App\Services\Library;

use App\DTO\Library\LibrarySnippetItem;
use App\Enums\Authorization\Ability;
use App\Models\Snippet;
use App\Models\User;
use Illuminate\Validation\ValidationException;

final class LibrarySnippetReferenceRewriter
{
    /**
     * Maps accessible installed library snippet conventions to their IDs.
     * Optional filters limit results by namespace or convention.
     *
     * @param  array<int, string>|null  $namespaces
     * @param  array<int, string>|null  $conventions
     * @return array<string, string>
     */
    public function mapForWorkspace(
        string $workspaceId,
        User $actor,
        ?array $namespaces = null,
        ?array $conventions = null,
    ): array {
        if ($conventions === []) {
            return [];
        }

        $snippets = Snippet::query()
            ->where('workspace_id', $workspaceId)
            ->where('stale', false)
            ->where('is_active', true)
            ->when(
                $namespaces !== null,
                fn ($query) => $query->whereIn('library_namespace', $namespaces ?? []),
                fn ($query) => $query->whereNotNull('library_namespace'),
            )
            ->whereNotNull('library_reference')
            ->get()
            ->filter(fn (Snippet $snippet): bool => $actor->can(Ability::USE->value, $snippet));
        $map = [];

        foreach ($snippets as $snippet) {
            $convention = $this->convention(
                (string) $snippet->library_namespace,
                (string) $snippet->library_reference,
            );
            if ($conventions !== null && ! in_array($convention, $conventions, true)) {
                continue;
            }
            if (isset($map[$convention]) && $map[$convention] !== $snippet->id) {
                throw ValidationException::withMessages([
                    'library' => "Multiple snippets resolve to the library reference \"{$convention}\".",
                ]);
            }
            $map[$convention] = $snippet->id;
        }

        return $map;
    }

    /** @param array<string, string> $rewrites */
    public function code(string $code, array $rewrites): string
    {
        [$code] = $this->scanExecutableCalls($code, $rewrites);

        return $code;
    }

    /**
     * @param  array<string, mixed>|null  $graph
     * @param  array<string, string>  $rewrites
     * @return array<string, mixed>|null
     */
    public function graph(?array $graph, array $rewrites): ?array
    {
        if ($graph === null || $rewrites === []) {
            return $graph;
        }

        $rewritten = $this->rewriteGraphValue($graph, $rewrites);

        return is_array($rewritten) ? $rewritten : $graph;
    }

    /**
     * @param  iterable<LibrarySnippetItem>  $availableSnippets
     * @param  array<string, mixed>|null  $graph
     */
    public function assertKnownReferencesResolved(
        string $code,
        ?array $graph,
        iterable $availableSnippets,
    ): void {
        $references = $this->references($code, $graph);
        foreach ($availableSnippets as $snippet) {
            $convention = $this->convention($snippet->namespace ?: 'library', $snippet->reference);
            if (in_array($convention, $references, true)) {
                throw ValidationException::withMessages([
                    'library' => "Install the required snippet \"{$snippet->label}\" before updating this resource.",
                ]);
            }
        }
    }

    /**
     * @param  array<string, mixed>|null  $graph
     * @return list<string>
     */
    public function references(?string $code, ?array $graph): array
    {
        $references = $this->executableCalls($code ?? '');
        if ($graph !== null) {
            $this->collectGraphReferences($graph, $references);
        }

        return array_values(array_unique($references));
    }

    public function convention(string $namespace, string $reference): string
    {
        $base = preg_replace('/[^a-zA-Z0-9_]/', '_', $namespace.'_'.$reference) ?: 'library_snippet';

        return preg_match('/^[a-zA-Z_]/', $base) === 1 ? $base : '_'.$base;
    }

    /**
     * @param  array<string, string>  $rewrites
     */
    private function rewriteGraphValue(mixed $value, array $rewrites): mixed
    {
        if (is_string($value)) {
            foreach ($rewrites as $convention => $id) {
                if ($value === '$$'.$convention) {
                    return '$$'.$id;
                }
            }

            return $this->code($value, $rewrites);
        }

        if (! is_array($value)) {
            return $value;
        }

        foreach ($value as $key => $item) {
            $value[$key] = $this->rewriteGraphValue($item, $rewrites);
        }

        return $value;
    }

    /** @return list<string> */
    private function executableCalls(string $code): array
    {
        $scan = $this->scanExecutableCalls($code, []);

        return $scan[1];
    }

    /**
     * @param  array<string, string>  $rewrites
     * @return array{string, list<string>}
     */
    private function scanExecutableCalls(string $code, array $rewrites): array
    {
        $references = [];
        $output = '';
        $length = strlen($code);
        $state = 'code';
        $canStartRegex = true;
        $regexInCharacterClass = false;
        $callGapPattern = '(?:\s+|/\*.*?\*/|//[^\r\n]*(?:\r\n?|\n|$))*';
        $callPattern = '~^\$\$([a-zA-Z_$][a-zA-Z0-9_$]*)('
            .$callGapPattern.'(?:\?\.'.$callGapPattern.')?\()~s';
        /** @var list<'control'|'expression'> $parenContexts */
        $parenContexts = [];
        $pendingControlParen = false;
        /** @var list<int> $templateExpressionDepths */
        $templateExpressionDepths = [];

        for ($index = 0; $index < $length; $index++) {
            $char = $code[$index];
            $next = $index + 1 < $length ? $code[$index + 1] : '';

            if ($state === 'line-comment') {
                $output .= $char;
                if ($char === "\n") {
                    $state = 'code';
                }

                continue;
            }
            if ($state === 'block-comment') {
                $output .= $char;
                if ($char === '*' && $next === '/') {
                    $output .= $next;
                    $state = 'code';
                    $index++;
                }

                continue;
            }
            if ($state === 'single' || $state === 'double') {
                $output .= $char;
                if ($char === '\\') {
                    if ($next !== '') {
                        $output .= $next;
                        $index++;
                    }

                    continue;
                }
                if (($state === 'single' && $char === "'")
                    || ($state === 'double' && $char === '"')) {
                    $state = 'code';
                    $canStartRegex = false;
                }

                continue;
            }
            if ($state === 'regex') {
                $output .= $char;
                if ($char === '\\') {
                    if ($next !== '') {
                        $output .= $next;
                        $index++;
                    }

                    continue;
                }
                if ($char === '[') {
                    $regexInCharacterClass = true;
                } elseif ($char === ']') {
                    $regexInCharacterClass = false;
                } elseif ($char === '/' && ! $regexInCharacterClass) {
                    $state = 'code';
                    $canStartRegex = false;
                }

                continue;
            }
            if ($state === 'template') {
                $output .= $char;
                if ($char === '\\') {
                    if ($next !== '') {
                        $output .= $next;
                        $index++;
                    }

                    continue;
                }
                if ($char === '`') {
                    $state = 'code';
                    $canStartRegex = false;

                    continue;
                }
                if ($char === '$' && $next === '{') {
                    $output .= $next;
                    $templateExpressionDepths[] = 1;
                    $state = 'code';
                    $canStartRegex = true;
                    $index++;
                }

                continue;
            }

            if ($char === '/' && $next === '/') {
                $output .= $char.$next;
                $state = 'line-comment';
                $index++;

                continue;
            }
            if ($char === '/' && $next === '*') {
                $output .= $char.$next;
                $state = 'block-comment';
                $index++;

                continue;
            }
            if ($char === '/' && $canStartRegex) {
                $output .= $char;
                $state = 'regex';
                $regexInCharacterClass = false;
                $pendingControlParen = false;

                continue;
            }
            if ($char === "'" || $char === '"' || $char === '`') {
                $output .= $char;
                $state = $char === "'" ? 'single' : ($char === '"' ? 'double' : 'template');
                $pendingControlParen = false;

                continue;
            }
            if ($templateExpressionDepths !== [] && $char === '{') {
                $last = array_key_last($templateExpressionDepths);
                $templateExpressionDepths[$last]++;
                $output .= $char;
                $pendingControlParen = false;
                $canStartRegex = true;

                continue;
            }
            if ($templateExpressionDepths !== [] && $char === '}') {
                $last = array_key_last($templateExpressionDepths);
                $templateExpressionDepths[$last]--;
                $output .= $char;
                if ($templateExpressionDepths[$last] === 0) {
                    array_pop($templateExpressionDepths);
                    $state = 'template';
                } else {
                    $canStartRegex = false;
                }

                continue;
            }
            $remaining = substr($code, $index);
            if ($char === '$' && $next === '$' && preg_match($callPattern, $remaining, $matches) === 1) {
                $references[] = $matches[1];
                $output .= '$$'.($rewrites[$matches[1]] ?? $matches[1]).$matches[2];
                $index += strlen($matches[0]) - 1;
                $parenContexts[] = 'expression';
                $pendingControlParen = false;
                $canStartRegex = true;

                continue;
            }
            if (preg_match('/^[a-zA-Z_$]/', $char) === 1
                && preg_match('/^[a-zA-Z_$][a-zA-Z0-9_$]*/', $remaining, $tokenMatch) === 1) {
                $token = $tokenMatch[0];
                $output .= $token;
                $index += strlen($token) - 1;
                $pendingControlParen = in_array($token, ['catch', 'for', 'if', 'switch', 'while', 'with'], true);
                $canStartRegex = in_array($token, [
                    'await', 'break', 'case', 'continue', 'debugger', 'default',
                    'delete', 'do', 'else', 'extends', 'in', 'instanceof', 'new',
                    'of', 'return', 'throw', 'typeof', 'void', 'yield',
                ], true);

                continue;
            }
            if (($char === '+' && $next === '+') || ($char === '-' && $next === '-')) {
                $output .= $char.$next;
                $index++;
                $canStartRegex = false;

                continue;
            }
            if ($char === '(') {
                $output .= $char;
                $parenContexts[] = $pendingControlParen ? 'control' : 'expression';
                $pendingControlParen = false;
                $canStartRegex = true;

                continue;
            }
            if ($char === ')') {
                $output .= $char;
                $canStartRegex = array_pop($parenContexts) === 'control';
                $pendingControlParen = false;

                continue;
            }

            $output .= $char;
            if (! ctype_space($char)) {
                $pendingControlParen = false;
                $canStartRegex = ! preg_match('/[0-9\)\]\.]/', $char);
            }
        }

        return [$output, $references];
    }

    /**
     * @param  array<array-key, mixed>  $graph
     * @param  list<string>  $references
     */
    private function collectGraphReferences(array $graph, array &$references): void
    {
        foreach ($graph as $key => $value) {
            if (is_string($value)) {
                if ($key === 'name' && preg_match('/^\$\$([a-zA-Z_$][a-zA-Z0-9_$]*)$/', $value, $match) === 1) {
                    $references[] = $match[1];
                }
                array_push($references, ...$this->executableCalls($value));
            } elseif (is_array($value)) {
                $this->collectGraphReferences($value, $references);
            }
        }
    }
}
