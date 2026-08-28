<?php

namespace App\Support;

use InvalidArgumentException;

final class DataTablePhysicalTableName
{
    private const PREFIX = 'pf_data_table_';

    public static function fromId(string $dataTableId): string
    {
        if (preg_match('/^dtbl_[A-Za-z0-9]{12}$/', $dataTableId) !== 1) {
            throw new InvalidArgumentException('The data table ID is invalid.');
        }

        return self::PREFIX.substr(hash('sha256', $dataTableId), 0, 40);
    }

    public static function assertValidIdentifier(string $identifier): void
    {
        if (preg_match('/^[A-Za-z][A-Za-z0-9_]{0,62}$/', $identifier) !== 1) {
            throw new InvalidArgumentException('The SQL identifier is invalid.');
        }
    }
}
