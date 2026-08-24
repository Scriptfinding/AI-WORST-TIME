import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './styled';

interface Props {
    fileName: string | null;
    hasError: boolean;
    dragging: boolean;
    onFile: (file: File) => Promise<void>;
    onDraggingChange: (dragging: boolean) => void;
}

export default function SourceInput({ fileName, hasError, dragging, onFile, onDraggingChange }: Props) {
    const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        onDraggingChange(false);
        const file = event.dataTransfer.files[0];
        if (file) void onFile(file);
    };

    return (
        <S.DropZone
            $dragging={dragging}
            $hasError={hasError}
            onDragOver={event => {
                event.preventDefault();
                onDraggingChange(true);
            }}
            onDragLeave={() => onDraggingChange(false)}
            onDrop={handleDrop}
        >
            <Icon icon="lucide:upload-cloud" width={24} />
            <S.DropTitle>{fileName || 'Drop a JavaScript or nodal JSON snippet here'}</S.DropTitle>
            <S.DropHint>or click to choose a file. The filename is used as the default reference.</S.DropHint>
            <S.HiddenFileInput
                type="file"
                accept=".js,.mjs,.json,.txt,text/javascript,application/javascript,application/json,text/plain"
                onChange={event => {
                    const file = event.target.files?.[0];
                    if (file) void onFile(file);
                }}
            />
        </S.DropZone>
    );
}
