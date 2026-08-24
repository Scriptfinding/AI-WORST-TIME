<?php

namespace App\Http\Controllers\Flow;

use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Services\Flow\FlowIconService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

final class FlowIconController extends Controller
{
    public function __construct(private readonly FlowIconService $icons) {}

    public function store(Request $request, Flow $flow): RedirectResponse
    {
        $this->authorize(Ability::UPDATE->value, $flow);
        $request->validate([
            'icon' => ['required', 'file', 'mimes:jpg,jpeg,png,gif,webp', 'max:2048'],
        ]);
        $file = $request->file('icon');
        if (! $file instanceof UploadedFile) {
            throw ValidationException::withMessages(['icon' => 'The uploaded icon is invalid.']);
        }
        $this->icons->update($flow, $file);

        return back()->with('success', 'Flow icon updated.');
    }

    public function destroy(Flow $flow): RedirectResponse
    {
        $this->authorize(Ability::UPDATE->value, $flow);
        $this->icons->remove($flow);

        return back()->with('success', 'Flow icon removed.');
    }
}
