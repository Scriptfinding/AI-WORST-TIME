<?php

namespace App\Http\Controllers\Integration\Repository;

use App\Events\Integration\Repository\RepositoryWebhookReceived;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RepositoryWebhookController extends Controller
{
    public function github(Request $request, string $webhookId): JsonResponse
    {
        return $this->handle('github', $webhookId, $request);
    }

    public function gitlab(Request $request, string $webhookId): JsonResponse
    {
        return $this->handle('gitlab', $webhookId, $request);
    }

    public function gitea(Request $request, string $webhookId): JsonResponse
    {
        return $this->handle('gitea', $webhookId, $request);
    }

    public function bitbucket(Request $request, string $webhookId): JsonResponse
    {
        return $this->handle('bitbucket', $webhookId, $request);
    }

    private function handle(string $provider, string $webhookId, Request $request): JsonResponse
    {
        $configuredMaxBytes = config('puppetflow.repository_webhook_max_payload_bytes', 10 * 1024 * 1024);
        $maxBytes = is_numeric($configuredMaxBytes) ? max(1024, (int) $configuredMaxBytes) : 10 * 1024 * 1024;
        abort_if(strlen($request->getContent()) > $maxBytes, 413, 'Webhook payload is too large.');

        $event = new RepositoryWebhookReceived($provider, $webhookId, $request);
        event($event);

        if (! $event->authenticated) {
            return response()->json(['status' => 'unauthorized'], 401);
        }

        if (! $event->validPayload) {
            return response()->json(['status' => 'invalid_payload'], 400);
        }

        return response()->json(['status' => 'ok', 'synced' => $event->synced]);
    }
}
