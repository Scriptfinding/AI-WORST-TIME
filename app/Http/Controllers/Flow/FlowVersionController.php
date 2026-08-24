<?php

namespace App\Http\Controllers\Flow;

use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Models\FlowVersion;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class FlowVersionController extends Controller
{
    public function index(Flow $flow): JsonResponse
    {
        $this->authorizeFlowAccess($flow);

        $versions = $flow->versions()
            ->with('publisher:id,name')
            ->latest('version')
            ->get()
            ->map(fn (FlowVersion $version): array => $this->metadata($version));

        return response()->json([
            'current_version_id' => $flow->published_version_id,
            'versions' => $versions,
        ]);
    }

    public function show(Flow $flow, FlowVersion $flowVersion): JsonResponse
    {
        $this->authorizeFlowAccess($flow);
        $this->assertVersionBelongsToFlow($flow, $flowVersion);
        $flowVersion->load('publisher:id,name');

        return response()->json([
            ...$this->metadata($flowVersion),
            'code' => $flowVersion->code,
            'nodal_graph' => $flowVersion->nodal_graph,
        ]);
    }

    public function restore(Request $request, Flow $flow, FlowVersion $flowVersion): JsonResponse
    {
        $this->authorizeFlowAccess($flow, Ability::UPDATE);
        $this->assertVersionBelongsToFlow($flow, $flowVersion);
        abort_if(
            $flow->source_type !== 'code',
            423,
            'Duplicate externally managed flows before restoring a historical version.',
        );
        $request->validate(['client_updated_at' => 'sometimes|nullable|string']);

        $flow = DB::transaction(function () use ($flow, $flowVersion, $request): Flow {
            $lockedFlow = Flow::query()->whereKey($flow->id)->lockForUpdate()->firstOrFail();
            $this->ensureDraftCurrent($request, $lockedFlow);
            $lockedFlow->update([
                'code' => $flowVersion->code,
                'nodal_graph' => $flowVersion->flow_type === 'nodal' ? $flowVersion->nodal_graph : null,
                'flow_type' => $flowVersion->flow_type,
            ]);

            return $lockedFlow;
        }, 3);

        return response()->json([
            'restored_version' => $flowVersion->version,
            'content_updated_at' => $flow->content_updated_at?->toJSON(),
        ]);
    }

    public function publish(Flow $flow, FlowVersion $flowVersion): JsonResponse
    {
        $this->authorizeFlowAccess($flow, Ability::UPDATE);
        $this->assertVersionBelongsToFlow($flow, $flowVersion);

        DB::transaction(function () use ($flow, $flowVersion): void {
            $lockedFlow = Flow::query()->whereKey($flow->id)->lockForUpdate()->firstOrFail();
            $lockedFlow->update([
                'published_version_id' => $flowVersion->id,
                'is_published' => true,
            ]);
        }, 3);

        return response()->json([
            'is_published' => true,
            'published_version_id' => $flowVersion->id,
            'published_version' => $flowVersion->version,
        ]);
    }

    private function authorizeFlowAccess(Flow $flow, Ability $ability = Ability::VIEW): void
    {
        $currentWorkspaceId = $this->workspaceIdFromSession();
        abort_unless($flow->workspace_id === $currentWorkspaceId, 404);
        $this->authorize($ability->value, $flow);
    }

    private function assertVersionBelongsToFlow(Flow $flow, FlowVersion $flowVersion): void
    {
        abort_unless($flowVersion->flow_id === $flow->id, 404);
    }

    private function ensureDraftCurrent(Request $request, Flow $flow): void
    {
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
                'client_updated_at' => 'The draft was updated by someone else. Reload the flow before restoring a version.',
            ]);
        }
    }

    /** @return array<string, mixed> */
    private function metadata(FlowVersion $version): array
    {
        $publisher = $version->publisher;

        return [
            'id' => $version->id,
            'version' => $version->version,
            'flow_type' => $version->flow_type,
            'published_at' => $version->published_at->toJSON(),
            'publisher' => $publisher instanceof User
                ? ['id' => $publisher->id, 'name' => $publisher->name]
                : null,
        ];
    }
}
