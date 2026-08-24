<?php

/*
 * Explicit proprietary scope: the paid replay recording persistence and artifact exposure in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Models;

use App\Casts\SafeEncrypted;
use App\Services\Mailbox\MailboxRunQueueService;
use App\Services\Runtime\RunnerSignalService;
use App\Services\Storage\RunArtifactPathResolver;
use App\Services\Storage\RunArtifactQueryService;
use App\Services\Storage\StoragePathSharder;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property bool $has_recording
 * @property int|null $queue_index
 * @property array<string, mixed>|null $proxy_snapshot
 * @property \Illuminate\Support\Carbon|null $running_at
 * @property \Illuminate\Support\Carbon|null $cancellation_requested_at
 * @property string|null $legend
 * @property bool $is_production
 * @property array<string, mixed>|null $manual_run_score_audit
 */
class FlowRun extends Model
{
    public const REDACTION_UNAVAILABLE = '[REDACTION UNAVAILABLE]';

    private const REDACTED_ATTRIBUTES = [
        'input',
        'output',
        'console_logs',
        'action_logs',
        'code_snapshot',
        'error_message',
        'legend',
        'meta',
        'internal_meta',
        'webhook_info',
        'action_results',
    ];

    protected $hidden = [
        'resolved_secrets',
        'console_logs',
        'action_logs',
        'code_snapshot',
        'internal_meta',
        'triggeredBy',
        'runtime_wait_id',
        'runtime_validation_message',
        'runtime_waiting_at',
        'runtime_continue_requested_at',
        'runtime_consumed_wait_id',
        'runtime_consumed_at',
        'is_production',
        'manual_run_score_audit',
        'proxy_snapshot',
    ];

    protected $appends = ['triggered_by_user'];

    protected $fillable = [
        'flow_id',
        'flow_version_id',
        'triggered_by',
        'trigger_id',
        'trigger_type',
        'status',
        'input',
        'output',
        'error_message',
        'console_logs',
        'action_logs',
        'code_snapshot',
        'duration_ms',
        'screenshots_count',
        'downloads_count',
        'has_recording',
        'legend',
        'meta',
        'internal_meta',
        'webhook_info',
        'action_results',
        'running_at',
        'cancellation_requested_at',
        'resolved_secrets',
        'runtime_wait_id',
        'runtime_validation_message',
        'runtime_waiting_at',
        'runtime_continue_requested_at',
        'runtime_consumed_wait_id',
        'runtime_consumed_at',
        'is_production',
        'manual_run_score_audit',
        'proxy_snapshot',
    ];

    protected static function booted(): void
    {
        static::updated(function (FlowRun $run): void {
            if (
                $run->wasChanged('status')
                && ! in_array($run->getAttribute('status'), ['pending', 'running'], true)
            ) {
                app(MailboxRunQueueService::class)->expireActive($run);
                app(RunnerSignalService::class)->expireWaiting($run);
            }
        });
    }

    protected function casts(): array
    {
        return [
            'running_at' => 'datetime',
            'cancellation_requested_at' => 'datetime',
            'runtime_waiting_at' => 'datetime',
            'runtime_continue_requested_at' => 'datetime',
            'runtime_consumed_at' => 'datetime',
            'is_production' => 'boolean',
            'manual_run_score_audit' => 'array',
            'input' => 'array',
            'output' => 'array',
            'console_logs' => 'array',
            'action_logs' => 'array',
            'has_recording' => 'boolean',
            'queue_index' => 'integer',
            'proxy_snapshot' => SafeEncrypted::class.':true,true',
            'meta' => 'array',
            'internal_meta' => 'array',
            'webhook_info' => 'array',
            'action_results' => 'array',
            'resolved_secrets' => SafeEncrypted::class.':true,true',
        ];
    }

    /**
     * @param  array<array-key, mixed>|string|null  $value
     * @return array<array-key, mixed>|null
     */
    public function getOutputAttribute(array|string|null $value): ?array
    {
        return $this->stripInternalFields($this->decodeJsonAttribute($value));
    }

