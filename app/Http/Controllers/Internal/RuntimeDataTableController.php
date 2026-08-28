<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\FlowRun;
use App\Services\Runtime\DataTableRuntimeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class RuntimeDataTableController extends Controller
{
    public function __construct(private readonly DataTableRuntimeService $dataTables) {}

    public function read(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->dataTables->read($this->run($request), $this->payload($request)),
        ]);
    }

    public function write(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->dataTables->write($this->run($request), $this->payload($request)),
        ]);
    }

    public function schema(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->dataTables->schema($this->run($request), $this->payload($request)),
        ]);
    }

    private function run(Request $request): FlowRun
    {
        $run = $request->attributes->get('runner');
        abort_unless($run instanceof FlowRun, 401, 'Runner capability context is missing.');

        return $run;
    }

    /** @return array<string, mixed> */
    private function payload(Request $request): array
    {
        abort_if(strlen($request->getContent()) > 1_048_576, 413, 'The Data Table request body is too large.');
        $payload = $request->json()->all();
        abort_if(count($payload) > 20, 422, 'The Data Table request contains too many fields.');

        return $payload;
    }
}
