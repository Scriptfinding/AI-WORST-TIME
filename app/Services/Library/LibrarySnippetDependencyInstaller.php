<?php

namespace App\Services\Library;

use App\Authorization\ResourceAssignmentValidator;
use App\DTO\Library\LibraryBlueprint;
use App\DTO\Library\LibrarySnippetItem;
use App\Enums\Authorization\Ability;
use App\Models\Snippet;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

final class LibrarySnippetDependencyInstaller
{
    public function __construct(
        private readonly LibrarySnippetReferenceRewriter $references,
        private readonly ResourceAssignmentValidator $assignments,
    ) {}

    /**
     * Installs missing snippet dependencies and returns convention-to-ID rewrites.
     *
     * @param  array<string, mixed>|null  $graph
     * @return array<string, string>
     */
    public function ensureForResource(
        LibraryBlueprint $blueprint,
        ?string $code,
        ?array $graph,
        string $workspaceId,
        User $actor,
        string $ownerId,
        string $scope,
        ?string $teamId,
        ?int $externalId,
    ): array {
        /** @var array<string, LibrarySnippetItem> $available */
        $available = [];
        foreach ($blueprint->snippets as $item) {
            $convention = $this->references->convention(
                $item->namespace ?: 'library',
                $item->reference,
            );
            if (isset($available[$convention])) {
                throw ValidationException::withMessages([
                    'library' => "Multiple snippets resolve to the library reference \"{$convention}\".",
                ]);
            }
            $available[$convention] = $item;
        }

        if ($available === []) {
            return [];
        }

        $namespaces = collect($blueprint->snippets)
            ->map(fn (LibrarySnippetItem $item): string => $item->namespace ?: 'library')
            ->unique()
            ->values()
            ->all();
        $installed = $this->references->mapForWorkspace($workspaceId, $actor, $namespaces);
        $libraryPrefixes = collect($namespaces)
            ->map(fn (string $namespace): string => $this->references->convention($namespace, ''))
            ->all();
        /** @var array<string, LibrarySnippetItem> $required */
        $required = [];
        $checked = [];
        $queue = $this->references->references($code, $graph);

        while ($queue !== []) {
            $convention = array_shift($queue);
            if (isset($checked[$convention])) {
                continue;
            }
            $checked[$convention] = true;

            if (isset($installed[$convention])) {
                $snippet = Snippet::query()->find($installed[$convention]);
                if ($snippet instanceof Snippet && ! $this->coversDestination($snippet, $ownerId, $scope, $teamId)) {
                    throw ValidationException::withMessages([
                        'library' => "The installed dependency \"{$convention}\" is not visible to this flow.",
                    ]);
                }

                continue;
            }

            $dependency = $available[$convention] ?? null;
            if (! $dependency instanceof LibrarySnippetItem) {
                if (collect($libraryPrefixes)->contains(
                    fn (string $prefix): bool => str_starts_with($convention, $prefix),
                )) {
                    throw ValidationException::withMessages([
                        'library' => "The library dependency \"{$convention}\" is missing from this blueprint.",
                    ]);
                }

                continue;
            }

            $required[$convention] = $dependency;
            array_push($queue, ...$this->references->references($dependency->code, $dependency->nodalGraph));
        }

        if ($required === []) {
            return $installed;
        }

        Gate::authorize(Ability::CREATE->value, Snippet::class);
        $this->assignments->validate($workspaceId, $ownerId, $scope, $teamId);

        /** @var array<string, Snippet> $created */
        $created = [];
        foreach ($required as $convention => $item) {
            abort_if(
                $item->snippetType === 'nodal' && ($item->nodalGraph === null || trim($item->code ?? '') === ''),
                422,
                'Nodal library snippets must include a graph and compiled code.',
            );

            $snippet = Snippet::create([
                'workspace_id' => $workspaceId,
                'user_id' => $ownerId,
                'label' => $item->label,
                'description' => $item->description ?? $blueprint->description,
                'group' => $blueprint->category,
                'args' => $item->args,
                'code' => $item->code ?? '',
                'snippet_type' => $item->snippetType,
                'nodal_graph' => $item->snippetType === 'nodal' ? $item->nodalGraph : null,
                'scope' => $scope,
                'team_id' => $scope === 'team' ? $teamId : null,
                'is_active' => true,
                'library_external_id' => $externalId,
                'library_external_key' => $item->key,
                'library_namespace' => $item->namespace,
                'library_reference' => $item->reference,
                'library_source_path' => $item->sourcePath,
                'library_source_sha' => $item->sourceSha,
                'library_source_url' => $item->sourceUrl,
                'library_imported_at' => now(),
            ]);
            $created[$convention] = $snippet;
            $installed[$convention] = $snippet->id;
        }

        foreach ($created as $snippet) {
            $snippet->update([
                'code' => $this->references->code($snippet->code ?? '', $installed),
                'nodal_graph' => $snippet->snippet_type === 'nodal'
                    ? $this->references->graph($snippet->nodal_graph, $installed)
                    : null,
            ]);
        }

        return $installed;
    }

    private function coversDestination(
        Snippet $snippet,
        string $ownerId,
        string $scope,
        ?string $teamId,
    ): bool {
        if ($snippet->scope === 'workspace') {
            return true;
        }
        if ($scope === 'team') {
            return $snippet->scope === 'team' && $snippet->team_id === $teamId;
        }

        return $scope === 'owner'
            && $snippet->scope === 'owner'
            && $snippet->user_id === $ownerId;
    }
}
