<?php

namespace App\Listeners;

use App\Events\RegistrationRequestApproved;
use App\Models\SsoRegistrationRequest;
use App\Models\UserExternalIdentity;

final class LinkApprovedSsoRegistration
{
    public function handle(RegistrationRequestApproved $event): void
    {
        $pending = SsoRegistrationRequest::query()
            ->where('registration_request_id', $event->registrationRequest->id)
            ->first();

        if ($pending === null) {
            return;
        }

        UserExternalIdentity::query()->updateOrCreate(
            [
                'user_id' => $event->user->id,
                'identity_provider_id' => $pending->identity_provider_id,
            ],
            [
                'external_subject' => $pending->external_subject,
                'email_snapshot' => $event->user->email,
            ],
        );
    }
}
