<?php

namespace App\Models;

use App\Enums\DataTableColumnType;
use App\Models\Concerns\HasStringId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $data_table_id
 * @property string $name
 * @property DataTableColumnType $type
 * @property int $position
 * @property-read DataTable|null $dataTable
 */
class DataTableColumn extends Model
{
    use HasStringId;

    public const ID_PREFIX = 'dcol';

    protected $fillable = ['data_table_id', 'name', 'type', 'position'];

    protected function casts(): array
    {
        return [
            'type' => DataTableColumnType::class,
            'position' => 'integer',
        ];
    }

    /** @return BelongsTo<DataTable, $this> */
    public function dataTable(): BelongsTo
    {
        return $this->belongsTo(DataTable::class);
    }
}
