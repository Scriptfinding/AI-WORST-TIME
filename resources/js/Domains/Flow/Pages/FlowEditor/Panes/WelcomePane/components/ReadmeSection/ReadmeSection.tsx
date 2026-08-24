import { useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import ReactMarkdown from 'react-markdown';
import Button from '@/Shared/UI/Button/Button';
import { useSyncedState } from '@/Shared/Hooks/useSyncedState';
import * as S from './styled';

interface ReadmeSectionProps {
    readme?: string | null;
    canEdit: boolean;
    onSave: (data: Record<string, string | null>) => void;
}

export default function ReadmeSection({ readme, canEdit, onSave }: ReadmeSectionProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useSyncedState(readme || '');

    const commit = () => {
        setEditing(false);
        const value = draft.trim();
        if (value !== (readme || '')) {
            onSave({ readme: value || null });
        }
    };

    return (
        <S.ReadmeSection>
            <S.ReadmeHeader>
                <S.ReadmeTitle>
                    <Icon icon="lucide:file-text" width={12} height={12} />
                    Readme
                </S.ReadmeTitle>
                {canEdit && !editing && (
                    <S.ReadmeEditBtn onClick={() => setEditing(true)}>
                        <Icon icon="lucide:pencil" />
                        Edit
                    </S.ReadmeEditBtn>
                )}
            </S.ReadmeHeader>

            {editing ? (
                <S.ReadmeEditor>
                    <S.ReadmeTextarea
                        value={draft}
                        onChange={event => setDraft(event.target.value)}
                        placeholder="Write documentation in Markdown..."
                        autoFocus
                    />
                    <S.ReadmeActions>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                setEditing(false);
                                setDraft(readme || '');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" size="sm" onClick={commit}>
                            Save
                        </Button>
                    </S.ReadmeActions>
                </S.ReadmeEditor>
            ) : readme ? (
                <S.MarkdownBody>
                    <ReactMarkdown>{readme}</ReactMarkdown>
                </S.MarkdownBody>
            ) : canEdit ? (
                <S.ReadmeEmpty onClick={() => setEditing(true)}>
                    <Icon icon="lucide:plus" /><br />
                    Add documentation for this flow
                </S.ReadmeEmpty>
            ) : (
                <S.EmptyText>No documentation yet.</S.EmptyText>
            )}
        </S.ReadmeSection>
    );
}
