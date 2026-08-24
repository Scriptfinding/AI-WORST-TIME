<?php

namespace App\Exceptions;

use Illuminate\Http\Request;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;

final class InstanceStorageQuotaExceededException extends RuntimeException
{
    public function __construct(
        public readonly int $usedBytes,
        public readonly int $requestedBytes,
        public readonly int $limitBytes,
    ) {
        parent::__construct('Instance storage quota exceeded. Delete stored files or request more storage.');
    }

    public function render(Request $request): Response
    {
        if ($request->expectsJson()) {
            return response()->json(['message' => $this->getMessage()], 422);
        }

        return redirect()->back()->withErrors(['storage' => $this->getMessage()]);
    }
}
