<?php

namespace App\Services\Flow;

use App\Models\Flow;
use App\Models\FlowRun;
use Illuminate\Support\Facades\Log;

class FlowManualRunScoringService
{
    public const RULESET_VERSION = 'manual-run-v1';

    public const ENTER_PRODUCTION_SCORE = 80;

    public const EXIT_PRODUCTION_SCORE = 55;

    private const MAX_RECENT_TRACES = 5;

    private const MAX_TRACE_ACTIONS = 64;

    private const IGNORED_ACTIONS = [
        'breakpoint',
        'legend',
        'log',
        'meta',
        'set',
    ];

    /**
     * Score a terminal manual run. The caller must hold the run transaction.
     *
     * @return array<string, mixed>|null
     */
    public function scoreTerminalRun(FlowRun $run): ?array
    {
        if ((string) $run->trigger_type !== 'manual') {
            return null;
        }

        $existingAudit = $run->manual_run_score_audit;
        if (is_array($existingAudit) && ($existingAudit['evaluated'] ?? false) === true) {
            return $existingAudit;
        }

        $flow = Flow::query()
            ->whereKey($run->flow_id)
            ->lockForUpdate()
            ->first();
        if (! $flow instanceof Flow) {
            throw new \RuntimeException('Cannot score a run whose flow no longer exists.');
        }

        $state = $this->normalizedState($flow->manual_run_score_state);
        $trace = $this->buildTrace($run);
        $recentTraces = $state['recent_traces'];
        $similarity = $this->bestSimilarity($trace, $recentTraces);
        $repetitionCount = $this->repetitionCount($trace['signature'], $recentTraces);
        $meaningfulChange = $this->hasMeaningfulBehaviorChange($trace, $recentTraces);
        [$delta, $reasons] = $this->scoreDelta(
            $run,
            $similarity,
            $repetitionCount,
            $recentTraces !== [],
            $meaningfulChange,
        );

        $scoreBefore = max(0, min(100, (int) $flow->manual_run_score));
        $scoreAfter = max(0, min(100, $scoreBefore + $delta));
        $productionModeBefore = (bool) $flow->manual_run_production_mode;
        $behaviorChanged = in_array('strong_behavior_novelty', $reasons, true)
            || in_array('behavior_novelty', $reasons, true);
        $productionModeAfter = $productionModeBefore && $behaviorChanged
            ? false
            : ($productionModeBefore
                ? $scoreAfter >= self::EXIT_PRODUCTION_SCORE
                : $scoreAfter >= self::ENTER_PRODUCTION_SCORE);

        if ($run->running_at !== null) {
            $recentTraces[] = $trace;
            $recentTraces = array_slice($recentTraces, -self::MAX_RECENT_TRACES);
        }
        $nextState = [
            'ruleset' => self::RULESET_VERSION,
            'recent_traces' => $recentTraces,
            'observed_runs' => $state['observed_runs'] + ($run->running_at !== null ? 1 : 0),
        ];

        $flow->forceFill([
            'manual_run_score' => $scoreAfter,
            'manual_run_production_mode' => $productionModeAfter,
            'manual_run_score_state' => $nextState,
            'manual_run_score_updated_at' => now(),
        ])->save();

        $audit = [
            ...(is_array($existingAudit) ? $existingAudit : []),
            'ruleset' => self::RULESET_VERSION,
            'score_before' => $scoreBefore,
            'score_after' => $scoreAfter,
            'delta' => $scoreAfter - $scoreBefore,
            'similarity' => round($similarity, 4),
            'repetition_count' => $repetitionCount,
            'trace_signature' => $trace['signature'],
            'trace_action_count' => count($trace['tokens']),
            'terminal_status' => (string) $run->status,
            'reasons' => $reasons,
            'production_mode_before' => $productionModeBefore,
            'production_mode_after' => $productionModeAfter,
            'evaluated' => true,
            'evaluated_at' => now()->toIso8601String(),
        ];

        $run->forceFill(['manual_run_score_audit' => $audit]);
        $encodedAudit = $run->getAttributes()['manual_run_score_audit'] ?? null;
        $run->newModelQuery()
            ->whereKey($run->getKey())
            ->update(['manual_run_score_audit' => $encodedAudit]);

        Log::debug('manual_run_score_evaluated', [
            'workspace_id' => $flow->workspace_id,
            'flow_id' => $flow->id,
            'run_id' => $run->id,
            'ruleset' => self::RULESET_VERSION,
            'score_before' => $scoreBefore,
            'score_after' => $scoreAfter,
            'delta' => $scoreAfter - $scoreBefore,
            'similarity' => round($similarity, 4),
            'repetition_count' => $repetitionCount,
            'reasons' => $reasons,
        ]);

        if ($productionModeBefore !== $productionModeAfter) {
            Log::info('manual_run_scoring_mode_changed', [
                'workspace_id' => $flow->workspace_id,
                'flow_id' => $flow->id,
                'run_id' => $run->id,
                'ruleset' => self::RULESET_VERSION,
                'score_before' => $scoreBefore,
                'score_after' => $scoreAfter,
                'production_mode_before' => $productionModeBefore,
                'production_mode_after' => $productionModeAfter,
                'reasons' => $reasons,
            ]);
        }

        return $audit;
    }

