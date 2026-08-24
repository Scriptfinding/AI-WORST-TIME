<?php

namespace App\Services\Auth;

use App\Models\RegistrationRequest;
use App\Support\IdentityEmail;
use Carbon\CarbonInterface;
use Illuminate\Validation\ValidationException;

final class RegistrationRequestSubmissionService
{
    public function submit(
        string $name,
        string $email,
        string $origin,
        ?string $password = null,
        ?CarbonInterface $emailVerifiedAt = null,
        ?RegistrationRequest $existing = null,
    ): RegistrationRequest {
        if (! in_array($origin, [
            RegistrationRequest::ORIGIN_PASSWORD,
            RegistrationRequest::ORIGIN_EMAIL,
            RegistrationRequest::ORIGIN_SSO,
        ], true)) {
            throw new \InvalidArgumentException("Unsupported registration request origin [{$origin}].");
        }

        $email = IdentityEmail::normalize($email);
        $request = $existing ?? RegistrationRequest::query()->where('email', $email)->first();

        if ($request !== null
            && $request->origin !== $origin
            && in_array(RegistrationRequest::ORIGIN_SSO, [$request->origin, $origin], true)) {
            throw ValidationException::withMessages([
                'email' => 'A pending registration request already exists for this email.',
            ]);
        }

        $request ??= new RegistrationRequest;
        $request->fill([
            'name' => trim($name),
            'email' => $email,
            'password' => $password,
            'email_verified_at' => $emailVerifiedAt,
            'origin' => $origin,
        ])->save();

        return $request->refresh();
    }
}
