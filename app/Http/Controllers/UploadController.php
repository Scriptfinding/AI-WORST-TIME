<?php

namespace App\Http\Controllers;

use App\Services\Storage\UploadStorage;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;

class UploadController extends Controller
{
    /** @var array<string, list<string>> */
    private const RASTER_EXTENSIONS = [
        'image/jpeg' => ['jpg', 'jpeg'],
        'image/png' => ['png'],
        'image/gif' => ['gif'],
        'image/webp' => ['webp'],
    ];

    public function __invoke(string $path, UploadStorage $uploads): Response|RedirectResponse
    {
        $upload = $uploads->find($path);
        abort_if($upload === null, 404);

        $extension = strtolower(pathinfo($upload->path, PATHINFO_EXTENSION));
        $mimeType = is_string($upload->mime_type) ? $upload->mime_type : '';
        abort_unless(in_array($extension, self::RASTER_EXTENSIONS[$mimeType] ?? [], true), 404);

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk($upload->disk);
        abort_unless($disk->exists($upload->storage_path), 404);
        $config = config("filesystems.disks.{$upload->disk}");

        if (is_array($config) && ($config['driver'] ?? null) === 'local') {
            return new BinaryFileResponse(
                $disk->path($upload->storage_path),
                200,
                [
                    'Content-Type' => $mimeType,
                    'X-Content-Type-Options' => 'nosniff',
                ],
            );
        }

        return redirect()->away($disk->temporaryUrl(
            $upload->storage_path,
            now()->addMinutes(5),
            [
                'ResponseContentType' => $mimeType,
                'ResponseContentDisposition' => 'inline',
            ],
        ));
    }
}
