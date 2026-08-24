<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\FlowRun;
use App\Services\Runtime\RunnerSignalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class RunnerSignalController extends Controller
{
    public function __construct(
        private readonly RunnerSignalService $signals,
    ) {}

    public function declareWaiting(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'wait_id' => ['required', 'uuid'],
            'validation_message' => ['nullable', 'string', 'max:10000'],
        ]);
        $result = $this->signals->declareWaiting(
            $this->runner($request),
            $validated['wait_id'],
            $validated['validation_message'] ?? null,
        );

        if ($result !== RunnerSignalService::RESULT_ACCEPTED) {
            return response()->json(['message' => 'A different wait generation is already active.'], 409);
        }

        return response()->json([
            'wait_id' => $validated['wait_id'],
            'waiting' => true,
        ]);
    }

    public function consumeContinuation(Request $request): JsonResponse|Response
    {
        $validated = $request->validate([
            'wait_id' => ['required', 'uuid'],
        ]);
        $result = $this->signals->consumeContinuation(
            $this->runner($request),
            $validated['wait_id'],
        );

        return match ($result) {
            RunnerSignalService::RESULT_PENDING => response()->noContent(),
            RunnerSignalService::RESULT_CONTINUED => response()->json(['continued' => true]),
            default => response()->json(['message' => 'Wait generation is no longer active.'], 409),
        };
    }

    public function clearWaiting(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'wait_id' => ['required', 'uuid'],
        ]);
        $cleared = $this->signals->clearWaiting(
            $this->runner($request),
            $validated['wait_id'],
        );

        return response()->json(['cleared' => $cleared]);
    }

    private function runner(Request $request): FlowRun
    {
        $run = $request->attributes->get('runner');
        abort_unless($run instanceof FlowRun, 401);

        return $run;
    }
}
