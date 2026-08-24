<?php

namespace App\DTO\Library;

final readonly class LibraryImportOverrides
{
    public function __construct(
        public ?string $name,
        public ?string $label,
        public ?string $description,
        public ?string $group,
        public ?string $visibility,
        public ?string $scope,
        public ?string $teamId,
        public ?string $ownerId,
        public bool $hasDescription,
        public bool $hasGroup,
    ) {}

    /**
     * @param array{
     *     name?: string|null,
     *     label?: string|null,
     *     description?: string|null,
     *     group?: string|null,
     *     visibility?: string|null,
     *     scope?: string|null,
     *     team_id?: string|null,
     *     owner_id?: string|null
     * } $values
     */
    public static function fromValidated(array $values): self
    {
        return new self(
            name: $values['name'] ?? null,
            label: $values['label'] ?? null,
            description: $values['description'] ?? null,
            group: $values['group'] ?? null,
            visibility: $values['visibility'] ?? null,
            scope: $values['scope'] ?? null,
            teamId: $values['team_id'] ?? null,
            ownerId: $values['owner_id'] ?? null,
            hasDescription: array_key_exists('description', $values),
            hasGroup: array_key_exists('group', $values),
        );
    }

    public function ownerId(string $default): string
    {
        return $this->ownerId ?? $default;
    }

    public function flowVisibility(): string
    {
        return $this->visibility ?? 'owner';
    }

    public function flowTeamId(): ?string
    {
        return $this->flowVisibility() === 'team' ? $this->teamId : null;
    }

    public function snippetScope(string $default): string
    {
        return $this->scope ?? $default;
    }

    public function snippetTeamId(string $scope, ?string $default): ?string
    {
        return $scope === 'team' ? ($this->teamId ?? $default) : null;
    }
}
