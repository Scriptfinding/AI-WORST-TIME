import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './styled';

interface Props {
    fileName: string | null;
    dragging: boolean;
    hasError: boolean;
    onDraggingChange: (dragging: boolean) => void;
    onFile: (file: File) => void | Promise<void>;
}

export default function SourceFileInput({
    fileName,
    dragging,
    hasError,
    onDraggingChange,
    onFile,
}: Props) {
    return (
        <S.DropZone
            $dragging={dragging}
            $hasError={hasError}
            onDragOver={event => {
                event.preventDefault();
                onDraggingChange(true);
            }}
            onDragLeave={() => onDraggingChange(false)}
            onDrop={event => {
                event.preventDefault();
                onDraggingChange(false);
                const file = event.dataTransfer.files[0];
                if (file) void onFile(file);
            }}
        >
            <Icon icon="lucide:upload-cloud" width={24} />
            <S.DropTitle>{fileName || 'Drop a JavaScript or JSON flow file here'}</S.DropTitle>
            <S.DropHint>or click to choose a file. JavaScript imports as raw code, JSON imports as Visual Builder graph.</S.DropHint>
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
