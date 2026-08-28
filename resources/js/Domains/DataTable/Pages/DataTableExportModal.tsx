import { useEffect, useState } from 'react';
import Button from '@/Shared/UI/Button/Button';
import Select from '@/Shared/UI/Input/Select';
import Modal from '@/Shared/UI/Modal/Modal';
import type { DataTableExportFormat, DataTableExportScope } from '../types';
import * as S from './styled';

interface Props {
    isOpen: boolean;
    tableName: string;
    totalRows: number;
    filteredRows: number;
    selectedRows: number;
    hasFilters: boolean;
    submitting: boolean;
    onClose: () => void;
    onExport: (format: DataTableExportFormat, scope: DataTableExportScope) => Promise<void>;
}

const FORMAT_OPTIONS = [
    { value: 'csv', label: 'CSV (.csv)' },
    { value: 'json', label: 'JSON (.json)' },
    { value: 'xml', label: 'XML (.xml)' },
];

export default function DataTableExportModal({
    isOpen,
    tableName,
    totalRows,
    filteredRows,
    selectedRows,
    hasFilters,
    submitting,
    onClose,
    onExport,
}: Props) {
    const [format, setFormat] = useState<DataTableExportFormat>('csv');
    const [scope, setScope] = useState<DataTableExportScope>('all');

    useEffect(() => {
        if (!isOpen) return;
        setFormat('csv');
        setScope(hasFilters ? 'filtered' : 'all');
    }, [hasFilters, isOpen]);

    const scopeOptions = [
        { value: 'all', label: `All rows (${totalRows})` },
        { value: 'filtered', label: `Filtered rows (${hasFilters ? filteredRows : totalRows})` },
        { value: 'selected', label: `Selected rows (${selectedRows})` },
    ];
    const selectedScopeIsEmpty = scope === 'selected' && selectedRows === 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Export Table"
            caption={tableName}
            width="420px"
        >
            <S.ModalForm
                onSubmit={event => {
                    event.preventDefault();
                    if (!selectedScopeIsEmpty) void onExport(format, scope);
                }}
            >
                <S.ExportIntro>
                    Choose the file format and which rows to include. Column filters are applied
                    when exporting filtered rows.
                </S.ExportIntro>
                <Select
                    label="Format"
                    value={format}
                    options={FORMAT_OPTIONS}
                    onChange={event => setFormat(event.target.value as DataTableExportFormat)}
                />
                <Select
                    label="Rows"
                    value={scope}
                    options={scopeOptions}
                    onChange={event => setScope(event.target.value as DataTableExportScope)}
                />
                {selectedScopeIsEmpty && (
                    <S.ExportHint>Select at least one row before using this export scope.</S.ExportHint>
                )}
                <S.ModalActions>
                    <Button size="sm" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button
                        size="sm"
                        type="submit"
                        loading={submitting}
                        disabled={selectedScopeIsEmpty}
                    >
                        Export {format.toUpperCase()}
                    </Button>
                </S.ModalActions>
            </S.ModalForm>
        </Modal>
    );
}
