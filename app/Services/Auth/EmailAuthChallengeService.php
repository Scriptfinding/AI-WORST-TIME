<?php

namespace App\Services\Auth;

use App\Mail\EmailAuthCode;
use App\Models\EmailAuthChallenge;
use App\Support\IdentityEmail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class EmailAuthChallengeService
{
    public const EXPIRES_IN_MINUTES = 10;

    public const MAX_ATTEMPTS = 5;

    /** @param array<string, mixed> $context */
    public function issue(string $email, string $intent, array $context, ?string $ipAddress): EmailAuthChallenge
    {
        $email = IdentityEmail::normalize($email);
        $emailRateKey = 'email-auth:send:'.hash('sha256', $email);
        $ipRateKey = 'email-auth:send-ip:'.hash('sha256', (string) $ipAddress);

        if (RateLimiter::tooManyAttempts($emailRateKey, 5)
            || RateLimiter::tooManyAttempts($ipRateKey, 20)) {
            $retryAfter = max(
                RateLimiter::availableIn($emailRateKey),
                RateLimiter::availableIn($ipRateKey),
            );

            throw ValidationException::withMessages([
                'email' => $this->retryMessage($retryAfter),
            ]);
        }

        $latest = EmailAuthChallenge::query()
            ->where('email', $email)
            ->latest('last_sent_at')
            ->first();

        $resendAfter = $this->resendAfterSeconds();
        if ($latest?->last_sent_at?->greaterThan(now()->subSeconds($resendAfter))) {
            $retryAfter = max(1, $latest->last_sent_at->addSeconds($resendAfter)->getTimestamp() - now()->getTimestamp());

            throw ValidationException::withMessages([
                'email' => $this->retryMessage($retryAfter),
            ]);
        }

        RateLimiter::hit($emailRateKey, 600);
        RateLimiter::hit($ipRateKey, 600);

        $pin = (string) random_int(100000, 999999);
        $token = Str::random(64);

        $challenge = DB::transaction(function () use ($email, $intent, $context, $ipAddress, $pin, $token) {
            EmailAuthChallenge::query()
                ->where('email', $email)
                ->whereNull('consumed_at')
                ->update(['consumed_at' => now()]);

            return EmailAuthChallenge::create([
                'email' => $email,
                'intent' => $intent,
                'context' => $context,
                'pin_hash' => $this->digest($pin),
                'token_hash' => $this->digest($token),
                'ip_address' => $ipAddress,
                'expires_at' => now()->addMinutes(self::EXPIRES_IN_MINUTES),
                'last_sent_at' => now(),
            ]);
        });

        try {
            Mail::to($email)->send(new EmailAuthCode(
                pin: $pin,
                magicUrl: route('email-auth.magic', ['challenge' => $challenge->id, 'token' => $token]),
                expiresInMinutes: self::EXPIRES_IN_MINUTES,
            ));
        } catch (Throwable $exception) {
            $challenge->forceFill(['consumed_at' => now()])->save();
            throw $exception;
        }

        return $challenge;
    }

    /**
     * Issue a single-use login link without sending any mail. Used by the
     * admin API to hand off an already-verified user (e.g. demo signup on
     * the landing site) into an authenticated session.
     *
     * @param  array<string, mixed>  $context
     * @return array{0: EmailAuthChallenge, 1: string} The challenge and its magic URL.
     */
    public function issueLink(string $email, array $context = []): array
    {
        $email = IdentityEmail::normalize($email);
        $token = Str::random(64);

        $challenge = DB::transaction(function () use ($email, $token, $context) {
            EmailAuthChallenge::query()
                ->where('email', $email)
                ->whereNull('consumed_at')
                ->update(['consumed_at' => now()]);

            return EmailAuthChallenge::create([
                'email' => $email,
                'intent' => 'login',
                'context' => [...$context, 'remember' => true],
                // The PIN flow is unused for API-issued links; store an
                // unguessable digest so it can never be brute-forced.
                'pin_hash' => $this->digest(Str::random(64)),
                'token_hash' => $this->digest($token),
                'ip_address' => null,
                'expires_at' => now()->addMinutes(self::EXPIRES_IN_MINUTES),
                'last_sent_at' => now(),
            ]);
        });

        return [
            $challenge,
            route('email-auth.magic', ['challenge' => $challenge->id, 'token' => $token]),
        ];
    }

    public function consumePin(EmailAuthChallenge $challenge, string $pin): EmailAuthChallenge
    {
        return $this->consume($challenge, $this->digest($pin), 'pin_hash');
    }

    public function consumeToken(EmailAuthChallenge $challenge, string $token): EmailAuthChallenge
    {
        return $this->consume($challenge, $this->digest($token), 'token_hash');
    }

    private function consume(EmailAuthChallenge $challenge, string $digest, string $column): EmailAuthChallenge
    {
        /** @var array{status: 'expired'|'invalid'}|array{status: 'valid', challenge: EmailAuthChallenge} $result */
        $result = DB::transaction(function () use ($challenge, $digest, $column): array {
            $locked = EmailAuthChallenge::query()
                ->lockForUpdate()
                ->whereKey($challenge->getKey())
                ->first();

            if (! $locked || $locked->consumed_at || $locked->expires_at->isPast()) {
                return ['status' => 'expired'];
            }

            if ($locked->attempts >= self::MAX_ATTEMPTS) {
                $locked->forceFill(['consumed_at' => now()])->save();

                return ['status' => 'expired'];
            }

            if (! hash_equals($locked->{$column}, $digest)) {
                $attempts = $locked->attempts + 1;
                $locked->forceFill([
                    'attempts' => $attempts,
                    'consumed_at' => $attempts >= self::MAX_ATTEMPTS ? now() : null,
                ])->save();

                return ['status' => 'invalid'];
            }

            $locked->forceFill(['consumed_at' => now()])->save();

            return ['status' => 'valid', 'challenge' => $locked];
        });

        if ($result['status'] === 'expired') {
            throw ValidationException::withMessages([
                'code' => 'This code has expired. Request a new one.',
            ]);
        }

        if ($result['status'] === 'invalid') {
            throw ValidationException::withMessages([
                'code' => 'The code is incorrect.',
            ]);
        }

        return $result['challenge'];
    }

    public function resendAfterSeconds(): int
    {
        $seconds = config('auth.magic_link.resend_seconds', 60);

        return max(1, is_numeric($seconds) ? (int) $seconds : 60);
    }

    private function digest(string $value): string
    {
        $key = config('app.key');

        return hash_hmac('sha256', $value, is_string($key) ? $key : '');
    }

    private function retryMessage(int $seconds): string
    {
        $seconds = max(1, $seconds);

        return "Too many code requests. Try again in {$seconds} ".($seconds === 1 ? 'second.' : 'seconds.');
    }
}
