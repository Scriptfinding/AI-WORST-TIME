import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useActionMenuDismiss } from '@/Shared/Hooks/useActionMenuDismiss';
import { useAnchoredDropdownPosition } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/hooks/useAnchoredDropdownPosition';
import type { PrivateLibrary } from '@proprietary/Domains/Workspace/Pages/WorkspaceSettings/Sections/PrivateLibrariesSection/types.pp';
import * as S from '@proprietary/Domains/Workspace/Pages/WorkspaceSettings/Sections/PrivateLibrariesSection/PrivateLibraryActionMenu.styled.pp';

interface Props {
    library: PrivateLibrary;
    busy: boolean;
    onEdit: (library: PrivateLibrary) => void;
    onRefresh: (library: PrivateLibrary) => void;
    onDelete: (library: PrivateLibrary) => void;
}

export default function PrivateLibraryActionMenu({
    library,
    busy,
    onEdit,
    onRefresh,
    onDelete,
}: Props) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const { dropdownRect, updateDropdownPosition } = useAnchoredDropdownPosition(
        triggerRef,
        open,
        {
            maxHeight: 160,
            minHeight: 44,
            minWidth: 150,
            clampLeft: true,
        },
    );

    useActionMenuDismiss({
        open,
        refs: [triggerRef, menuRef],
        onDismiss: () => setOpen(false),
        closeOnScroll: false,
        eventType: 'mousedown',
        eventCapture: false,
    });

    return (
        <S.Actions>
            <S.OverflowWrapper>
                <S.OverflowButton
                    type="button"
                    ref={triggerRef}
                    disabled={busy}
                    aria-label="Private library actions"
                    aria-expanded={open}
                    onClick={() => {
                        if (!open) updateDropdownPosition();
                        setOpen(current => !current);
                    }}
                >
                    {busy
                        ? <S.Spinner role="status" aria-label="Refreshing library" />
                        : <Icon icon="lucide:more-horizontal" width={16} />}
                </S.OverflowButton>
                {open && dropdownRect && createPortal(
                    <S.OverflowMenu
                        ref={menuRef}
                        style={{
                            top: dropdownRect.top,
                            left: dropdownRect.left,
                            width: dropdownRect.width,
                            transform: dropdownRect.placement === 'above'
                                ? 'translateY(-100%)'
                                : undefined,
                        }}
                    >
                        <S.MenuItem
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                onEdit(library);
                            }}
                        >
                            <Icon icon="lucide:pencil" width={14} />
                            Edit
                        </S.MenuItem>
                        <S.MenuItem
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                onRefresh(library);
                            }}
                        >
                            <Icon icon="lucide:refresh-cw" width={14} />
                            Refresh
                        </S.MenuItem>
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
                    </S.OverflowMenu>,
                    document.body,
                )}
            </S.OverflowWrapper>
        </S.Actions>
    );
}
