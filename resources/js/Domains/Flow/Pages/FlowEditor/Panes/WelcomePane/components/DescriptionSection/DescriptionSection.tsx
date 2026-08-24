import { useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useFocusWhen } from '@/Shared/Hooks/useFocusWhen';
import { useSyncedState } from '@/Shared/Hooks/useSyncedState';
import * as S from './styled';

interface DescriptionSectionProps {
    description?: string | null;
    canEdit: boolean;
    onSave: (data: Record<string, string | null>) => void;
}

export default function DescriptionSection({
    description,
    canEdit,
    onSave,
}: DescriptionSectionProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useSyncedState(description || '');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useFocusWhen({ ref: inputRef, when: editing });

    const commit = () => {
        setEditing(false);
        const value = draft.trim();
        if (value !== (description || '')) {
            onSave({ description: value || null });
        }
    };

    return (
        <S.DescriptionSection>
            <S.SectionLabel>
                <Icon icon="lucide:text" width={12} height={12} />
                Description
            </S.SectionLabel>
            <S.DescriptionBlock>
                {editing ? (
                    <S.InlineTextarea
                        ref={inputRef}
                        value={draft}
                        onChange={event => setDraft(event.target.value)}
                        onBlur={commit}
                        onKeyDown={event => {
                            if (event.key === 'Escape') {
                                setEditing(false);
                                setDraft(description || '');
                            }
                        }}
                        rows={2}
                        placeholder="Short description..."
                    />
                ) : description ? (
                    <>
                        <S.DescriptionText>{description}</S.DescriptionText>
                        {canEdit && (
                            <S.EditIcon onClick={() => setEditing(true)} title="Edit description">
                                <Icon icon="lucide:pencil" />
                            </S.EditIcon>
                        )}
                    </>
                ) : canEdit ? (
                    <S.EmptyText onClick={() => setEditing(true)}>
                        Add a description...
                    </S.EmptyText>
                ) : null}
            </S.DescriptionBlock>
        </S.DescriptionSection>
    );
}
