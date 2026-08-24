<?php

namespace App\Services\Storage;

use App\Jobs\DeleteStoredFiles;
use App\Models\StorageDeletion;
use App\Models\StoredUpload;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class UploadStorage
{
    /** @var array<string, string> */
    private const RASTER_EXTENSIONS = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
    ];

    public function __construct(
        private readonly InstanceStorageQuotaService $quota,
    ) {}

    public function storeRasterImage(UploadedFile $file, string $directory): string
    {
        $mimeType = $file->getMimeType();
        $extension = is_string($mimeType) ? self::RASTER_EXTENSIONS[$mimeType] ?? null : null;

        if ($extension === null) {
            throw new \InvalidArgumentException('Uploaded image must be JPEG, PNG, GIF, or WebP.');
        }

        return $this->store($file, $directory, bin2hex(random_bytes(20)).'.'.$extension);
    }

    public function store(UploadedFile $file, string $directory, string $filename): string
    {
        $directory = $this->normalizePath($directory);
        $filename = $this->normalizeFilename($filename);
        $path = $directory.'/'.$filename;
        $diskName = $this->selectedDiskName();
        $disk = $this->disk($diskName);
        $storagePath = $this->storagePath($path);
        $sourcePath = $file->getRealPath();
        $sourceSize = filesize($sourcePath);
        $sourceChecksum = hash_file('sha256', $sourcePath);
        $stream = fopen($sourcePath, 'rb');
        if (! is_int($sourceSize) || ! is_string($sourceChecksum)) {
            throw new \RuntimeException('Unable to inspect uploaded file.');
        }
        if (! is_resource($stream)) {
            throw new \RuntimeException('Unable to open uploaded file.');
        }

        try {
            $this->quota->admit(
                fn (): int => $sourceSize - $this->readySize($path),
                function () use ($disk, $storagePath, $stream, $file, $path, $diskName, $sourceSize, $sourceChecksum): void {
                    $disk->put($storagePath, $stream, ['mimetype' => $file->getMimeType()]);
                    $this->persistVerified(
                        $path,
                        $diskName,
                        $storagePath,
                        $file->getMimeType(),
                        $sourceSize,
                        $sourceChecksum,
                    );
                },
            );
        } finally {
            fclose($stream);
        }

        return $path;
    }

    public function put(
        string $contents,
        string $directory,
        string $filename,
        ?string $mimeType = null,
    ): string {
        $directory = $this->normalizePath($directory);
        $filename = $this->normalizeFilename($filename);
        $path = $directory.'/'.$filename;
        $diskName = $this->selectedDiskName();
        $storagePath = $this->storagePath($path);
        $options = $mimeType === null ? [] : ['mimetype' => $mimeType];

        $contentSize = strlen($contents);
        $this->quota->admit(
            fn (): int => $contentSize - $this->readySize($path),
            function () use ($diskName, $storagePath, $contents, $options, $path, $mimeType, $contentSize): void {
                $this->disk($diskName)->put($storagePath, $contents, $options);
                $this->persistVerified(
                    $path,
                    $diskName,
                    $storagePath,
                    $mimeType,
                    $contentSize,
                    hash('sha256', $contents),
                );
            },
        );

        return $path;
    }

    public function contents(string $path): ?string
    {
        $upload = $this->find($path);
        if ($upload === null) {
            return null;
        }

        $contents = $this->disk($upload->disk)->get($upload->storage_path);

        return is_string($contents) ? $contents : null;
    }

    public function exists(string $path): bool
    {
        $upload = $this->find($path);

        return $upload !== null && $this->disk($upload->disk)->exists($upload->storage_path);
    }

    public function delete(string $path): void
    {
        $path = $this->normalizePath($path);
        $upload = StoredUpload::query()->where('path', $path)->first();
        if ($upload === null) {
            return;
        }

        $ids = DB::transaction(function () use ($upload): array {
            $id = $this->stageDeletion($upload->disk, $upload->storage_path);
            $upload->delete();

            return [$id];
        });
        $this->dispatchDeletions($ids);
    }

    public function deleteDirectory(string $path): void
    {
        $path = $this->normalizePath($path);
        $uploads = StoredUpload::query()
            ->where(fn ($query) => $query->where('path', $path)->orWhere('path', 'like', $path.'/%'))
            ->get();
        if ($uploads->isEmpty()) {
            return;
        }

        $ids = DB::transaction(function () use ($uploads): array {
            $ids = [];
            foreach ($uploads as $upload) {
                $ids[] = $this->stageDeletion($upload->disk, $upload->storage_path);
                $upload->delete();
            }

            return $ids;
        });
        $this->dispatchDeletions($ids);
    }

    public function copy(string $source, string $destination): void
    {
        $source = $this->find($source);
        if ($source === null) {
            throw new \RuntimeException('Uploaded source file is not indexed.');
        }
        $destination = $this->normalizePath($destination);
        $targetDiskName = $this->selectedDiskName();
        $targetDisk = $this->disk($targetDiskName);
        $targetPath = $this->storagePath($destination);
        $stream = $this->disk($source->disk)->readStream($source->storage_path);
        if (! is_resource($stream)) {
            throw new \RuntimeException('Unable to read uploaded source file.');
        }
        try {
            $this->quota->admit(
                fn (): int => $source->size_bytes - $this->readySize($destination),
                function () use ($targetDisk, $targetPath, $stream, $destination, $targetDiskName, $source): void {
                    $targetDisk->put($targetPath, $stream);
                    $this->persistVerified(
                        $destination,
                        $targetDiskName,
                        $targetPath,
                        $source->mime_type,
                        $source->size_bytes,
                        $source->checksum_sha256,
                    );
                },
            );
        } finally {
            fclose($stream);
        }
    }

    public function url(string $path, ?int $version = null): string
    {
        $url = '/uploads/'.$this->normalizePath($path);

        return $version === null ? $url : $url.'?v='.$version;
    }

    public function find(string $path): ?StoredUpload
    {
        try {
            $path = $this->normalizePath($path);
        } catch (\InvalidArgumentException) {
            return null;
        }

        return StoredUpload::query()
            ->where('path', $path)
            ->where('status', StoredUpload::STATUS_READY)
            ->first();
    }

    public function indexLocal(string $path, string $diskName = 'puppetflow-local'): ?StoredUpload
    {
        $path = $this->normalizePath($path);
        $storagePath = $this->storagePath($path);
        $disk = $this->disk($diskName);
        if (! $disk->exists($storagePath)) {
            return null;
        }

        $size = $disk->size($storagePath);

        return $this->quota->admit(
            fn (): int => $size - $this->readySize($path),
            fn (): StoredUpload => $this->persistVerified($path, $diskName, $storagePath),
        );
    }

    public function localSourceExists(string $path): bool
    {
        $path = $this->normalizePath($path);

        return $this->disk('puppetflow-local')->exists($this->storagePath($path));
    }

    public function migrate(StoredUpload $upload, string $targetDiskName, bool $deleteSource = true): void
    {
        if ($upload->disk === $targetDiskName) {
            return;
        }

        Cache::lock(
            StorageLocationLock::name($targetDiskName, $upload->storage_path),
            300,
        )->block(
            30,
            fn () => $this->migrateLocked($upload, $targetDiskName, $deleteSource),
        );
    }

    private function migrateLocked(
        StoredUpload $upload,
        string $targetDiskName,
        bool $deleteSource,
    ): void {
        $sourceDisk = $this->disk($upload->disk);
        $targetDisk = $this->disk($targetDiskName);
        $stream = $sourceDisk->readStream($upload->storage_path);
        if (! is_resource($stream)) {
            throw new \RuntimeException("Unable to read upload {$upload->path}.");
        }
        try {
            $targetDisk->put($upload->storage_path, $stream);
        } finally {
            fclose($stream);
        }
        $metadata = $this->verifiedMetadata($targetDisk, $upload->storage_path);
        if (
            $metadata['size_bytes'] !== $upload->size_bytes
            || ! hash_equals($upload->checksum_sha256, $metadata['checksum_sha256'])
        ) {
            $targetDisk->delete($upload->storage_path);
            throw new \RuntimeException("Upload {$upload->path} failed target storage verification.");
        }

        $sourceDiskName = $upload->disk;
        $ids = DB::transaction(function () use ($upload, $targetDiskName, $sourceDiskName, $deleteSource): array {
            $upload->update(['disk' => $targetDiskName]);

            return $deleteSource ? [$this->stageDeletion($sourceDiskName, $upload->storage_path)] : [];
        });
        $this->dispatchDeletions($ids);
    }

    public function normalizePath(string $path): string
    {
        if ($path === '' || str_contains($path, "\0") || str_starts_with($path, '/') || str_contains($path, '\\')) {
            throw new \InvalidArgumentException('Upload path must be a non-empty relative path.');
        }

        $segments = explode('/', $path);
        foreach ($segments as $segment) {
            if ($segment === '' || $segment === '.' || $segment === '..') {
                throw new \InvalidArgumentException('Upload path contains an invalid segment.');
            }
        }

        return implode('/', $segments);
    }

    private function normalizeFilename(string $filename): string
    {
        if ($filename === '' || basename($filename) !== $filename || in_array($filename, ['.', '..'], true)) {
            throw new \InvalidArgumentException('Upload filename is invalid.');
        }

        return $filename;
    }

    private function selectedDiskName(): string
    {
        $disk = config('filesystems.puppetflow_storage_disk', 'puppetflow-local');

        if (! is_string($disk) || $disk === '') {
            throw new \UnexpectedValueException('Puppetflow storage disk must be a non-empty string.');
        }

        return $disk;
    }

    private function disk(string $disk): FilesystemAdapter
    {
        /** @var FilesystemAdapter $filesystem */
        $filesystem = Storage::disk($disk);

        return $filesystem;
    }

    private function storagePath(string $path): string
    {
        return 'uploads/'.$this->normalizePath($path);
    }

    private function persistVerified(
        string $path,
        string $diskName,
        string $storagePath,
        ?string $verifiedMimeType = null,
        ?int $expectedSize = null,
        ?string $expectedChecksum = null,
    ): StoredUpload {
        $disk = $this->disk($diskName);
        $metadata = $this->verifiedMetadata($disk, $storagePath);
        if (
            ($expectedSize !== null && $metadata['size_bytes'] !== $expectedSize)
            || (
                $expectedChecksum !== null
                && ! hash_equals($expectedChecksum, $metadata['checksum_sha256'])
            )
        ) {
            $disk->delete($storagePath);
            throw new \RuntimeException('Uploaded file failed durable storage verification.');
        }
        if ($verifiedMimeType !== null) {
            $metadata['mime_type'] = $verifiedMimeType;
        }
        $previous = StoredUpload::query()->where('path', $path)->first();

        try {
            [$upload, $ids] = DB::transaction(function () use (
                $path,
                $diskName,
                $storagePath,
                $metadata,
                $previous,
            ): array {
                $upload = StoredUpload::query()->updateOrCreate(['path' => $path], [
                    'storage_path' => $storagePath,
                    'disk' => $diskName,
                    'size_bytes' => $metadata['size_bytes'],
                    'mime_type' => $metadata['mime_type'],
                    'checksum_sha256' => $metadata['checksum_sha256'],
                    'status' => StoredUpload::STATUS_READY,
                ]);
                $ids = [];
                if (
                    $previous !== null
                    && ($previous->disk !== $diskName || $previous->storage_path !== $storagePath)
                ) {
                    $ids[] = $this->stageDeletion($previous->disk, $previous->storage_path);
                }

                return [$upload, $ids];
            });
        } catch (\Throwable $exception) {
            $this->disk($diskName)->delete($storagePath);
            throw $exception;
        }

        $this->dispatchDeletions($ids);

        return $upload;
    }

    private function readySize(string $path): int
    {
        $size = StoredUpload::query()
            ->where('path', $path)
            ->where('status', StoredUpload::STATUS_READY)
            ->value('size_bytes');

        return is_numeric($size) ? (int) $size : 0;
    }

    /** @return array{size_bytes: int, mime_type: string|null, checksum_sha256: string} */
    private function verifiedMetadata(FilesystemAdapter $disk, string $storagePath): array
    {
        if (! $disk->exists($storagePath)) {
            throw new \RuntimeException('Uploaded file is missing after storage write.');
        }
        $stream = $disk->readStream($storagePath);
        if (! is_resource($stream)) {
            throw new \RuntimeException('Unable to verify uploaded file.');
        }
        try {
            $hash = hash_init('sha256');
            hash_update_stream($hash, $stream);
            $checksum = hash_final($hash);
        } finally {
            fclose($stream);
        }

        $mimeType = $disk->mimeType($storagePath);

        return [
            'size_bytes' => $disk->size($storagePath),
            'mime_type' => is_string($mimeType) ? $mimeType : null,
            'checksum_sha256' => $checksum,
        ];
    }

    private function stageDeletion(string $disk, string $storagePath): int
    {
        return (int) StorageDeletion::query()->create([
            'disk' => $disk,
            'storage_path' => $storagePath,
        ])->id;
    }

    /** @param list<int> $ids */
    private function dispatchDeletions(array $ids): void
    {
        if ($ids === []) {
            return;
        }
        try {
            DeleteStoredFiles::dispatch($ids);
        } catch (\Throwable $exception) {
            report($exception);
        }
    }
}
