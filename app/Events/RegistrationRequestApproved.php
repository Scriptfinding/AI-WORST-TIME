<?php

namespace App\Events;

use App\Models\RegistrationRequest;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;

final class RegistrationRequestApproved
{
    use Dispatchable;

    public function __construct(
        public readonly RegistrationRequest $registrationRequest,
        public readonly User $user,
    ) {}
}
