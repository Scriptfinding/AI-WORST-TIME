import { DATA_TYPE_ICONS } from '@/Shared/Utils/dataTypeIcons';
import type { DataTableColumnType } from './types';

export const COLUMN_TYPE_OPTIONS = [
    { value: 'string', label: 'String', icon: DATA_TYPE_ICONS.string },
    { value: 'number', label: 'Number', icon: DATA_TYPE_ICONS.number },
    { value: 'boolean', label: 'Boolean', icon: DATA_TYPE_ICONS.boolean },
    { value: 'datetime', label: 'Datetime', icon: DATA_TYPE_ICONS.dateTime },
] satisfies Array<{ value: DataTableColumnType; label: string; icon: string }>;

export const columnTypeIcon = (type: DataTableColumnType): string => (
    type === 'datetime' ? DATA_TYPE_ICONS.dateTime : DATA_TYPE_ICONS[type]
);
