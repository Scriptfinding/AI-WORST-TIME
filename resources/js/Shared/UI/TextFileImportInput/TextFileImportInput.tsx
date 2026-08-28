import { useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Switch from '@/Shared/UI/Switch/Switch';
import * as S from './styled';

interface Props {
    raw: string;
    fileName: string | null;
    showEditor: boolean;
    accept: string;
    title: string;
    hint: string;
    placeholder: string;
    hasFileError?: boolean;
    hasContentError?: boolean;
    onSourceChange: (raw: string, fileName: string | null) => void;
    onEditorToggle: (showEditor: boolean) => void;
}

export default function TextFileImportInput({
    raw,
    fileName,
    showEditor,
    accept,
    title,
    hint,
    placeholder,
    hasFileError = false,
    hasContentError = false,
    onSourceChange,
    onEditorToggle,
}: Props) {
    const [dragging, setDragging] = useState(false);

    const readFile = async (file: File) => {
        onSourceChange(await file.text(), file.name);
    };

    const handleDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files[0];
        if (file) await readFile(file);
    };

    return (
        <>
            {!showEditor && (
                <S.DropZone
                    $dragging={dragging}
                    $hasError={hasFileError}
                    onDragOver={event => {
                        event.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                >
                    <Icon icon="lucide:upload-cloud" width={24} />
                    <S.DropTitle>{fileName || title}</S.DropTitle>
                    <S.DropHint>{hint}</S.DropHint>
                    <S.HiddenFileInput
                        type="file"
                        accept={accept}
                        onChange={event => {
                            const file = event.target.files?.[0];
                            if (file) void readFile(file);
                            event.target.value = '';
                        }}
                    />
                </S.DropZone>
            )}

            <S.EditorToggle>
                <Switch
                    checked={showEditor}
                    onChange={onEditorToggle}
                    label="Paste or edit the content manually"
                />
            </S.EditorToggle>

            {showEditor && (
                <S.Editor
                    value={raw}
                    onChange={event => onSourceChange(event.target.value, null)}
                    $hasError={hasContentError}
                    placeholder={placeholder}
                />
            )}
        </>
    );
}
