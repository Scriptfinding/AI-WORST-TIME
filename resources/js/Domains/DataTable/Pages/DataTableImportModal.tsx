import { useEffect, useMemo, useState } from 'react';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import TextFileImportInput from '@/Shared/UI/TextFileImportInput/TextFileImportInput';
import type { DataTableCellValue, DataTableColumn } from '../types';
import { parseDataTableImport } from './utils/dataTableImport';
import * as S from './styled';

interface Props {
    isOpen: boolean;
    tableName: string;
    columns: DataTableColumn[];
    submitting: boolean;
    apiError: string;
    onClose: () => void;
    onClearError: () => void;
    onImport: (rows: Array<Record<string, DataTableCellValue>>) => Promise<void>;
}

const previewValue = (value: DataTableCellValue) => {
    if (value === null) return 'NULL';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value);
};

export default function DataTableImportModal({
    isOpen,
    tableName,
    columns,
    submitting,
    apiError,
    onClose,
    onClearError,
    onImport,
}: Props) {
    const [raw, setRaw] = useState('');
    const [fileName, setFileName] = useState<string | null>(null);
    const [showEditor, setShowEditor] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setRaw('');
        setFileName(null);
        setShowEditor(false);
    }, [isOpen]);

    const parsed = useMemo(
        () => parseDataTableImport(raw, fileName, columns),
        [columns, fileName, raw],
    );
    const hasErrors = parsed.errors.length > 0;
    const canSubmit = parsed.rows.length > 0 && !hasErrors;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Import Rows"
            caption={tableName}
            width="700px"
        >
            <S.ModalForm
                onSubmit={event => {
                    event.preventDefault();
                    if (canSubmit) void onImport(parsed.rows);
                }}
            >
                <TextFileImportInput
                    raw={raw}
                    fileName={fileName}
                    showEditor={showEditor}
                    accept=".csv,.json,.xml,.txt,text/csv,application/json,application/xml,text/xml,text/plain"
                    title="Drop a CSV, JSON or XML file here"
                    hint="or click to choose a text file. The format is detected automatically."
                    placeholder={'name,active,created\nExample,true,2026-08-28T10:00:00Z'}
                    hasFileError={Boolean(apiError) && !raw.trim()}
                    hasContentError={hasErrors}
                    onSourceChange={(content, name) => {
                        setRaw(content);
                        setFileName(name);
                        onClearError();
                    }}
                    onEditorToggle={setShowEditor}
                />

                {raw.trim() && (
                    <S.ImportSummary>
                        <S.ImportSummaryText>
                            <strong>{parsed.totalRows}</strong>
                            {' '}
                            row{parsed.totalRows === 1 ? '' : 's'}
                            {hasErrors ? ' detected' : ' ready to append'}
                        </S.ImportSummaryText>
                        {parsed.format && <S.ImportFormat>{parsed.format.toUpperCase()}</S.ImportFormat>}
                    </S.ImportSummary>
                )}

                {parsed.rows.length > 0 && (
                    <S.ImportPreviewWrap>
                        <S.ImportPreview>
                            <thead>
                                <tr>
                                    {columns.map(column => <th key={String(column.id)}>{column.name}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {parsed.rows.slice(0, 5).map((row, index) => (
                                    <tr key={index}>
                                        {columns.map(column => {
                                            const value = row[String(column.id)] ?? null;
                                            return (
                                                <td
                                                    key={String(column.id)}
                                                    data-null={value === null ? 'true' : undefined}
                                                >
                                                    {previewValue(value)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </S.ImportPreview>
                        {parsed.rows.length > 5 && (
                            <S.ImportPreviewMore>
                                Previewing 5 of {parsed.rows.length} rows
                            </S.ImportPreviewMore>
                        )}
                    </S.ImportPreviewWrap>
                )}

                {hasErrors && (
                    <S.ImportErrors role="alert">
                        {parsed.errors.slice(0, 8).map((message, index) => (
                            <div key={`${index}:${message}`}>{message}</div>
                        ))}
                        {parsed.errors.length > 8 && (
                            <div>{parsed.errors.length - 8} more errors</div>
                        )}
                    </S.ImportErrors>
                )}
                {apiError && <S.ErrorBanner role="alert">{apiError}</S.ErrorBanner>}

                <S.ModalActions>
                    <Button size="sm" type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button size="sm" type="submit" loading={submitting} disabled={!canSubmit}>
                        Import {parsed.rows.length > 0 ? parsed.rows.length : ''}
                    </Button>
                </S.ModalActions>
            </S.ModalForm>
        </Modal>
    );
}
