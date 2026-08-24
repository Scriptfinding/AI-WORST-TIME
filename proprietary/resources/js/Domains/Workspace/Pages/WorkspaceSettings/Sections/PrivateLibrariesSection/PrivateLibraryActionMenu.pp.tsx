import { useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import { useActionMenuDismiss } from '@/Shared/Hooks/useActionMenuDismiss';
import type { PrivateLibrary } from '@proprietary/Domains/Workspace/Pages/WorkspaceSettings/Sections/PrivateLibrariesSection/types.pp';
import * as S from '@proprietary/Domains/Workspace/Pages/WorkspaceSettings/Sections/PrivateLibrariesSection/PrivateLibraryActionMenu.styled.pp';

interface Props {
    library: PrivateLibrary;
    busy: boolean;
    onRefresh: (library: PrivateLibrary) => void;
    onDelete: (library: PrivateLibrary) => void;
}

export default function PrivateLibraryActionMenu({ library, busy, onRefresh, onDelete }: Props) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useActionMenuDismiss({
        open,
        refs: [menuRef],
        onDismiss: () => setOpen(false),
        closeOnScroll: false,
        eventType: 'mousedown',
        eventCapture: false,
    });

    return (
        <S.Actions>
            <Button type="button" variant="ghost" size="sm" loading={busy} onClick={() => onRefresh(library)}>
                <Icon icon="lucide:refresh-cw" width={14} />
                Refresh
            </Button>
            <S.OverflowWrapper ref={menuRef}>
                <S.OverflowButton type="button" onClick={() => setOpen(current => !current)}>
                    <Icon icon="lucide:more-horizontal" width={16} />
                </S.OverflowButton>
                {open && (
                    <S.OverflowMenu>
                        <S.DangerMenuItem
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                onDelete(library);
                            }}
                        >
                            <Icon icon="lucide:trash-2" width={14} />
                            Delete
                        </S.DangerMenuItem>
                    </S.OverflowMenu>
                )}
            </S.OverflowWrapper>
        </S.Actions>
    );
}
