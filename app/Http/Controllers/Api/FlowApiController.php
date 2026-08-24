<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesFlow;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Flow\FlowRunnerService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FlowApiController extends Controller
{
    use ResolvesFlow;

    public function __construct(
        private FlowRunnerService $runner
    ) {}

    public function trigger(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $flow = $this->resolveFlow($id, $user);

        if (! $flow) {
            return response()->json(['error' => 'Flow not found.'], 404);
        }

        if (! $this->canAccessFlow($user, $flow)) {
            return response()->json(['error' => 'Forbidden.'], 403);
        }

        $input = $request->json()->all();

        try {
            $run = $this->runner->dispatch($flow, $user, $input, 'api');
        } catch (AuthorizationException $e) {
            return response()->json(
                ['error' => $e->getMessage()],
                $e->status() ?? 403,
            );
        }

        return response()->json([
            'run_id' => $run->id,
            'flow_id' => $flow->id,
            'status' => $run->status,
        ], 202);
    }
}
