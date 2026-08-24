<?php

namespace App\Services\Storage;

use App\Models\FlowRun;
use App\Models\FlowRunArtifact;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;

class ArtifactResponseFactory
{
    public function __construct(
        private readonly RunArtifactQueryService $artifactQueries,
        private readonly RunArtifactPathResolver $artifactPaths,
    ) {}

    /** @var array<string, list<string>> */
    private const INLINE_RASTER_EXTENSIONS = [
        'image/jpeg' => ['jpg', 'jpeg'],
        'image/png' => ['png'],
        'image/gif' => ['gif'],
        'image/webp' => ['webp'],
    ];

    public function make(string $path, string $type, string $filename): BinaryFileResponse
    {
        $downloadName = basename($filename);
        $mimeType = $this->verifiedRasterMimeType($path, $downloadName);

        if ($type === 'screenshots' && $mimeType !== null) {
            return response()->file($path, [
                'Content-Type' => $mimeType,
                'X-Content-Type-Options' => 'nosniff',
            ]);
        }

        return response()->download(
            $path,
            $downloadName,
            ['X-Content-Type-Options' => 'nosniff'],
        );
    }

    public function makeForRun(FlowRun $run, string $type, string $filename): ?Response
    {
        $artifact = $this->artifactQueries->artifact($run, $type, $filename);
        if ($artifact instanceof FlowRunArtifact) {
            return $this->makeStored($artifact, $type, $filename);
        }

        $path = $this->artifactQueries->artifactAbsolutePath($run, $type, $filename);

        return $path === null ? null : $this->make($path, $type, $filename);
    }

    public function makeRecording(FlowRun $run, bool $lastshot = false): ?Response
    {
        $artifact = $lastshot
            ? $this->artifactQueries->recordingLastshotArtifact($run)
            : $this->artifactQueries->recordingArtifact($run);
        $filename = $lastshot ? 'lastshot.jpg' : 'recording.mp4';
        $mimeType = $lastshot ? 'image/jpeg' : 'video/mp4';

        if ($artifact instanceof FlowRunArtifact) {
            return $this->makeStored($artifact, 'recording', $filename, $mimeType);
        }

        $exists = $lastshot
            ? $this->artifactQueries->recordingLastshotExists($run)
            : $this->artifactQueries->recordingExists($run);
        if (! $exists) {
            return null;
        }

        $path = $lastshot
            ? $this->artifactPaths->absoluteRecordingLastshotPath($run, false)
            : $this->artifactPaths->absoluteRecordingPath($run, false);

        return response()->file($path, [
            'Content-Type' => $mimeType,
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function makeStored(
        FlowRunArtifact $artifact,
        string $type,
        string $filename,
        ?string $forcedInlineMimeType = null,
    ): ?Response {
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk($artifact->disk);
        if (! $disk->exists($artifact->storage_path)) {
            return null;
        }
        $diskConfig = config("filesystems.disks.{$artifact->disk}");
        $driver = is_array($diskConfig) ? ($diskConfig['driver'] ?? null) : null;
        $downloadName = basename($filename);

        if ($driver === 'local') {
            $path = $disk->path($artifact->storage_path);
            if ($forcedInlineMimeType !== null) {
                return response()->file($path, [
                    'Content-Type' => $forcedInlineMimeType,
                    'X-Content-Type-Options' => 'nosniff',
                ]);
            }

            return $this->make($path, $type, $downloadName);
        }

        $inlineMimeType = $forcedInlineMimeType
            ?? $this->storedRasterMimeType($artifact, $type, $downloadName);
        $disposition = $inlineMimeType === null ? 'attachment' : 'inline';
        $options = [
            'ResponseContentDisposition' => $disposition.'; filename="'.$this->escapeHeaderFilename($downloadName).'"',
        ];
        if ($inlineMimeType !== null) {
            $options['ResponseContentType'] = $inlineMimeType;
        }

        return redirect()->away(
            $disk->temporaryUrl($artifact->storage_path, now()->addMinutes(5), $options),
        );
    }

    private function storedRasterMimeType(
        FlowRunArtifact $artifact,
        string $type,
        string $filename,
    ): ?string {
        if ($type !== 'screenshots' || ! is_string($artifact->mime_type)) {
            return null;
        }

        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $allowedExtensions = self::INLINE_RASTER_EXTENSIONS[$artifact->mime_type] ?? [];

        return in_array($extension, $allowedExtensions, true) ? $artifact->mime_type : null;
    }

    private function escapeHeaderFilename(string $filename): string
    {
        return str_replace(['\\', '"', "\r", "\n"], ['_', "'", '', ''], $filename);
    }

    private function verifiedRasterMimeType(string $path, string $filename): ?string
    {
        if (! is_file($path)) {
            return null;
        }

        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        if ($extension === '') {
            return null;
        }

        $mimeType = (new \finfo(FILEINFO_MIME_TYPE))->file($path);
        if (! is_string($mimeType)) {
            return null;
        }

        $allowedExtensions = self::INLINE_RASTER_EXTENSIONS[$mimeType] ?? [];

        return in_array($extension, $allowedExtensions, true) ? $mimeType : null;
    }
}
