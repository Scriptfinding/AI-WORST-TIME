<?php

namespace App\Services\Flow;

use App\Models\Flow;
use App\Services\Storage\UploadStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

final class FlowIconService
{
    public function __construct(private readonly UploadStorage $uploads) {}

    public function update(Flow $flow, UploadedFile $file): void
    {
        $oldPath = is_string($flow->icon_upload_path) ? $flow->icon_upload_path : null;
        $filename = $this->uploads->storeRasterImage($file, $flow->iconUploadDir());
        try {
            DB::transaction(function () use ($flow, $filename): void {
                if (! $flow->update([
                    'icon_type' => 'upload',
                    'icon_value' => null,
                    'icon_upload_path' => $filename,
                ])) {
                    throw new \RuntimeException('Unable to update flow icon.');
                }
            });
        } catch (\Throwable $exception) {
            $persisted = true;
            try {
                $persisted = Flow::whereKey($flow->getKey())->where('icon_upload_path', $filename)->exists();
            } catch (\Throwable $verification) {
                report($verification);
            }
            if (! $persisted) {
                try {
                    $this->uploads->delete($filename);
                } catch (\Throwable $cleanup) {
                    report($cleanup);
                }
            }
            throw $exception;
        }
        $this->deleteFile($oldPath !== $filename ? $oldPath : null);
    }

    public function remove(Flow $flow): void
    {
        $oldPath = is_string($flow->icon_upload_path) ? $flow->icon_upload_path : null;
        $flow->update([
            'icon_type' => 'emoji',
            'icon_value' => null,
            'icon_color' => null,
            'icon_upload_path' => null,
        ]);
        $this->deleteFile($oldPath);
    }

    private function deleteFile(?string $path): void
    {
        if ($path === null) {
            return;
        }
        try {
            $this->uploads->delete($path);
        } catch (\Throwable $exception) {
            report($exception);
        }
    }
}