    /**
     * @param  array<array-key, mixed>|string|null  $value
     * @return array<array-key, mixed>|null
     */
    public function getInputAttribute(array|string|null $value): ?array
    {
        return $this->stripInternalFields($this->decodeJsonAttribute($value));
    }

    /**
     * @param  array<array-key, mixed>|string|null  $value
     * @return array<array-key, mixed>|null
     */
    public function getMetaAttribute(array|string|null $value): ?array
    {
        return $this->stripInternalFields($this->decodeJsonAttribute($value));
    }

    /**
     * @param  array<array-key, mixed>|string|null  $value
     * @return array<array-key, mixed>|null
     */
    private function decodeJsonAttribute(array|string|null $value): ?array
    {
        if ($value === null) {
            return null;
        }

        if (is_array($value)) {
            return $value;
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : null;
    }

    /**
     * @param  array<array-key, mixed>|null  $value
     * @return array<array-key, mixed>|null
     */
    private function stripInternalFields(?array $value): ?array
    {
        if ($value === null) {
            return null;
        }

        unset($value['__nodal_preview']);

        foreach ($value as $key => $item) {
            if (is_array($item)) {
                $value[$key] = $this->stripInternalFields($item);
            }
        }

        return $value;
    }

    /**
     * Runs that block flow deletion: active, or awaiting cancellation.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<self>  $query
     */
    public function scopeActiveOrCancelling($query): void
    {
        $query->where(function ($query): void {
            $query->whereIn('status', ['pending', 'running'])
                ->orWhere(function ($query): void {
                    $query->whereNotNull('cancellation_requested_at')
                        ->whereNotIn('status', ['success', 'error', 'cancelled']);
                });
        });
    }

    /** @return BelongsTo<Flow, $this> */
    public function flow(): BelongsTo
    {
        return $this->belongsTo(Flow::class);
    }

    /** @return BelongsTo<FlowVersion, $this> */
    public function flowVersion(): BelongsTo
    {
        return $this->belongsTo(FlowVersion::class);
    }

    /** @return BelongsTo<User, $this> */
    public function triggeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'triggered_by');
    }

    /** @return HasMany<MailboxRunMessage, $this> */
    public function mailboxRunMessages(): HasMany
    {
        return $this->hasMany(MailboxRunMessage::class);
    }

    /** @return HasMany<MailboxRunWatcher, $this> */
    public function mailboxRunWatchers(): HasMany
    {
        return $this->hasMany(MailboxRunWatcher::class);
    }

    /** @return HasMany<FlowRunArtifact, $this> */
    public function artifacts(): HasMany
    {
        return $this->hasMany(FlowRunArtifact::class);
    }

    /** @return array{id: string, name: mixed}|null */
    public function getTriggeredByUserAttribute(): ?array
    {
        if (! $this->relationLoaded('triggeredBy')) {
            return null;
        }

        $user = $this->getRelation('triggeredBy');

        return $user instanceof User ? ['id' => $user->id, 'name' => $user->name] : null;
    }

    public function redactSecretsForClient(): self
    {
        $secrets = $this->resolvedSecretValues();

        $this->setAttribute('secrets_redacted', true);

        if ($secrets === null) {
            foreach (self::REDACTED_ATTRIBUTES as $attribute) {
                $value = $this->getAttribute($attribute);
                $this->setAttribute($attribute, $this->redactionUnavailableValue($value));
            }
            $this->setAttribute('error_message', self::REDACTION_UNAVAILABLE);

            return $this;
        }

        if ($secrets === []) {
            return $this;
        }

        foreach (self::REDACTED_ATTRIBUTES as $attribute) {
            $this->setAttribute(
                $attribute,
                $this->redactValue($this->getAttribute($attribute), $secrets),
            );
        }

        return $this;
    }

    public function redactResolvedSecrets(mixed $value): mixed
    {
        $secrets = $this->resolvedSecretValues();

        return $secrets === null
            ? $this->redactionUnavailableValue($value)
            : $this->redactValue($value, $secrets);
    }

    /** @return list<string>|null */
    private function resolvedSecretValues(): ?array
    {
        try {
            $resolvedSecrets = $this->getAttribute('resolved_secrets') ?? [];
        } catch (DecryptException) {
            return null;
        }

        if (! is_array($resolvedSecrets)) {
            return null;
        }

        $secrets = array_values(array_filter(
            $resolvedSecrets,
            fn (mixed $secret): bool => is_string($secret) && $secret !== '',
        ));
        usort($secrets, fn (string $left, string $right) => strlen($right) <=> strlen($left));

        return $secrets;
    }

    /** @param list<string> $secrets */
    private function redactValue(mixed $value, array $secrets): mixed
    {
        if (is_string($value)) {
            return str_replace($secrets, '[REDACTED]', $value);
        }

        if (! is_array($value)) {
            return $value;
        }

        if (array_is_list($value)) {
            foreach ($value as $key => $item) {
                $value[$key] = $this->redactValue($item, $secrets);
            }

            return $value;
        }

        $redacted = [];
        foreach ($value as $key => $item) {
            $keyAsString = (string) $key;
            $redactedKeyAsString = str_replace($secrets, '[REDACTED]', $keyAsString);
            $redactedKey = $redactedKeyAsString === $keyAsString ? $key : $redactedKeyAsString;

            if (array_key_exists($redactedKey, $redacted)) {
                $baseKey = (string) $redactedKey;
                $suffix = 2;

                do {
                    $redactedKey = "{$baseKey}#{$suffix}";
                    $suffix++;
                } while (array_key_exists($redactedKey, $redacted));
            }

            $redacted[$redactedKey] = $this->redactValue($item, $secrets);
        }

        return $redacted;
    }

    private function redactionUnavailableValue(mixed $value): mixed
    {
        if ($value === null) {
            return null;
        }

        if (! is_array($value)) {
            return self::REDACTION_UNAVAILABLE;
        }

        return array_is_list($value)
            ? [self::REDACTION_UNAVAILABLE]
            : ['error' => self::REDACTION_UNAVAILABLE];
    }

    /** @return BelongsTo<FlowTrigger, $this> */
    public function trigger(): BelongsTo
    {
        return $this->belongsTo(FlowTrigger::class, 'trigger_id');
    }

    public static function splitIdPath(int|string $id): string
    {
        return 'runs/'.StoragePathSharder::split($id);
    }

    public function getFlowArtifactsBasePath(bool $create = true): string
    {
        return app(RunArtifactPathResolver::class)->absoluteFlowPath($this->flowForStorage(), $create);
    }

    public function getFlowRunArtifactsBasePath(bool $create = true): string
    {
        return app(RunArtifactPathResolver::class)->absoluteRunPath($this, $create);
    }

    public function isWaitingForHumanValidation(): bool
    {
        return is_string($this->getAttribute('runtime_wait_id'))
            && $this->getAttribute('runtime_wait_id') !== '';
    }

    public function runtimeWaitId(): ?string
    {
        $waitId = $this->getAttribute('runtime_wait_id');

        return is_string($waitId) && $waitId !== '' ? $waitId : null;
    }

    public function runtimeValidationMessage(): ?string
    {
        $message = $this->getAttribute('runtime_validation_message');

        return is_string($message) && $message !== '' ? $message : null;
    }

    public function getRecordingPath(bool $create = true): string
    {
        return app(RunArtifactPathResolver::class)->absoluteRecordingPath($this, $create);
    }

    public function getRecordingLastshotPath(bool $create = true): string
    {
        return app(RunArtifactPathResolver::class)->absoluteRecordingLastshotPath($this, $create);
    }

    public function recordingExists(): bool
    {
        return app(RunArtifactQueryService::class)->recordingExists($this);
    }

    public function recordingLastshotExists(): bool
    {
        return app(RunArtifactQueryService::class)->recordingLastshotExists($this);
    }

    /** @return list<array{name: string, size: int, modified_at: string}> */
    public function getArtifactFiles(string $type): array
    {
        return app(RunArtifactQueryService::class)->artifactFiles($this, $type);
    }

    private function flowForStorage(): Flow
    {
        $flow = $this->flow;
        if (! $flow instanceof Flow) {
            throw new \LogicException('Flow run is missing its flow.');
        }

        return $flow;
    }
}
