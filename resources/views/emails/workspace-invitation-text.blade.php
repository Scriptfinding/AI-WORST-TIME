Join {{ $invitation->workspace->name }} on {{ app(\App\Contracts\BrandingProvider::class)->current()['name'] }}

{{ $invitation->inviter->name }} invited you to collaborate in this workspace.

Accept the invitation:
{{ url('/register?invitation='.$invitation->token) }}

This invitation is intended only for {{ $invitation->email }} and expires in 7 days.
