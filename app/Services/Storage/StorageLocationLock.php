<?php

namespace App\Services\Storage;

final class StorageLocationLock
{
    public static function name(string $disk, string $path): string
    {
        return 'storage-location:'.hash('sha256', $disk."\0".$path);
    }
}