    /**
     * @return array{ruleset: string, recent_traces: list<array{signature: string, tokens: list<string>, code_fingerprint: string|null}>, observed_runs: int}
     */
    private function normalizedState(mixed $rawState): array
    {
        $state = is_array($rawState) ? $rawState : [];
        $rawTraces = is_array($state['recent_traces'] ?? null) ? $state['recent_traces'] : [];
        $recentTraces = [];

        foreach (array_slice($rawTraces, -self::MAX_RECENT_TRACES) as $rawTrace) {
            if (! is_array($rawTrace) || ! is_string($rawTrace['signature'] ?? null)) {
                continue;
            }

            $tokens = array_values(array_filter(
                is_array($rawTrace['tokens'] ?? null) ? $rawTrace['tokens'] : [],
                fn (mixed $token): bool => is_string($token),
            ));
            $recentTraces[] = [
                'signature' => $rawTrace['signature'],
                'tokens' => array_slice($tokens, 0, self::MAX_TRACE_ACTIONS),
                'code_fingerprint' => is_string($rawTrace['code_fingerprint'] ?? null)
                    ? $rawTrace['code_fingerprint']
                    : null,
            ];
        }

        return [
            'ruleset' => self::RULESET_VERSION,
            'recent_traces' => $recentTraces,
            'observed_runs' => max(0, (int) ($state['observed_runs'] ?? 0)),
        ];
    }

    /**
     * @return array{signature: string, tokens: list<string>, code_fingerprint: string|null}
     */
    private function buildTrace(FlowRun $run): array
    {
        $tokens = [];
        $actionLogs = $run->action_logs;

        if (is_array($actionLogs)) {
            foreach ($actionLogs as $entry) {
                if (! is_array($entry)) {
                    continue;
                }

                $rawAction = $entry['action'] ?? '';
                if (! is_scalar($rawAction)) {
                    continue;
                }
                $action = strtolower(trim((string) $rawAction));
                $action = preg_replace('/[^a-z0-9_-]/', '', $action) ?? '';
                if ($action === '' || in_array($action, self::IGNORED_ACTIONS, true)) {
                    continue;
                }

                $rawLabel = $entry['label'] ?? '';
                $label = $this->normalizeLabel(is_scalar($rawLabel) ? (string) $rawLabel : '');
                $labelHash = $label === '' ? '' : substr(hash_hmac('sha256', $label, $this->hmacKey()), 0, 16);
                $tokens[] = $action.($labelHash === '' ? '' : ':'.$labelHash);

                if (count($tokens) >= self::MAX_TRACE_ACTIONS) {
                    break;
                }
            }
        }

        $codeFingerprint = $this->codeFingerprint($run->getAttribute('code_snapshot'));
        $signaturePayload = $tokens !== [] ? $tokens : ['code:'.($codeFingerprint ?? 'empty')];

        return [
            'signature' => hash('sha256', json_encode($signaturePayload, JSON_UNESCAPED_SLASHES) ?: ''),
            'tokens' => $tokens,
            'code_fingerprint' => $codeFingerprint,
        ];
    }

    private function normalizeLabel(string $label): string
    {
        $label = strtolower(trim($label));
        $label = preg_replace('/\s+/', ' ', $label) ?? $label;

        return substr($label, 0, 500);
    }

    private function hmacKey(): string
    {
        $key = config('app.key');

        return is_string($key) && $key !== '' ? $key : 'puppetflow-manual-run-score';
    }

    private function codeFingerprint(mixed $code): ?string
    {
        if (! is_string($code) || trim($code) === '') {
            return null;
        }

        $normalized = preg_replace('/^\s*__nopRun(?:Line|NodeStart|NodeEnd)\(.*$/m', '', $code) ?? $code;
        $normalized = preg_replace('!/\*.*?\*/!s', '', $normalized) ?? $normalized;
        $normalized = preg_replace('/^\s*\/\/.*$/m', '', $normalized) ?? $normalized;
        $normalized = preg_replace('/\s+/', '', $normalized) ?? $normalized;

        return hash('sha256', $normalized);
    }

    /**
     * @param  array{signature: string, tokens: list<string>, code_fingerprint: string|null}  $trace
     * @param  list<array{signature: string, tokens: list<string>, code_fingerprint: string|null}>  $recentTraces
     */
    private function bestSimilarity(array $trace, array $recentTraces): float
    {
        if ($recentTraces === []) {
            return 0.0;
        }

        $best = 0.0;
        foreach ($recentTraces as $candidate) {
            $best = max($best, $this->traceSimilarity($trace, $candidate));
        }

        return $best;
    }

