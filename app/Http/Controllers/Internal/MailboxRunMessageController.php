<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\FlowRun;
use App\Services\Mailbox\MailboxRunQueueService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class MailboxRunMessageController extends Controller
{
    public function __construct(
        private readonly MailboxRunQueueService $messages,
    ) {}

    public function claim(Request $request): JsonResponse|Response
    {
        $validated = $request->validate([
            'watcher' => ['required', 'string', 'max:255'],
        ]);
        $run = $request->attributes->get('runner');

        if (! $run instanceof FlowRun || $run->getAttribute('status') !== 'running') {
            return response()->json(['message' => 'Mailbox run is no longer active.'], 409);
        }

        $claim = $this->messages->claim($run, $validated['watcher']);

        return $claim === null
            ? response()->noContent()
            : response()->json($claim);
    }

    public function renew(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message_id' => ['required', 'integer', 'min:1'],
            'claim_token' => ['required', 'string', 'size:64'],
        ]);
        $run = $request->attributes->get('runner');
        $leaseExpiresAt = $run instanceof FlowRun
            ? $this->messages->renewLease(
                $run,
                (int) $validated['message_id'],
                $validated['claim_token'],
            )
            : null;
        if (! $leaseExpiresAt instanceof \DateTimeInterface) {
            return response()->json(['message' => 'Mailbox message claim was not found.'], 404);
        }

        return response()->json([
            'lease_expires_at' => $leaseExpiresAt->format(DATE_ATOM),
        ]);
    }
}
