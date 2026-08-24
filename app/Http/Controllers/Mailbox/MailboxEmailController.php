<?php

namespace App\Http\Controllers\Mailbox;

use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Models\Mailbox;
use App\Models\MailboxEmail;
use App\Services\FeatureFlags\FeatureFlagService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class MailboxEmailController extends Controller
{
    public function index(Request $request, Mailbox $mailbox): JsonResponse
    {
        $this->features()->abortIfDisabled('mailbox_enabled');
        $this->features()->abortIfStale($mailbox);
        $this->authorizeMailbox($mailbox, Ability::USE);

        $search = $request->query('search', '');
        $perPage = min(max($request->integer('per_page', 30), 1), 100);

        $query = MailboxEmail::where('mailbox_id', $mailbox->id)
            ->select([
                'id',
                'mailbox_id',
                'from_address',
                'sender_authentication',
                'to_address',
                'subject',
                'date',
                'raw_size',
                'received_at',
                'is_read',
                'delivery_status',
            ])
            ->orderByDesc('received_at');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $pattern = "%{$search}%";
                $q->whereRaw('LOWER(from_address) LIKE LOWER(?)', [$pattern])
                    ->orWhereRaw('LOWER(subject) LIKE LOWER(?)', [$pattern])
                    ->orWhereRaw('LOWER(to_address) LIKE LOWER(?)', [$pattern]);
            });
        }

        $emails = $query->paginate($perPage);

        return response()->json($emails);
    }

    public function show(Request $request, MailboxEmail $email): JsonResponse
    {
        $this->features()->abortIfDisabled('mailbox_enabled');
        $email->load('mailbox');
        $mailbox = $this->mailboxFor($email);
        $this->features()->abortIfStale($mailbox);
        $this->authorizeMailbox($mailbox, Ability::USE);

        return response()->json($email);
    }

    public function markRead(Request $request, MailboxEmail $email): JsonResponse
    {
        $this->features()->abortIfDisabled('mailbox_enabled');
        $email->load('mailbox');
        $mailbox = $this->mailboxFor($email);
        $this->features()->abortIfStale($mailbox);
        $this->authorizeMailbox($mailbox, Ability::USE);

        $email->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }

    public function markUnread(Request $request, MailboxEmail $email): JsonResponse
    {
        $this->features()->abortIfDisabled('mailbox_enabled');
        $email->load('mailbox');
        $mailbox = $this->mailboxFor($email);
        $this->features()->abortIfStale($mailbox);
        $this->authorizeMailbox($mailbox, Ability::USE);

        $email->update(['is_read' => false]);

        return response()->json(['success' => true]);
    }

    public function destroy(Request $request, MailboxEmail $email): JsonResponse
    {
        $email->load('mailbox');
        $mailbox = $this->mailboxFor($email);
        $this->authorizeMailbox($mailbox, Ability::UPDATE);

        $email->delete();

        return response()->json(['success' => true]);
    }

    private function mailboxFor(MailboxEmail $email): Mailbox
    {
        $mailbox = $email->getRelation('mailbox');
        abort_unless($mailbox instanceof Mailbox, 404);

        return $mailbox;
    }

    private function authorizeMailbox(Mailbox $mailbox, Ability $ability): void
    {
        $currentWorkspaceId = $this->workspaceIdFromSession();
        abort_unless($mailbox->workspace_id === $currentWorkspaceId, 404);
        Gate::authorize($ability->value, $mailbox);
    }

    private function features(): FeatureFlagService
    {
        return app(FeatureFlagService::class);
    }
}
