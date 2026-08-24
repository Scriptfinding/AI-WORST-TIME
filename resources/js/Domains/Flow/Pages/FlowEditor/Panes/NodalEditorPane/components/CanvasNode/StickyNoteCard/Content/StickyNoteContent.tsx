import ReactMarkdown from 'react-markdown';
import type { StickyNoteColor } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { linkifyRawUrls } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/CanvasNode/StickyNoteCard/utils';
import * as S from './styled';

interface StickyNoteContentProps {
    color: StickyNoteColor;
    content: string;
    customColor: string;
    editing: boolean;
    readOnly?: boolean;
    onChange: (content: string) => void;
    onStartEditing: () => void;
    onStopEditing: () => void;
}

export default function StickyNoteContent({
    color,
    content,
    customColor,
    editing,
    readOnly,
    onChange,
    onStartEditing,
    onStopEditing,
}: StickyNoteContentProps) {
    if (editing && !readOnly) {
        return (
            <S.Editor
                $color={color}
                $customColor={customColor}
                value={content}
                placeholder="Write markdown here."
                autoFocus
                onPointerDown={event => event.stopPropagation()}
                onWheel={event => event.stopPropagation()}
                onChange={event => onChange(event.target.value)}
                onBlur={onStopEditing}
                onKeyDown={event => {
                    if (event.key === 'Escape') event.currentTarget.blur();
                }}
            />
        );
    }

    return (
        <S.Body
            $color={color}
            $customColor={customColor}
            onDoubleClick={onStartEditing}
        >
            {content.trim()
                ? (
                    <ReactMarkdown
                        components={{
                            a: ({ children, ...props }) => (
                                <a
                                    {...props}
                                    target="_blank"
                                    rel="noreferrer"
                                    onPointerDown={event => event.stopPropagation()}
                                    onClick={event => event.stopPropagation()}
                                >
                                    {children}
                                </a>
                            ),
                        }}
                    >
                        {linkifyRawUrls(content)}
                    </ReactMarkdown>
                )
                : (
                    <S.Placeholder $color={color} $customColor={customColor}>
                        Double-click to write markdown.
                    </S.Placeholder>
                )}
        </S.Body>
    );
}
