<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoredUpload extends Model
{
    public const STATUS_READY = 'ready';

    protected $fillable = [
        'path',
        'storage_path',
        'disk',
        'size_bytes',
        'mime_type',
        'checksum_sha256',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
        ];
    }
}
