<?php

namespace App\Http\Controllers\Flow;

use App\DTO\Library\LibraryBlueprint;
use App\DTO\Library\LibraryFlowItem;
use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Models\FlowUserInput;
use App\Models\FlowVersion;
use App\Models\User;
use App\Rules\ValidDraftNodalGraph;
use App\Rules\ValidNodalGraph;
use App\Services\Flow\Query\FlowEditorQuery;
use App\Services\Library\BlueprintAppearanceService;
use App\Services\Library\BlueprintInputSchemaService;
use App\Services\Library\LibraryCatalogService;
use App\Services\Library\LibrarySnippetDependencyInstaller;
use App\Services\Library\LibrarySnippetReferenceRewriter;
use App\Services\Storage\FlowCookieStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

final class FlowContentController extends Controller
{
    public function __construct(
        private readonly LibraryCatalogService $catalog,
        private readonly FlowEditorQuery $editor,
        private readonly FlowCookieStorage $cookies,
        private readonly BlueprintAppearanceService $appearance,
        private readonly BlueprintInputSchemaService $inputSchemas,
        private readonly LibrarySnippetReferenceRewriter $snippetReferences,
        private readonly LibrarySnippetDependencyInstaller $snippetDependencies,
    ) {}

    public function version(Request $request, Flow $flow): JsonResponse
    {
        $this->authorize(Ability::VIEW->value, $flow);

        return response()->json([
            'content_updated_at' => $flow->content_updated_at?->toJSON() ?? $flow->updated_at?->toJSON(),
            'updated_at' => $flow->updated_at?->toJSON(),
            'code' => $flow->code,
            'nodal_graph' => $flow->nodal_graph,
            'flow_type' => $flow->flow_type,
            'is_published' => $flow->is_published,
            'published_version' => $flow->publishedVersion?->version,
        ]);
    }

    public function exportInputs(Request $request, Flow $flow): JsonResponse
    {
        $this->authorize(Ability::VIEW->value, $flow);

        return response()->json([
            'inputs' => is_array($flow->default_inputs) ? $flow->default_inputs : [],
        ]);
    }

    public function updateCode(Request $request, Flow $flow): JsonResponse|RedirectResponse
    {
        $this->authorize(Ability::UPDATE->value, $flow);
        abort_if($flow->library_locked, 423, 'Duplicate this library flow before editing its code.');
        $request->validate([
            'code' => 'present|string',
            'nodal_graph' => ['sometimes', 'nullable', 'array', new ValidDraftNodalGraph],
            'client_updated_at' => 'sometimes|nullable|string',
            'force_current_version' => 'sometimes|boolean',
        ]);
        $data = ['code' => $request->input('code')];
        if ($request->has('nodal_graph')) {
            $data['nodal_graph'] = $request->input('nodal_graph');
        }
        $flow = DB::transaction(function () use ($flow, $request, $data): Flow {
            $lockedFlow = Flow::query()->whereKey($flow->id)->lockForUpdate()->firstOrFail();
            $this->ensureCurrent($request, $lockedFlow);
            $lockedFlow->update($data);

            return $lockedFlow;
        }, 3);

        if ($request->expectsJson()) {
            return response()->json([
                'content_updated_at' => $flow->content_updated_at?->toJSON(),
                'updated_at' => $flow->updated_at?->toJSON(),
            ]);
        }

        return back()->with('success', 'Draft saved.');
    }

    public function publish(Request $request, Flow $flow): JsonResponse|RedirectResponse
    {
        $this->authorize(Ability::UPDATE->value, $flow);
        abort_if($flow->library_locked, 423, 'Duplicate this library flow before publishing it.');
        $request->validate(['client_updated_at' => 'sometimes|nullable|string']);

        $version = DB::transaction(function () use ($flow, $request): FlowVersion {
            $lockedFlow = Flow::query()->whereKey($flow->id)->lockForUpdate()->firstOrFail();
            $this->ensureCurrent($request, $lockedFlow);
            $rules = ['code' => ['required', 'string']];
            if ($lockedFlow->flow_type === 'nodal') {
                $rules['nodal_graph'] = ['required', 'array', new ValidNodalGraph];
            }
            Validator::make($lockedFlow->only(['code', 'nodal_graph']), $rules)->validate();

            $latestVersion = $lockedFlow->versions()->max('version');
            $nextVersion = is_numeric($latestVersion) ? ((int) $latestVersion) + 1 : 1;
            $published = $lockedFlow->versions()->create([
                'version' => $nextVersion,
                'code' => $lockedFlow->code,
                'nodal_graph' => $lockedFlow->flow_type === 'nodal' ? $lockedFlow->nodal_graph : null,
                'flow_type' => $lockedFlow->flow_type,
                'published_by' => $request->user()?->id,
                'published_at' => now(),
            ]);
            $lockedFlow->update([
                'published_version_id' => $published->id,
                'is_published' => true,
            ]);

            return $published;
        }, 3);

        if ($request->expectsJson()) {
            return response()->json([
                'is_published' => true,
                'published_version' => $version->version,
                'published_at' => $version->published_at->toJSON(),
            ]);
        }

        return back()->with('success', "Flow published as version {$version->version}.");
    }

    public function unpublish(Request $request, Flow $flow): JsonResponse|RedirectResponse
    {
        $this->authorize(Ability::UPDATE->value, $flow);
        $flow->update(['is_published' => false]);

        if ($request->expectsJson()) {
            return response()->json(['is_published' => false]);
        }

        return back()->with('success', 'Flow unpublished.');
    }

