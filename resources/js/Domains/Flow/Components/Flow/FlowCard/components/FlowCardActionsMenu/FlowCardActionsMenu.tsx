import { useRef } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useTheme } from 'styled-components';
import type { FlowCardController } from '@/Domains/Flow/Components/Flow/FlowCard/hooks/useFlowCardController';
import { useActionMenuDismiss } from '@/Shared/Hooks/useActionMenuDismiss';
import { useMenuFlip } from '@/Shared/Hooks/useMenuFlip';
import * as S from './styled';

interface Props {
    canEdit: boolean;
    visibility: 'owner' | 'workspace' | 'team';
    controller: FlowCardController;
}

export default function FlowCardActionsMenu({ canEdit, visibility, controller }: Props) {
    const menuRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const theme = useTheme();
    const { menuOpen, setMenuOpen } = controller;
    const flipUp = useMenuFlip(menuOpen, popupRef);
    const visibilityColor = visibility === 'owner'
        ? theme.colors.accent.warning
        : visibility === 'team'
            ? theme.colors.accent.success
            : theme.colors.accent.info;

    useActionMenuDismiss({
        open: menuOpen,
        refs: [menuRef],
        onDismiss: () => setMenuOpen(false),
        closeOnScroll: false,
        eventType: 'mousedown',
        eventCapture: false,
    });

    const stopEvent = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const runAction = (event: React.MouseEvent, action: () => void) => {
        stopEvent(event);
        action();
    };

    return (
        <S.Wrapper ref={menuRef}>
            <S.Button
                aria-expanded={menuOpen}
                aria-label="Flow actions"
                onClick={event => {
                    stopEvent(event);
                    setMenuOpen(open => !open);
                }}
            >
                <Icon icon="lucide:ellipsis-vertical" width={14} />
            </S.Button>
            {menuOpen && (
                <S.Menu ref={popupRef} $up={flipUp}>
                    {canEdit && (
                        <>
                            <S.MenuItem onClick={event => runAction(event, controller.openVisibility)}>
                                <Icon icon="lucide:eye" width={14} style={{ color: visibilityColor }} />
                                Visibility
                            </S.MenuItem>
                            <S.MenuItem onClick={event => runAction(event, controller.openMove)}>
                                <Icon icon="lucide:folder-input" width={14} />
                                Move Flow
                            </S.MenuItem>
                            <S.Divider />
                        </>
                    )}
                    <S.MenuItem onClick={event => runAction(event, controller.openDuplicate)}>
                        <Icon icon="lucide:copy" width={14} />
                        Duplicate
                    </S.MenuItem>
                    {canEdit && (
                        <>
                            <S.Divider />
                            <S.MenuItem $danger onClick={event => runAction(event, controller.deleteFlow)}>
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
