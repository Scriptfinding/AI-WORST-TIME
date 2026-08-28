<?php

/*
 * Explicit proprietary scope: the private repository catalog loading, merging and refresh behavior in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Services\Library;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\Visibility\SharedResourceVisibility;
use App\DTO\Library\LibraryBlueprint;
use App\DTO\Library\LibraryCatalog;
use App\DTO\Library\LibraryChildItem;
use App\DTO\Library\LibraryFlowItem;
use App\DTO\Library\LibraryManifest;
use App\DTO\Library\LibraryMetadata;
use App\DTO\Library\LibrarySnippetItem;
use App\DTO\Library\LibraryStats;
use App\Enums\Authorization\Ability;
use App\Models\PrivateLibrary;
use App\Models\User;
use App\Services\FeatureFlags\FeatureFlagService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class LibraryCatalogService
{
    private const CACHE_DIR = 'library-cache';

    private const MANIFEST = 'library-cache/manifest.json';

    private const RAW_CACHE_DIR = 'library-cache/raw';

    private const CACHE_TTL = 3600;

    private const CACHE_VERSION = 10;

    public function __construct(
        private readonly LibraryExternalClient $externalClient,
        private readonly AuthorizationContextFactory $authorizationContexts,
        private readonly SharedResourceVisibility $sharedVisibility,
        private readonly BlueprintInputSchemaService $inputSchemas,
    ) {}

    public function items(?string $type = null, ?string $search = null, ?string $category = null, string $sort = 'popular', bool $refresh = false, ?string $identityHash = null, ?string $workspaceId = null, ?string $userId = null): LibraryCatalog
    {
        $manifest = $this->manifest($refresh);
        $manifest = $manifest->withItems(array_merge($manifest->items, $this->privateItems($workspaceId, $userId, Ability::VIEW)));
        $baseItems = collect($manifest->items);
        $items = $baseItems;

        if ($type) {
            $hasType = fn (LibraryBlueprint $item): bool => count($type === 'flow' ? $item->flows : $item->snippets) > 0;
            $items = $items->filter($hasType);
            $baseItems = $baseItems->filter($hasType);
        }

        if ($search) {
            $needle = Str::lower($search);
            $matchesSearch = fn (LibraryBlueprint $item): bool => str_contains(Str::lower(implode(' ', [
                $item->label,
                $item->title,
                $item->description ?? '',
                $item->namespace,
                $item->category ?? '',
            ])), $needle);

            $items = $items->filter($matchesSearch);
            $baseItems = $baseItems->filter($matchesSearch);
        }

        if ($category) {
            $items = $items->filter(fn (LibraryBlueprint $item): bool => $item->category === $category);
        }

        $items = $this->withStats(array_values($items->values()->all()), $identityHash);

        $items = array_values(collect($items)->sortByDesc(match ($sort) {
            'downloaded' => fn (LibraryBlueprint $item): int => $item->stats->downloadsCount,
            'liked' => fn (LibraryBlueprint $item): int => $item->stats->upvotesCount,
            'newest' => fn (LibraryBlueprint $item): string => $item->sourceSha ?? '',
            default => fn (LibraryBlueprint $item): int => $item->stats->downloadsCount,
        })->values()->all());

        $categoryCounts = $baseItems
            ->groupBy(fn (LibraryBlueprint $item): string => $item->category ?? 'Uncategorized')
            ->map(fn ($group) => $group->count())
            ->all();
        /** @var array<string, int> $categoryCounts */
        $categories = $baseItems
            ->map(fn (LibraryBlueprint $item): ?string => $item->category)
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();
        /** @var list<string> $categories */

        return new LibraryCatalog($items, $categories, $categoryCounts, $baseItems->count(), $manifest->cachedAt);
    }

    public function findBlueprint(string $namespace, bool $refresh = false, ?string $workspaceId = null, ?string $userId = null): ?LibraryBlueprint
    {
        $manifest = $this->manifest($refresh);
        $manifest = $manifest->withItems(array_merge($manifest->items, $this->privateItems($workspaceId, $userId, Ability::USE)));
        $blueprint = $this->findBlueprintInManifest($manifest, $namespace);

        if (! $blueprint && ! $refresh) {
            $manifest = $this->manifest(true);
            $manifest = $manifest->withItems(array_merge($manifest->items, $this->privateItems($workspaceId, $userId, Ability::USE)));
            $blueprint = $this->findBlueprintInManifest($manifest, $namespace);
        }

        return $blueprint ? $this->withBlueprintCode($blueprint) : null;
    }

    public function findChild(string $type, string $namespace, string $reference, bool $refresh = false, ?string $workspaceId = null, ?string $userId = null, ?string $catalogKey = null): ?LibraryChildItem
    {
        $blueprint = $this->findBlueprint($catalogKey ? $this->blueprintKeyFromCatalogKey($catalogKey) : $namespace, $refresh, $workspaceId, $userId);
        if (! $blueprint && $catalogKey) {
            $blueprint = $this->findBlueprint($namespace, $refresh, $workspaceId, $userId);
        }

        if (! $blueprint) {
            return null;
        }

        $collection = $type === 'flow' ? $blueprint->flows : $blueprint->snippets;
        foreach ($collection as $item) {
            if ($item->reference === $reference) {
                return $item;
            }
        }

        return null;
    }

    public function findParentBlueprint(string $namespace, ?string $catalogKey = null, ?string $workspaceId = null, ?string $userId = null): ?LibraryBlueprint
    {
        return $this->findBlueprint(
            $catalogKey ? $this->blueprintKeyFromCatalogKey($catalogKey) : $namespace,
            workspaceId: $workspaceId,
            userId: $userId,
        );
    }

    public function refreshPrivateLibrary(PrivateLibrary $library): PrivateLibrary
    {
        abort_unless($this->privateRepositoriesEnabled(), 404);

        try {
            [$repo, $urlBranch] = $this->githubRepoFromUrl($library->url);
            $branch = trim((string) ($library->branch ?: $urlBranch ?: 'main'));
            $manifest = $this->buildPrivateManifestFromGitHub(
                $repo,
                $branch,
                privateLibrary: $library,
            );

            $library->update([
                'repo' => $repo,
                'branch' => $manifest->branch ?? $branch,
                'manifest' => $manifest->toArray(),
                'cached_at' => now(),
                'last_error' => null,
            ]);
        } catch (\Throwable $e) {
            $library->update(['last_error' => $e->getMessage()]);
            throw $e;
        }

        return $library->fresh(['owner:id,name', 'team:id,name']) ?? $library;
    }

    private function manifest(bool $refresh): LibraryManifest
    {
        if (! $refresh && $this->cacheIsFresh()) {
            return $this->decodeManifest(Storage::disk('local')->get(self::MANIFEST));
        }

        try {
            return $this->refreshManifest();
        } catch (\Throwable) {
            if (Storage::disk('local')->exists(self::MANIFEST)) {
                $manifest = $this->decodeManifest(Storage::disk('local')->get(self::MANIFEST));
                if ($manifest->version === self::CACHE_VERSION && $manifest->sourceKind === 'public') {
                    return $manifest;
                }
            }

            return LibraryManifest::empty();
        }
    }

    private function cacheIsFresh(): bool
    {
        if (! Storage::disk('local')->exists(self::MANIFEST)) {
            return false;
        }

        $manifest = $this->decodeManifest(Storage::disk('local')->get(self::MANIFEST));
        $cachedAt = $manifest->cachedAt !== null ? strtotime($manifest->cachedAt) : 0;

        if ($manifest->version !== self::CACHE_VERSION || $manifest->sourceKind !== 'public') {
            return false;
        }

        return $cachedAt > 0 && (time() - $cachedAt) < self::CACHE_TTL;
    }

    private function refreshManifest(): LibraryManifest
    {
        $payload = $this->externalClient->catalog();
        if (! is_array($payload) || ! is_array($payload['items'] ?? null)) {
            throw new \RuntimeException('Unable to fetch the landing blueprints catalog.');
        }

        $manifest = LibraryManifest::fromArray([
            'version' => self::CACHE_VERSION,
            'external_version' => is_string($payload['version'] ?? null) ? $payload['version'] : null,
            'cached_at' => now()->toIso8601String(),
            'source_kind' => 'public',
            'items' => $payload['items'],
        ]);
        Storage::disk('local')->put(self::MANIFEST, json_encode($manifest->toArray(), JSON_PRETTY_PRINT) ?: '{}');

        return $manifest;
    }

    private function buildPrivateManifestFromGitHub(string $repo, string $branch, PrivateLibrary $privateLibrary): LibraryManifest
    {
        $treeResponse = Http::timeout(12)->get("https://api.github.com/repos/{$repo}/git/trees/{$branch}", [
            'recursive' => 1,
        ]);

        if ($treeResponse->notFound()) {
            $repositoryResponse = Http::timeout(12)->get("https://api.github.com/repos/{$repo}");
            $defaultBranch = $repositoryResponse->successful()
                ? $repositoryResponse->json('default_branch')
                : null;

            if (is_string($defaultBranch) && $defaultBranch !== '' && $defaultBranch !== $branch) {
                $branch = $defaultBranch;
                $treeResponse = Http::timeout(12)->get("https://api.github.com/repos/{$repo}/git/trees/{$branch}", [
                    'recursive' => 1,
                ]);
            }
        }

        if ($treeResponse->successful()) {
            /** @var list<array{path: string, type: string, sha?: string}> $tree */
            $tree = $treeResponse->json('tree', []);
        } else {
            $archive = $this->fetchGitHubArchiveTree($repo, $branch);
            if ($archive === null) {
                $message = $treeResponse->json('message');
                $reason = is_string($message) && $message !== ''
                    ? " GitHub responded with {$treeResponse->status()}: {$message}"
                    : " GitHub responded with {$treeResponse->status()}.";

                throw new \RuntimeException('Unable to fetch the library GitHub tree.'.$reason);
            }

            $branch = $archive['branch'];
            $tree = $archive['tree'];
        }

        $entries = collect($tree);
        /** @var array<string, LibraryMetadata> $metadataByService */
        $metadataByService = [];
        /** @var array<string, string> $basePathByService */
        $basePathByService = [];
        /** @var array<string, string> $sourceShaByService */
        $sourceShaByService = [];

        foreach ($entries as $entry) {
            $path = $entry['path'];
            if ($entry['type'] !== 'blob') {
                continue;
            }

            if (preg_match('#^(?:blueprints/)?([^/]+)/metadata\.json$#', $path, $matches)) {
                $raw = $this->fetchRawCached($repo, $branch, $path, $entry['sha'] ?? null);
                $decodedMetadata = $raw ? json_decode($raw, true) : null;
                /** @var array<string, mixed> $metadataValues */
                $metadataValues = is_array($decodedMetadata) ? $decodedMetadata : [];
                $metadata = LibraryMetadata::fromArray($metadataValues);
                $metadataByService[$matches[1]] = $metadata;
                $basePathByService[$matches[1]] = str_replace('/metadata.json', '', $path);
                $sourceShaByService[$matches[1]] = $entry['sha'] ?? sha1($path.$raw);
            }
        }

        /** @var array<string, LibraryBlueprint> $blueprints */
        $blueprints = [];
        foreach ($metadataByService as $service => $metadata) {
            $namespace = $metadata->namespace ?? $service;
            $blueprints[$namespace] = $this->blueprintItem(
                $repo,
                $branch,
                $service,
                $metadata,
                $basePathByService[$service] ?? $service,
                $sourceShaByService[$service] ?? null,
                $privateLibrary,
            );
        }

        foreach ($entries as $entry) {
            $path = $entry['path'];
            if ($entry['type'] !== 'blob') {
                continue;
            }

            if (! preg_match('#^(?:blueprints/)?([^/]+)/(flows)/([^/]+)\.(js|json)$#', $path, $matches) && ! preg_match('#^(?:blueprints/)?([^/]+)/(snippets)/([^/]+)\.(js|json)$#', $path, $matches)) {
                continue;
            }

            $service = $matches[1];
            $folder = $matches[2];
            $file = $matches[3];
            $extension = $matches[4];
            $metadata = $metadataByService[$service] ?? LibraryMetadata::fromArray([]);
            $basePath = $basePathByService[$service] ?? $service;
            $namespace = $metadata->namespace ?? $service;
            $type = $folder === 'flows' ? 'flow' : 'snippet';
            $sha = $entry['sha'] ?? null;
            $cachePath = $sha ? self::CACHE_DIR.'/code/'.$sha.'.'.$extension : null;
            $code = $cachePath && Storage::disk('local')->exists($cachePath)
                ? (Storage::disk('local')->get($cachePath) ?? '')
                : ($this->fetchRawCached($repo, $branch, $path, $sha) ?? '');
            if ($folder === 'snippets' && $extension === 'json' && $this->nodalGraphFromJson($code) === null) {
                continue;
            }
            $sha ??= sha1($path.$code);
            $cachePath = self::CACHE_DIR.'/code/'.$sha.'.'.$extension;

            if (! Storage::disk('local')->exists($cachePath)) {
                Storage::disk('local')->put($cachePath, $code);
            }

            if (! isset($blueprints[$namespace])) {
                $blueprints[$namespace] = $this->blueprintItem(
                    $repo,
                    $branch,
                    $service,
                    $metadata,
                    $basePath,
                    $sourceShaByService[$service] ?? null,
                    $privateLibrary,
                );
            }

            $codeMetadata = $this->metadataFromSource($code, $extension);
            $isNodalFlow = $type === 'flow' && $extension === 'json';
            $isNodalSnippet = $type === 'snippet' && $extension === 'json';

            $current = $blueprints[$namespace];
            $flows = $current->flows;
            $snippets = $current->snippets;
            if ($type === 'flow') {
                $flows[] = new LibraryFlowItem(
                    key: $this->catalogKey("flow:{$namespace}:{$file}", $privateLibrary),
                    namespace: $namespace,
                    reference: $file,
                    label: $codeMetadata['title'] ?? Str::headline($file),
                    description: $codeMetadata['description'] ?? $metadata->description,
                    category: $metadata->category,
                    sourcePath: $path,
                    sourceSha: $sha,
                    sourceUrl: "https://github.com/{$repo}/blob/{$branch}/{$path}",
                    cachePath: $cachePath,
                    sourceKind: 'private',
                    privateLibraryId: $privateLibrary->id,
                    code: null,
                    flowType: $isNodalFlow ? 'nodal' : 'code',
                    nodalGraph: null,
                    defaultInputs: $codeMetadata['default_inputs'] ?? [],
                    inputDefinitions: $codeMetadata['input_definitions'] ?? [],
                );
            } else {
                $snippets[] = new LibrarySnippetItem(
                    key: $this->catalogKey("snippet:{$namespace}:{$file}", $privateLibrary),
                    namespace: $namespace,
                    reference: $file,
                    label: $codeMetadata['title'] ?? Str::headline($file),
                    description: $codeMetadata['description'] ?? $metadata->description,
                    category: $metadata->category,
                    sourcePath: $path,
                    sourceSha: $sha,
                    sourceUrl: "https://github.com/{$repo}/blob/{$branch}/{$path}",
                    cachePath: $cachePath,
                    sourceKind: 'private',
                    privateLibraryId: $privateLibrary->id,
                    code: null,
                    args: $codeMetadata['args'] ?? '',
                    snippetType: $isNodalSnippet ? 'nodal' : 'code',
                    nodalGraph: null,
                );
            }
            $blueprints[$namespace] = $current->withChildren(
                $flows,
                $snippets,
                sha1(($current->sourceSha ?? '').$sha),
            );
        }

        return new LibraryManifest(
            version: self::CACHE_VERSION,
            externalVersion: null,
            cachedAt: now()->toIso8601String(),
            repo: $repo,
            branch: $branch,
            sourceKind: 'private',
            privateLibraryId: $privateLibrary->id,
            items: array_values($blueprints),
        );
    }

    /**
     * @return array{
     *     branch: string,
     *     tree: list<array{path: string, type: string, sha: string}>
     * }|null
     */
    private function fetchGitHubArchiveTree(string $repo, string $branch): ?array
    {
        $candidates = array_values(array_unique([$branch, 'HEAD']));

        foreach ($candidates as $candidate) {
            $response = Http::timeout(30)->get("https://codeload.github.com/{$repo}/zip/{$candidate}");
            if (! $response->successful()) {
                continue;
            }

            $temporaryPath = tempnam(sys_get_temp_dir(), 'puppetflow-library-');
            if ($temporaryPath === false) {
                return null;
            }

            try {
                if (file_put_contents($temporaryPath, $response->body()) === false) {
                    continue;
                }

                $zip = new \ZipArchive;
                if ($zip->open($temporaryPath) !== true) {
                    continue;
                }

                $tree = [];
                try {
                    for ($index = 0; $index < $zip->numFiles; $index++) {
                        $stat = $zip->statIndex($index);
                        if (! is_array($stat)) {
                            continue;
                        }

                        $archivePath = $stat['name'] ?? null;
                        if (! is_string($archivePath) || str_ends_with($archivePath, '/')) {
                            continue;
                        }

                        $separator = strpos($archivePath, '/');
                        if ($separator === false || $separator === strlen($archivePath) - 1) {
                            continue;
                        }

                        $path = substr($archivePath, $separator + 1);
                        $tree[] = [
                            'path' => $path,
                            'type' => 'blob',
                            'sha' => sha1($path.':'.($stat['crc'] ?? '').':'.($stat['size'] ?? '')),
                        ];
                    }
                } finally {
                    $zip->close();
                }

                return [
                    'branch' => $candidate,
                    'tree' => $tree,
                ];
            } finally {
                @unlink($temporaryPath);
            }
        }

        return null;
    }

    private function blueprintItem(string $repo, string $branch, string $service, LibraryMetadata $metadata, string $basePath, ?string $sourceSha, PrivateLibrary $privateLibrary): LibraryBlueprint
    {
        $namespace = $metadata->namespace ?? $service;
        $title = $metadata->title ?? ($privateLibrary->label ?: Str::headline($namespace));

        return new LibraryBlueprint(
            key: $this->catalogKey("blueprint:{$namespace}", $privateLibrary),
            namespace: $namespace,
            reference: $service,
            title: $title,
            label: $title,
            description: $metadata->description ?? $privateLibrary->description,
            category: $privateLibrary->group ?: $metadata->category,
            color: $metadata->color ?? 'green',
            iconUrl: $this->iconUrl($repo, $branch, $basePath, $metadata),
            sourcePath: $basePath,
            sourceSha: $sourceSha,
            sourceUrl: "https://github.com/{$repo}/tree/{$branch}/{$basePath}",
            sourceKind: 'private',
            privateLibraryId: $privateLibrary->id,
            privateLibraryLabel: $privateLibrary->label,
            metadata: $metadata,
            flows: [],
            snippets: [],
            stats: LibraryStats::empty(),
        );
    }

    private function fetchRaw(string $repo, string $branch, string $path): ?string
    {
        $url = "https://raw.githubusercontent.com/{$repo}/{$branch}/{$path}";
        $response = Http::timeout(10)->get($url);

        return $response->successful() ? $response->body() : null;
    }

    private function fetchRawCached(string $repo, string $branch, string $path, ?string $sha): ?string
    {
        $cachePath = $sha ? self::RAW_CACHE_DIR.'/'.$sha.'.txt' : null;

        if ($cachePath && Storage::disk('local')->exists($cachePath)) {
            return Storage::disk('local')->get($cachePath);
        }

        $raw = $this->fetchRaw($repo, $branch, $path);
        if ($raw !== null && $cachePath) {
            Storage::disk('local')->put($cachePath, $raw);
        }

        return $raw;
    }

    private function decodeManifest(?string $contents): LibraryManifest
    {
        if ($contents === null || $contents === '') {
            return LibraryManifest::empty();
        }

        $decoded = json_decode($contents, true);
        if (! is_array($decoded) || ! is_array($decoded['items'] ?? null)) {
            return LibraryManifest::empty();
        }

        /** @var array<string, mixed> $decoded */
        return LibraryManifest::fromArray($decoded);
    }

    /** @return array{0: string, 1: string|null} */
    private function githubRepoFromUrl(string $repoUrl): array
    {
        if (preg_match('#github\.com[:/]([^/]+)/([^/]+?)(?:\.git)?(?:/tree/(.+))?/?$#', $repoUrl, $matches)) {
            return [
                "{$matches[1]}/{$matches[2]}",
                isset($matches[3]) ? trim($matches[3], '/') : null,
            ];
        }

        throw new \RuntimeException('Invalid library GitHub repository URL.');
    }

    private function privateRepositoriesEnabled(): bool
    {
        return app(FeatureFlagService::class)->enabled('private_libraries_enabled');
    }

    /** @return list<LibraryBlueprint> */
    private function privateItems(?string $workspaceId, ?string $userId, Ability $ability): array
    {
        if (! $this->privateRepositoriesEnabled() || ! $workspaceId || ! $userId) {
            return [];
        }

        $user = User::find($userId);
        if (! $user) {
            return [];
        }

        $query = PrivateLibrary::query()
            ->where('stale', false)
            ->whereNotNull('manifest');
        $context = $this->authorizationContexts->for($user, $workspaceId);

        if ($ability === Ability::VIEW) {
            $this->sharedVisibility->applyView(
                $query,
                $context,
                scopeColumn: 'visibility',
            );
        } else {
            $this->sharedVisibility->applyUse(
                $query,
                $context,
                scopeColumn: 'visibility',
            );
        }

        $items = [];
        foreach ($query->get() as $library) {
            $manifest = $library->getAttribute('manifest');
            if (is_array($manifest)) {
                /** @var array<string, mixed> $manifest */
                $items = array_merge($items, LibraryManifest::fromArray($manifest)->items);
            }
        }

        return $items;
    }

    private function catalogKey(string $baseKey, PrivateLibrary $privateLibrary): string
    {
        return "private:{$privateLibrary->id}:{$baseKey}";
    }

    private function blueprintKeyFromCatalogKey(string $catalogKey): string
    {
        if (preg_match('#^(private:\d+:)?(?:flow|snippet):([^:]+):[^:]+$#', $catalogKey, $matches)) {
            return $matches[1].'blueprint:'.$matches[2];
        }

        return $catalogKey;
    }

    /** @return array{title?: string, description?: string, args?: string, default_inputs?: array<string, mixed>, input_definitions?: list<array{name: string, type: string, default: mixed}>} */
    private function metadataFromSource(string $source, string $extension): array
    {
        if ($extension === 'json') {
            return $this->metadataFromJson(json_decode($source, true));
        }

        return $this->metadataFromCode($source);
    }

    /** @return array{title?: string, description?: string, args?: string, default_inputs?: array<string, mixed>, input_definitions?: list<array{name: string, type: string, default: mixed}>} */
    private function metadataFromJson(mixed $decoded): array
    {
        if (! is_array($decoded)) {
            return [];
        }

        /** @var array<string, mixed> $decoded */
        $metadata = $this->jsonMetadataSubset($decoded);

        $result = array_filter([
            'title' => is_string($metadata['title'] ?? null) ? trim($metadata['title']) : null,
            'description' => is_string($metadata['description'] ?? null) ? trim($metadata['description']) : null,
            'args' => is_string($metadata['args'] ?? null)
                ? trim($metadata['args'])
                : (is_array($metadata['args'] ?? null)
                    ? implode(', ', array_values(array_filter($metadata['args'], 'is_string')))
                    : null),
        ], fn ($value) => is_string($value) && $value !== '');
        $inputDefinitions = $this->inputDefinitionsFromMetadata($metadata['inputs'] ?? null);
        if ($inputDefinitions !== []) {
            $result['input_definitions'] = $inputDefinitions;
            $result['default_inputs'] = $this->inputDefaultsFromDefinitions($inputDefinitions);
        }

        return $result;
    }

    /**
     * @param  array<string, mixed>  $decoded
     * @return array<string, mixed>
     */
    private function jsonMetadataSubset(array $decoded): array
    {
        foreach (['metadata', 'store', 'library', null] as $key) {
            $candidate = $key === null ? $decoded : ($decoded[$key] ?? null);
            if (is_array($candidate) && (isset($candidate['title']) || isset($candidate['description']))) {
                return $candidate;
            }
        }

        return [];
    }

    /** @return array{nodes: list<array<string, mixed>>, edges: list<array<string, mixed>>}|null */
    private function nodalGraphFromJson(string $source): ?array
    {
        $decoded = json_decode($source, true);
        if (! is_array($decoded)) {
            return null;
        }

        foreach (['graph', 'nodal_graph', 'nodalGraph'] as $key) {
            if (isset($decoded[$key]) && is_array($decoded[$key]) && isset($decoded[$key]['nodes'], $decoded[$key]['edges']) && is_array($decoded[$key]['nodes']) && is_array($decoded[$key]['edges'])) {
                /** @var list<array<string, mixed>> $nodes */
                $nodes = $decoded[$key]['nodes'];
                /** @var list<array<string, mixed>> $edges */
                $edges = $decoded[$key]['edges'];

                return ['nodes' => $nodes, 'edges' => $edges];
            }
        }

        if (isset($decoded['nodes'], $decoded['edges']) && is_array($decoded['nodes']) && is_array($decoded['edges'])) {
            /** @var list<array<string, mixed>> $nodes */
            $nodes = $decoded['nodes'];
            /** @var list<array<string, mixed>> $edges */
            $edges = $decoded['edges'];

            return ['nodes' => $nodes, 'edges' => $edges];
        }

        return null;
    }

    private function codeFromJson(string $source): string
    {
        $decoded = json_decode($source, true);
        if (! is_array($decoded)) {
            return '';
        }

        foreach (['code', 'compiled_code', 'compiledCode'] as $key) {
            if (isset($decoded[$key]) && is_string($decoded[$key])) {
                return $decoded[$key];
            }
        }

        return '';
    }

    /** @return array{title?: string, description?: string, args?: string, default_inputs?: array<string, mixed>, input_definitions?: list<array{name: string, type: string, default: mixed}>} */
    private function metadataFromCode(string $code): array
    {
        /** @var array{title?: string, description?: string, args?: string, default_inputs?: array<string, mixed>, input_definitions?: list<array{name: string, type: string, default: mixed}>} $metadata */
        $metadata = [];
        /** @var list<string> $params */
        $params = [];

        foreach (preg_split('/\R/', $code) ?: [] as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }
            if (! str_starts_with($line, '//')) {
                break;
            }
            if (preg_match('/^\/\/\s*@(title|description)\s+(.+)$/i', $line, $matches)) {
                $value = trim($matches[2]);
                if (strtolower($matches[1]) === 'title') {
                    $metadata['title'] = $value;
                } else {
                    $metadata['description'] = $value;
                }

                continue;
            }
            if (preg_match('/^\/\/\s*@param\s+(.+)$/i', $line, $matches)) {
                $param = $this->paramNameFromDocTag($matches[1]);
                if ($param !== null && ! in_array($param, $params, true)) {
                    $params[] = $param;
                }
            }
        }

        if (! empty($params)) {
            $metadata['args'] = implode(', ', $params);
        }
        $inputDefinitions = $this->inputSchemas->fromCode($code);
        if ($inputDefinitions !== []) {
            $metadata['default_inputs'] = $this->inputDefaultsFromDefinitions($inputDefinitions);
            $metadata['input_definitions'] = $inputDefinitions;
        }

        return $metadata;
    }

    /** @return list<array{name: string, type: string, default: mixed}> */
    private function inputDefinitionsFromMetadata(mixed $inputs): array
    {
        if (! is_array($inputs)) {
            return [];
        }

        $definitions = [];
        foreach ($inputs as $input) {
            if (
                ! is_array($input)
                || ! is_string($input['name'] ?? null)
                || ! preg_match('/^[a-zA-Z_$][a-zA-Z0-9_$]*$/', $input['name'])
                || ! is_string($input['type'] ?? null)
                || ! in_array($input['type'], BlueprintInputSchemaService::TYPES, true)
            ) {
                continue;
            }
            $definitions[] = [
                'name' => $input['name'],
                'type' => $input['type'],
                'default' => array_key_exists('default', $input)
                    ? $input['default']
                    : BlueprintInputSchemaService::defaultValueForType($input['type']),
            ];
        }

        return $definitions;
    }

    /**
     * @param  list<array{name: string, type: string, default: mixed}>  $definitions
     * @return array<string, mixed>
     */
    private function inputDefaultsFromDefinitions(array $definitions): array
    {
        $defaults = [];
        foreach ($definitions as $definition) {
            $defaults[$definition['name']] = $definition['default'];
        }

        return $defaults;
    }

    private function paramNameFromDocTag(string $value): ?string
    {
        $value = trim($value);
        $value = preg_replace('/^\{[^}]+\}\s*/', '', $value) ?? $value;
        $value = ltrim($value, '[');

        if (! preg_match('/^([a-zA-Z_$][a-zA-Z0-9_$]*)/', $value, $matches)) {
            return null;
        }

        return $matches[1];
    }

    private function iconUrl(string $repo, string $branch, string $service, LibraryMetadata $metadata): ?string
    {
        $icon = $metadata->icon ?? 'icon.png';
        if ($icon === '') {
            return null;
        }

        return "https://raw.githubusercontent.com/{$repo}/{$branch}/{$service}/{$icon}";
    }

    /**
     * @param  list<LibraryBlueprint>  $items
     * @return list<LibraryBlueprint>
     */
    private function withStats(array $items, ?string $identityHash = null): array
    {
        $stats = $this->externalClient->stats(
            array_map(static fn (LibraryBlueprint $item): string => $item->key, $items),
            $identityHash,
        );

        return array_map(
            static fn (LibraryBlueprint $item): LibraryBlueprint => $item->withStats($stats[$item->key] ?? LibraryStats::empty()),
            $items,
        );
    }

    private function findBlueprintInManifest(LibraryManifest $manifest, string $namespace): ?LibraryBlueprint
    {
        foreach ($manifest->items as $item) {
            if ($item->key === $namespace || $item->namespace === $namespace) {
                return $item;
            }
        }

        return null;
    }

    private function withBlueprintCode(LibraryBlueprint $blueprint): LibraryBlueprint
    {
        $flows = array_map(function (LibraryFlowItem $item): LibraryFlowItem {
            if ($item->code !== null) {
                if ($item->inputDefinitions === [] && $item->flowType === 'code') {
                    $metadata = $this->metadataFromCode($item->code);

                    return $item->withCode(
                        $item->code,
                        $item->nodalGraph,
                        $metadata['default_inputs'] ?? [],
                        $metadata['input_definitions'] ?? [],
                    );
                }

                return $item;
            }

            $source = Storage::disk('local')->get($item->cachePath) ?? '';
            $metadata = $this->metadataFromSource($source, strtolower(pathinfo($item->sourcePath, PATHINFO_EXTENSION)));
            $defaultInputs = $metadata['default_inputs'] ?? $item->defaultInputs;
            $inputDefinitions = $metadata['input_definitions'] ?? $item->inputDefinitions;

            return $item->flowType === 'nodal'
                ? $item->withCode($this->codeFromJson($source), $this->nodalGraphFromJson($source), $defaultInputs, $inputDefinitions)
                : $item->withCode($source, defaultInputs: $defaultInputs, inputDefinitions: $inputDefinitions);
        }, $blueprint->flows);
        $snippets = array_map(function (LibrarySnippetItem $item): LibrarySnippetItem {
            if ($item->code !== null) {
                return $item;
            }

            $source = Storage::disk('local')->get($item->cachePath) ?? '';

            return $item->snippetType === 'nodal'
                ? $item->withCode($this->codeFromJson($source), $this->nodalGraphFromJson($source))
                : $item->withCode($source);
        }, $blueprint->snippets);

        return $blueprint->withChildren($flows, $snippets);
    }
}
