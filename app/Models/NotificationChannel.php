<?php

/*
 * Explicit proprietary scope: the paid shared-scope fields and relations in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Models;

use App\Enums\Authorization\Ability;
use App\Enums\Integration\IntegrationCategoryEnum;
use App\Models\Concerns\HasStringId;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Gate;

/**
 * @property string $id
 * @property string|null $team_id
 */
class NotificationChannel extends Model
{
    use HasStringId;

    public const ID_PREFIX = 'chan';

    protected $hidden = ['config'];

    protected $fillable = [
        'workspace_id',
        'user_id',
        'messenger_integration_id',
        'name',
        'provider',
        'config',
        'is_active',
        'stale',
        'scope',
        'team_id',
        'group',
    ];

    protected function casts(): array
    {
        return [
            'config' => 'array',
            'is_active' => 'boolean',
            'stale' => 'boolean',
        ];
    }

    /** @return BelongsTo<Workspace, $this> */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<WorkspaceTeam, $this> */
    public function team(): BelongsTo
    {
        return $this->belongsTo(WorkspaceTeam::class, 'team_id');
    }

    /** @return BelongsTo<Integration, $this> */
    public function messengerIntegration(): BelongsTo
    {
        return $this->belongsTo(Integration::class, 'messenger_integration_id');
    }

    public function getToken(): ?string
    {
        if ($this->messenger_integration_id && $this->messengerIntegration) {
            return self::nullableString($this->messengerIntegration->config['token'] ?? null);
        }

        $config = $this->getAttribute('config');

        return is_array($config) ? self::nullableString($config['token'] ?? null) : null;
    }

    public function getRuntimeToken(User $actor, string $workspaceId): ?string
    {
        if (! $this->messenger_integration_id) {
            return $this->getToken();
        }

        return self::nullableString(
            $this->runtimeMessengerIntegration($actor, $workspaceId)->config['token'] ?? null,
        );
    }

    public function getChatId(): ?string
    {
        $config = $this->getAttribute('config');

        return is_array($config) ? self::nullableString($config['chat_id'] ?? null) : null;
    }

    public function getAppToken(): ?string
    {
        if ($this->messenger_integration_id && $this->messengerIntegration) {
            return self::nullableString($this->messengerIntegration->config['app_token'] ?? null);
        }

        $config = $this->getAttribute('config');

        return is_array($config) ? self::nullableString($config['app_token'] ?? null) : null;
    }

    private function runtimeMessengerIntegration(User $actor, string $workspaceId): Integration
    {
        $integration = $this->relationLoaded('messengerIntegration')
            ? $this->messengerIntegration
            : Integration::query()->find($this->messenger_integration_id);

        if (
            ! $integration
            || $integration->workspace_id !== $workspaceId
            || $integration->category !== IntegrationCategoryEnum::MESSENGER
            || ! $integration->is_active
            || $integration->stale
            || ! Gate::forUser($actor)->allows(Ability::USE->value, $integration)
        ) {
            throw new AuthorizationException('The linked messenger integration is no longer available.');
        }

        return $integration;
    }

    private static function nullableString(mixed $value): ?string
    {
        if ($value !== null && ! is_string($value)) {
            throw new \TypeError('Notification channel credential must be a string or null.');
        }

        return $value;
    }
}
