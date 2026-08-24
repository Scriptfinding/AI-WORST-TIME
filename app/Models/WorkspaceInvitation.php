<?php

namespace App\Models;

use App\Support\IdentityEmail;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property Workspace $workspace
 * @property WorkspaceTeam|null $team
 * @property User $inviter
 * @property string|null $team_id
 * @property string $email
 * @property bool $can_create_workspace
 * @property Carbon $expires_at
 */
class WorkspaceInvitation extends Model
{
    protected $fillable = [
        'workspace_id',
        'team_id',
        'invited_by',
        'email',
        'role',
        'can_create_workspace',
        'token',
        'expires_at',
        'registration_name',
        'registration_password',
        'registration_submitted_at',
        'registration_email_verified_at',
    ];

    protected $hidden = [
        'registration_password',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'registration_submitted_at' => 'datetime',
            'registration_email_verified_at' => 'datetime',
        ];
    }

    /** @return Attribute<string, string> */
    protected function email(): Attribute
    {
        return Attribute::make(
            set: fn (mixed $value): string => IdentityEmail::normalize($value),
        );
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /** @return BelongsTo<Workspace, $this> */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /** @return BelongsTo<WorkspaceTeam, $this> */
    public function team(): BelongsTo
    {
        return $this->belongsTo(WorkspaceTeam::class);
    }

    /** @return BelongsTo<User, $this> */
    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }
}
