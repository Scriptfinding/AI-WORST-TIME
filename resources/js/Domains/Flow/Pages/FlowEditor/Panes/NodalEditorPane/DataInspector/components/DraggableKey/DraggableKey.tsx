import * as S from './styled';

interface DraggableKeyProps {
    label: string;
    path: string;
}

export default function DraggableKey({ label, path }: DraggableKeyProps) {
    return (
        <S.JsonKey
            data-inspector-key
            draggable
            onDragStart={event => {
                event.dataTransfer.setData('text/plain', path);
                event.dataTransfer.effectAllowed = 'copy';
            }}
        >
            {label}
        </S.JsonKey>
    );
}