    public function saveInput(Request $request, Flow $flow): RedirectResponse
    {
        $this->authorize(Ability::VIEW->value, $flow);
        $request->validate(['input' => 'nullable|array']);
        $user = $request->user();
        if (! $user instanceof User) {
            abort(401);
        }
        FlowUserInput::updateOrCreate(
            ['flow_id' => $flow->id, 'user_id' => $user->id],
            ['input' => $request->input('input') ?: null],
        );

        return back();
    }

    public function updateLibrary(Request $request, Flow $flow): RedirectResponse
    {
        $this->authorize(Ability::UPDATE->value, $flow);
        $user = $request->user();
        abort_unless($user instanceof User, 401);
        abort_unless($flow->library_namespace && $flow->library_reference, 404);
        $item = $this->catalog->findChild(
            'flow',
            $flow->library_namespace,
            $flow->library_reference,
            refresh: true,
            workspaceId: $flow->workspace_id,
            userId: $request->user()?->id,
            catalogKey: $flow->library_external_key,
        );
        if (! $item instanceof LibraryFlowItem) {
            abort(404, 'Library source not found.');
        }
        $blueprint = $this->catalog->findParentBlueprint(
            $flow->library_namespace,
            $flow->library_external_key,
            $flow->workspace_id,
            $request->user()?->id,
        );
        $currentInputs = is_array($flow->default_inputs) ? $flow->default_inputs : [];
        // Without a schema, inputs are free-form: merge instead of dropping user values.
        $defaultInputs = $item->inputDefinitions === []
            ? array_replace($item->defaultInputs, $currentInputs)
            : $this->inputSchemas->reconcile(
                $this->inputSchemas->currentDefinitions($flow, $item),
                $item->inputDefinitions,
                $currentInputs,
            );
        abort_unless($blueprint instanceof LibraryBlueprint, 404, 'Library blueprint not found.');
        DB::transaction(function () use ($flow, $item, $blueprint, $user, $defaultInputs, $request): void {
            $lockedFlow = Flow::query()->whereKey($flow->id)->lockForUpdate()->firstOrFail();
            $snippetRewrites = $this->snippetDependencies->ensureForResource(
                $blueprint,
                $item->code,
                $item->nodalGraph,
                $lockedFlow->workspace_id,
                $user,
                (string) $lockedFlow->owner_id,
                $lockedFlow->visibility,
                $lockedFlow->team_id,
                is_numeric($lockedFlow->library_external_id) ? (int) $lockedFlow->library_external_id : null,
            );
            $code = $this->snippetReferences->code($item->code ?? '', $snippetRewrites);
            $nodalGraph = $item->flowType === 'nodal'
                ? $this->snippetReferences->graph($item->nodalGraph, $snippetRewrites)
                : null;
            $this->snippetReferences->assertKnownReferencesResolved(
                $code,
                $nodalGraph,
                $blueprint->snippets,
            );
            $lockedFlow->update([
                'code' => $code,
                'source_type' => 'library',
                'flow_type' => $item->flowType,
                'nodal_graph' => $nodalGraph,
                'default_inputs' => $defaultInputs ?: null,
                'blueprint_input_definitions' => $item->inputDefinitions,
                'library_source_path' => $item->sourcePath ?: $lockedFlow->library_source_path,
                'library_source_sha' => $item->sourceSha ?: $lockedFlow->library_source_sha,
                'library_source_url' => $item->sourceUrl ?: $lockedFlow->library_source_url,
                'library_imported_at' => now(),
            ]);
            if (! $lockedFlow->is_published) {
                return;
            }

            $latestVersion = $lockedFlow->versions()->max('version');
            $nextVersion = is_numeric($latestVersion) ? ((int) $latestVersion) + 1 : 1;
            $published = $lockedFlow->versions()->create([
                'version' => $nextVersion,
                'code' => $lockedFlow->code,
                'nodal_graph' => $lockedFlow->flow_type === 'nodal' ? $lockedFlow->nodal_graph : null,
                'flow_type' => $lockedFlow->flow_type,
                'published_by' => $request->user()?->id,
                'published_at' => now(),
            ]);
            $lockedFlow->update(['published_version_id' => $published->id]);
        }, 3);
        $this->appearance->apply($flow->fresh() ?? $flow, $blueprint);

        return back()->with('success', 'Flow updated to the latest library version.');
    }

    public function checkLibrary(Request $request, Flow $flow): JsonResponse
    {
        $this->authorize(Ability::VIEW->value, $flow);
        abort_unless($flow->library_namespace && $flow->library_reference, 404);
        $item = $this->editor->libraryState($flow, true);
        $schemaDiff = $item instanceof LibraryFlowItem
            ? $this->inputSchemas->diff(
                $this->inputSchemas->currentDefinitions($flow, $item),
                $item->inputDefinitions,
            )
            : ['added' => [], 'removed' => [], 'type_changed' => [], 'has_changes' => false];

        return response()->json([
            'library_latest_source_sha' => $flow->library_latest_source_sha,
            'library_update_available' => $flow->library_update_available,
            'input_schema_diff' => $schemaDiff,
        ]);
    }

    public function clearCookies(Flow $flow): RedirectResponse
    {
        $this->authorize(Ability::UPDATE->value, $flow);
        $this->cookies->clear($flow);

        return back()->with('success', 'Cookies cleared.');
    }

    private function ensureCurrent(Request $request, Flow $flow): void
    {
        if ($request->boolean('force_current_version')) {
            return;
        }
        $value = $request->input('client_updated_at');
        if (! is_string($value) || $value === '') {
            return;
        }
        try {
            $client = Carbon::parse($value);
        } catch (\Throwable) {
            return;
        }
        $server = $flow->content_updated_at ?? $flow->updated_at;
        if ($server && $server->gt($client)) {
            throw ValidationException::withMessages([
                'client_updated_at' => 'This flow was updated by someone else. Refresh the latest version or force-save yours.',
            ]);
        }
    }
}
