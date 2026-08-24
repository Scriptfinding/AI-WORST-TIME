<?php

namespace App\Models\Concerns;

use Illuminate\Support\Str;

trait HasStringId
{
    public function initializeHasStringId(): void
    {
        $this->incrementing = false;
        $this->keyType = 'string';
    }

    public static function bootHasStringId(): void
    {
        static::creating(function ($model): void {
            $model->id ??= static::generateId();
        });
    }

    public static function generateId(): string
    {
        do {
            $id = static::ID_PREFIX.'_'.Str::random(12);
        } while (static::query()->whereKey($id)->exists());

        return $id;
    }
}
