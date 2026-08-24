<?php

namespace App\Services\Storage;

final class StoragePathSharder
{
    public static function split(int|string $id): string
    {
        $value = (string) $id;
        $separator = strpos($value, '_');
        if ($separator !== false) {
            $value = substr($value, $separator + 1);
        }

        return implode('/', str_split($value));
    }
}