    /**
     * @param  array{signature: string, tokens: list<string>, code_fingerprint: string|null}  $left
     * @param  array{signature: string, tokens: list<string>, code_fingerprint: string|null}  $right
     */
    private function traceSimilarity(array $left, array $right): float
    {
        if ($left['tokens'] === [] || $right['tokens'] === []) {
            return $left['tokens'] === []
                && $right['tokens'] === []
                && $left['code_fingerprint'] !== null
                && hash_equals($left['code_fingerprint'], (string) $right['code_fingerprint'])
                    ? 1.0
                    : 0.0;
        }

        $leftActions = array_map(fn (string $token): string => explode(':', $token, 2)[0], $left['tokens']);
        $rightActions = array_map(fn (string $token): string => explode(':', $token, 2)[0], $right['tokens']);
        $actionSimilarity = $this->sequenceSimilarity($leftActions, $rightActions);
        $tokenSimilarity = $this->sequenceSimilarity($left['tokens'], $right['tokens']);
        $weightedSimilarity = (0.75 * $actionSimilarity) + (0.25 * $tokenSimilarity);

        return $actionSimilarity >= 0.95
            ? max(0.80, $weightedSimilarity)
            : $weightedSimilarity;
    }

    /**
     * @param  list<string>  $left
     * @param  list<string>  $right
     */
    private function sequenceSimilarity(array $left, array $right): float
    {
        $leftCount = count($left);
        $rightCount = count($right);
        if ($leftCount === 0 || $rightCount === 0) {
            return $leftCount === $rightCount ? 1.0 : 0.0;
        }

        $previous = array_fill(0, $rightCount + 1, 0);
        for ($leftIndex = 1; $leftIndex <= $leftCount; $leftIndex++) {
            $current = array_fill(0, $rightCount + 1, 0);
            for ($rightIndex = 1; $rightIndex <= $rightCount; $rightIndex++) {
                $current[$rightIndex] = $left[$leftIndex - 1] === $right[$rightIndex - 1]
                    ? $previous[$rightIndex - 1] + 1
                    : max($previous[$rightIndex], $current[$rightIndex - 1]);
            }
            $previous = $current;
        }

        return (2 * $previous[$rightCount]) / ($leftCount + $rightCount);
    }

    /**
     * @param  list<array{signature: string, tokens: list<string>, code_fingerprint: string|null}>  $recentTraces
     */
    private function repetitionCount(string $signature, array $recentTraces): int
    {
        $count = 1;
        foreach ($recentTraces as $trace) {
            if (hash_equals($trace['signature'], $signature)) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * @param  array{signature: string, tokens: list<string>, code_fingerprint: string|null}  $trace
     * @param  list<array{signature: string, tokens: list<string>, code_fingerprint: string|null}>  $recentTraces
     */
    private function hasMeaningfulBehaviorChange(array $trace, array $recentTraces): bool
    {
        if ($recentTraces === [] || $trace['code_fingerprint'] === null) {
            return false;
        }

        foreach ($recentTraces as $candidate) {
            if (
                $candidate['code_fingerprint'] !== null
                && hash_equals($candidate['code_fingerprint'], $trace['code_fingerprint'])
            ) {
                return false;
            }

            if ($candidate['tokens'] === $trace['tokens']) {
                return false;
            }
        }

        return true;
    }

    /**
     * @return array{0: int, 1: list<string>}
     */
    private function scoreDelta(
        FlowRun $run,
        float $similarity,
        int $repetitionCount,
        bool $hasHistory,
        bool $meaningfulChange,
    ): array {
        if ($run->running_at === null) {
            return [0, ['run_not_started']];
        }

        if (! $hasHistory) {
            return [0, ['first_observation']];
        }

        if ($meaningfulChange) {
            return [-15, ['strong_behavior_novelty']];
        }

        if ((string) $run->status === 'cancelled' && empty($run->action_logs)) {
            return [0, ['cancelled_without_trace']];
        }

        $delta = 0;
        $reasons = [];
        if ($similarity >= 0.95) {
            $delta += 6;
            $reasons[] = 'high_trace_similarity';
        } elseif ($similarity >= 0.80) {
            $delta += 3;
            $reasons[] = 'similar_trace';
        } elseif ($similarity < 0.40) {
            $delta -= 15;
            $reasons[] = 'strong_behavior_novelty';
        } elseif ($similarity < 0.60) {
            $delta -= 12;
            $reasons[] = 'behavior_novelty';
        } else {
            $reasons[] = 'mixed_behavior_change';
        }

        if ($similarity >= 0.95 && $repetitionCount >= 4) {
            $delta += min(2, $repetitionCount - 3);
            $reasons[] = 'repeated_signature';
        }

        if ((string) $run->status === 'success' && $similarity >= 0.80) {
            $delta++;
            $reasons[] = 'repeated_success';
        }

        return [max(-15, min(8, $delta)), $reasons];
    }
}
