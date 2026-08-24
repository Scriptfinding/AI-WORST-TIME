<?php

namespace App\Http\Controllers\Flow;

use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Flow\FlowRepositoryLinkService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

final class FlowRepositoryLinkController extends Controller
{
    public function __construct(
        private readonly FlowRepositoryLinkService $links,
        private readonly FeatureFlagService $features,
    ) {}

    public function store(Request $request, Flow $flow): RedirectResponse
    {
        $this->features->abortIfDisabled('vcs_enabled');
        $this->authorize(Ability::UPDATE->value, $flow);
        /** @var array{integration_id: string, repo_full_name: string, branch: string, file_path: string, sync_trigger?: string} $validated */
        $validated = $request->validate([
            'integration_id' => [
                'required',
                'string',
                Rule::exists('integrations', 'id')->where('workspace_id', $flow->workspace_id),
            ],
            'repo_full_name' => 'required|string|max:500',
            'branch' => 'required|string|max:255',
            'file_path' => 'required|string|max:500',
            'sync_trigger' => 'sometimes|in:push,tag',
        ]);
        $this->links->save($flow, $validated);

        return back()->with('success', 'Repository linked and code synced.');
    }

    public function destroy(Request $request, Flow $flow): RedirectResponse
    {
        $this->authorize(Ability::UPDATE->value, $flow);
        $this->links->remove($flow);

        return back()->with('success', 'Repository link removed.');
    }
}
