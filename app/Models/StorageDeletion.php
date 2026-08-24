<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StorageDeletion extends Model
{
    protected $table = 'storage_deletions';

    protected $fillable = [
        'disk',
        'storage_path',
        'attempts',
        'last_error',
    ];

    protected function casts(): array
    {
        return [
            'attempts' => 'integer',
        ];
    }
}
