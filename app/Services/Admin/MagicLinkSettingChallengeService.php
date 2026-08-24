<?php

namespace App\Services\Admin;

use App\Mail\MagicLinkSettingCode;
use App\Models\EmailAuthChallenge;
use App\Models\User;
use App\Services\Auth\EmailAuthChallengeService;
use App\Support\IdentityEmail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class MagicLinkSettingChallengeService
{
    public const INTENT = 'server_setting';

    public function __construct(
        private readonly EmailAuthChallengeService $challenges,
    ) {}

    public function issue(User $admin, ?string $ipAddress): EmailAuthChallenge
    {
        $email = IdentityEmail::normalize($admin->email);
        $emailRateKey = 'magic-link-setting:send:'.hash('sha256', $email);
        $ipRateKey = 'magic-link-setting:send-ip:'.hash('sha256', (string) $ipAddress);

        if (RateLimiter::tooManyAttempts($emailRateKey, 5)
            || RateLimiter::tooManyAttempts($ipRateKey, 20)) {
            $retryAfter = max(
                RateLimiter::availableIn($emailRateKey),
                RateLimiter::availableIn($ipRateKey),
            );

            throw ValidationException::withMessages([
                'code' => $this->retryMessage($retryAfter),
            ]);
        }

        $latest = EmailAuthChallenge::query()
            ->where('email', $email)
            ->where('intent', self::INTENT)
            ->latest('last_sent_at')
            ->first();
        $resendAfter = $this->challenges->resendAfterSeconds();

        if ($latest?->last_sent_at?->greaterThan(now()->subSeconds($resendAfter))) {
            if (! $latest->consumed_at
                && $latest->expires_at->isFuture()
                && data_get($latest->context, 'user_id') === $admin->getKey()) {
                return $latest;
            }

            $retryAfter = max(
                1,
                (int) $latest->last_sent_at->addSeconds($resendAfter)->timestamp - (int) now()->timestamp,
            );
            throw ValidationException::withMessages(['code' => $this->retryMessage($retryAfter)]);
        }

        RateLimiter::hit($emailRateKey, 600);
        RateLimiter::hit($ipRateKey, 600);

        $pin = (string) random_int(100000, 999999);
        $challenge = DB::transaction(function () use ($admin, $email, $ipAddress, $pin) {
            EmailAuthChallenge::query()
                ->where('email', $email)
                ->where('intent', self::INTENT)
                ->whereNull('consumed_at')
                ->update(['consumed_at' => now()]);

            return EmailAuthChallenge::create([
                'email' => $email,
                'intent' => self::INTENT,
                'context' => [
                    'user_id' => $admin->getKey(),
                    'setting' => 'magic_link_enabled',
                ],
                'pin_hash' => $this->digest($pin),
                'token_hash' => $this->digest(Str::random(64)),
                'ip_address' => $ipAddress,
                'expires_at' => now()->addMinutes(EmailAuthChallengeService::EXPIRES_IN_MINUTES),
                'last_sent_at' => now(),
            ]);
        });

        try {
            Mail::to($email)->send(new MagicLinkSettingCode(
                pin: $pin,
                expiresInMinutes: EmailAuthChallengeService::EXPIRES_IN_MINUTES,
            ));
        } catch (Throwable $exception) {
            $challenge->forceFill(['consumed_at' => now()])->save();
            throw $exception;
        }

        return $challenge;
    }

    public function consume(string $challengeId, string $pin, User $admin): EmailAuthChallenge
    {
        $challenge = EmailAuthChallenge::query()
            ->whereKey($challengeId)
            ->where('intent', self::INTENT)
            ->where('email', IdentityEmail::normalize($admin->email))
            ->first();

        if (! $challenge
            || data_get($challenge->context, 'user_id') !== $admin->getKey()
            || data_get($challenge->context, 'setting') !== 'magic_link_enabled') {
            throw ValidationException::withMessages([
                'code' => 'This code is invalid or has expired.',
            ]);
        }

        return $this->challenges->consumePin($challenge, $pin);
    }

    public function resendAfterSeconds(): int
    {
        return $this->challenges->resendAfterSeconds();
    }

    private function digest(string $value): string
    {
        $key = config('app.key');

        return hash_hmac(
            'sha256',
            $value,
            is_scalar($key) || is_resource($key) || $key === null ? strval($key) : '',
        );
    }

    private function retryMessage(int $seconds): string
    {
        $seconds = max(1, $seconds);

        return "Please wait {$seconds} ".($seconds === 1 ? 'second' : 'seconds').' before requesting another code.';
    }
}
