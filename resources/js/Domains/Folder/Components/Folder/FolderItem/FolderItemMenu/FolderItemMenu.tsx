import { useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { Folder } from '@/Domains/Folder/types';
import { useActionMenuDismiss } from '@/Shared/Hooks/useActionMenuDismiss';
import { useMenuFlip } from '@/Shared/Hooks/useMenuFlip';
import * as S from './styled';

interface Props {
    folder: Folder;
    onRename: () => void;
    onDelete?: (folder: Folder) => void;
}

function stopEvent(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
}

export default function FolderItemMenu({ folder, onRename, onDelete }: Props) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const flipUp = useMenuFlip(open, popupRef);

    useActionMenuDismiss({
        open,
        refs: [menuRef],
        onDismiss: () => setOpen(false),
        closeOnScroll: false,
        eventType: 'mousedown',
        eventCapture: false,
    });

    return (
        <S.Wrapper ref={menuRef}>
            <S.Button onClick={event => { stopEvent(event); setOpen(value => !value); }}>
                <Icon icon="lucide:ellipsis-vertical" width={14} />
            </S.Button>
            {open && (
                <S.Menu ref={popupRef} $up={flipUp}>
                    <S.MenuItem onClick={event => { stopEvent(event); setOpen(false); onRename(); }}>
                        <Icon icon="lucide:pencil" width={14} />
                        Rename
                    </S.MenuItem>
                    {onDelete && (
                        <>
                            <S.Divider />
                            <S.MenuItem $danger onClick={event => { stopEvent(event); setOpen(false); onDelete(folder); }}>
                                <Icon icon="lucide:trash-2" width={14} />
                                Delete
                            </S.MenuItem>
                        </>
                    )}
                </S.Menu>
            )}
        </S.Wrapper>
    );
}
