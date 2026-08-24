<?php

namespace App\DTO\UserVariable;

final readonly class ImportVariablesData
{
    /**
     * @param  array<int, ImportVariableData>  $variables
     */
    private function __construct(
        public array $variables,
        public ?string $group,
        public string $scope,
        public ?string $teamId,
        public ?string $userId,
    ) {}

    /**
     * @param  array{
     *   variables: array<int, array{key: string, value?: string|null, type: string}>,
     *   group?: string|null,
     *   scope?: string,
     *   team_id?: string|null,
     *   user_id?: string|null
     * }  $validated
     */
    public static function fromValidated(array $validated): self
    {
        $variables = [];

        foreach ($validated['variables'] as $index => $variable) {
            $variables[$index] = new ImportVariableData(
                key: $variable['key'],
                value: $variable['value'] ?? null,
                type: $variable['type'],
            );
        }

        return new self(
            variables: $variables,
            group: $validated['group'] ?? null,
            scope: $validated['scope'] ?? 'user',
            teamId: $validated['team_id'] ?? null,
            userId: $validated['user_id'] ?? null,
        );
    }

    /**
     * @return array{user_id?: string|null}
     */
    public function ownerData(): array
    {
        return $this->userId === null ? [] : ['user_id' => $this->userId];
    }
}
