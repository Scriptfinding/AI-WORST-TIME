import { useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Switch from '@/Shared/UI/Switch/Switch';
import * as S from './styled';

interface SourceInputProps {
    raw: string;
    fileName: string | null;
    showEditor: boolean;
    hasDropError: boolean;
    hasParseError: boolean;
    onSourceChange: (raw: string, fileName: string | null) => void;
    onEditorToggle: (showEditor: boolean) => void;
}

export default function SourceInput({
    raw,
    fileName,
    showEditor,
    hasDropError,
    hasParseError,
    onSourceChange,
    onEditorToggle,
}: SourceInputProps) {
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
                    $hasError={hasDropError}
                    onDragOver={event => {
                        event.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                >
                    <Icon icon="lucide:upload-cloud" width={24} />
                    <S.DropTitle>{fileName || 'Drop a JSON, .env or config file here'}</S.DropTitle>
                    <S.DropHint>or click to choose a file. JSON objects and KEY=value files are detected automatically.</S.DropHint>
                    <S.HiddenFileInput
                        type="file"
                        accept=".json,.env,.txt,.config,text/plain,application/json"
                        onChange={event => {
                            const file = event.target.files?.[0];
                            if (file) void readFile(file);
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
                    $hasError={hasParseError}
                    placeholder={'API_KEY=123\n!STRIPE_SECRET=sk_live_...\n\nor\n\n{\n  "API_URL": "https://example.com",\n  "!TOKEN": "secret"\n}'}
                />
            )}
        </>
    );
}
