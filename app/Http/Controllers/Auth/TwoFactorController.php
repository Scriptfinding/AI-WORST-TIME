<?php

namespace App\Http\Controllers\Auth;

use App\Contracts\BrandingProvider;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Workspace;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorController extends Controller
{
    private const MAX_CHALLENGE_ATTEMPTS = 10;

    private function google2fa(): Google2FA
    {
        return new Google2FA;
    }

    // Authenticated: setup / enable / disable

    public function setup(Request $request): Response|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $recoveryCodes = session('recovery_codes');

        if ($user->hasTwoFactorEnabled()) {
            if (! is_array($recoveryCodes)) {
                return redirect()->route('profile');
            }

            return Inertia::render('Auth/TwoFactorSetup/TwoFactorSetup', [
                'qrSvg' => '',
                'secret' => '',
                'forced' => $request->boolean('forced'),
                'recoveryCodes' => $recoveryCodes,
            ]);
        }

        $g2fa = $this->google2fa();
        $secret = $g2fa->generateSecretKey();
        $user->forceFill(['two_factor_secret' => $secret])->save();

        $otpauthUrl = $g2fa->getQRCodeUrl(
            app(BrandingProvider::class)->current()['name'],
            $user->email,
            $secret,
        );

        $svg = $this->generateQrSvg($otpauthUrl);

        return Inertia::render('Auth/TwoFactorSetup/TwoFactorSetup', [
            'qrSvg' => $svg,
            'secret' => $secret,
            'forced' => $request->boolean('forced'),
            'recoveryCodes' => null,
        ]);
    }

    public function enable(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $g2fa = $this->google2fa();

        if (! $user->two_factor_secret) {
            return back()->withErrors(['code' => 'Please start the setup first.']);
        }

        $valid = $g2fa->verifyKey($user->two_factor_secret, $validated['code']);

        if (! $valid) {
            return back()->withErrors(['code' => 'Invalid verification code.']);
        }

        $recoveryCodes = Collection::times(8, fn () => Str::random(10))->all();

        $user->forceFill([
            'two_factor_confirmed_at' => now(),
            'two_factor_recovery_codes' => json_encode($recoveryCodes),
        ])->save();

        return back()
            ->with('success', 'Two-factor authentication enabled.')
            ->with('recovery_codes', $recoveryCodes);
    }

    public function disable(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string'],
        ]);

        /** @var User $user */
        $user = $request->user();

        if (! Hash::check($validated['password'], $user->getAuthPassword())) {
            return back()->withErrors(['password' => 'Incorrect password.']);
        }

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        return back()->with('success', 'Two-factor authentication disabled.');
    }

    // Guest: challenge after login

    public function challenge(Request $request): Response|\Illuminate\Http\RedirectResponse
    {
        if ($request->session()->get('login.two_factor_attempts', 0) >= self::MAX_CHALLENGE_ATTEMPTS) {
            $this->clearPendingLogin($request);

            return redirect()->route('login')->withErrors([
                'code' => 'Too many authentication attempts. Please sign in again.',
            ]);
        }

        if (! $request->session()->has('login.id')) {
            return redirect()->route('login');
        }

        return Inertia::render('Auth/TwoFactorChallenge/TwoFactorChallenge');
    }

    public function verify(Request $request): RedirectResponse|\Symfony\Component\HttpFoundation\Response
    {
        if ($request->session()->get('login.two_factor_attempts', 0) >= self::MAX_CHALLENGE_ATTEMPTS) {
            $this->clearPendingLogin($request);

            return redirect()->route('login')->withErrors([
                'code' => 'Too many authentication attempts. Please sign in again.',
            ]);
        }

        $validated = $request->validate([
            'code' => ['nullable', 'string'],
            'recovery_code' => ['nullable', 'string'],
        ]);

        $userId = $request->session()->get('login.id');
        $remember = $request->session()->get('login.remember', false) === true;
        $workspaceId = $request->session()->get('login.workspace_id');

        if (! $userId) {
            return redirect()->route('login');
        }

        $user = User::findOrFail($userId);
        abort_unless($user instanceof User, 404);

        if ($request->filled('recovery_code')) {
            $recoveryCode = $validated['recovery_code'] ?? null;
            abort_unless(is_string($recoveryCode), 422);
            $valid = $this->validateRecoveryCode($user, $recoveryCode);

            if (! $valid) {
                $this->recordFailedChallenge($request);

                return back()->withErrors(['recovery_code' => 'Invalid recovery code.']);
            }
        } else {
            if (! $request->filled('code')) {
                return back()->withErrors(['code' => 'Please enter a code.']);
            }

            $code = $validated['code'] ?? null;
            abort_unless(is_string($code), 422);
            /** @var string $secret */
            $secret = $user->two_factor_secret;
            $valid = $this->google2fa()->verifyKey(
                $secret,
                $code,
            );

            if (! $valid) {
                $this->recordFailedChallenge($request);

                return back()->withErrors(['code' => 'Invalid authentication code.']);
            }
        }

        $this->clearPendingLogin($request);

        Auth::login($user, $remember);
        $request->session()->regenerate();

        /** @var Workspace|null $workspace */
        $workspace = $workspaceId ? Workspace::find($workspaceId) : null;
        if ($workspace && ! $user->isAdmin() && ! $user->belongsToWorkspace($workspace)) {
            $workspace = null;
        }
        $workspace ??= $user->preferredWorkspace();
        if ($workspace) {
            session(['current_workspace_id' => $workspace->id]);
            $user->rememberWorkspace($workspace);
        }

        $intended = session()->pull('url.intended', route('dashboard'));
        $intended = is_string($intended) ? $intended : route('dashboard');

        if ($request->header('X-Inertia')) {
            return Inertia::location($intended);
        }

        return redirect()->to($intended);
    }

    // Helpers

    private function validateRecoveryCode(User $user, string $code): bool
    {
        $encodedCodes = $user->two_factor_recovery_codes;
        $decodedCodes = is_string($encodedCodes) ? json_decode($encodedCodes, true) : [];
        $codes = is_array($decodedCodes) ? array_values(array_filter($decodedCodes, 'is_string')) : [];

        $index = array_search($code, $codes);

        if ($index === false) {
            return false;
        }

        unset($codes[$index]);

        $user->forceFill([
            'two_factor_recovery_codes' => json_encode(array_values($codes)),
        ])->save();

        return true;
    }

    private function recordFailedChallenge(Request $request): void
    {
        $current = $request->session()->get('login.two_factor_attempts', 0);
        $attempts = is_numeric($current) ? (int) $current : 0;
        $request->session()->put('login.two_factor_attempts', $attempts + 1);
    }

    private function clearPendingLogin(Request $request): void
    {
        $request->session()->forget([
            'login.id',
            'login.remember',
            'login.workspace_id',
            'login.two_factor_attempts',
        ]);
    }

    private function generateQrSvg(string $url): string
    {
        $renderer = new ImageRenderer(
            new RendererStyle(192),
            new SvgImageBackEnd,
        );

        return (new Writer($renderer))->writeString($url);
    }
}
