<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ApiKeyController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $plainKey = 'pk_'.Str::random(48);
        $keyPreview = substr($plainKey, 0, 3).'...'.substr($plainKey, -3);

        /** @var User $user */
        $user = $request->user();
        $apiKey = $user->apiKeys()->create([
            'name' => $validated['name'],
            'key' => hash('sha256', $plainKey),
            'key_preview' => $keyPreview,
        ]);

        return back()->with('success', 'API key created.')->with('new_api_key', $plainKey);
    }

    public function destroy(Request $request, ApiKey $apiKey): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        if ($apiKey->user_id !== $user->id) {
            abort(403);
        }

        $apiKey->delete();

        return back()->with('success', 'API key deleted.');
    }
}
