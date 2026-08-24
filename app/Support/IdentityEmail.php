<?php

namespace App\Support;

use Symfony\Component\String\UnicodeString;

final class IdentityEmail
{
    public static function normalize(mixed $value): string
    {
        return (new UnicodeString(trim(self::stringValue($value))))
            ->normalize()
            ->lower()
            ->toString();
    }

    private static function stringValue(mixed $value): string
    {
        if (is_scalar($value) || is_resource($value) || $value === null) {
            return strval($value);
        }

        return $value instanceof \Stringable ? (string) $value : '';
    }
}
