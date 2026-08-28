<?php

namespace App\Enums;

enum DataTableColumnType: string
{
    case STRING = 'string';
    case NUMBER = 'number';
    case BOOLEAN = 'boolean';
    case DATETIME = 'datetime';
}
