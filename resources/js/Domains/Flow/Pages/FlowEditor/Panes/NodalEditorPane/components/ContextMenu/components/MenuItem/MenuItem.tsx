import { Icon } from '@/Shared/UI/Icon/Icon';
import type { ReactNode } from 'react';
import { Item, Label } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/ContextMenu/components/shared.styled';
import * as S from './styled';

interface MenuItemProps {
    icon: string;
    label: ReactNode;
    shortcut?: ReactNode;
    danger?: boolean;
    disabled?: boolean;
    onSelect: () => void;
}

export default function MenuItem({
    icon,
    label,
    shortcut,
    danger,
    disabled,
    onSelect,
}: MenuItemProps) {
    return (
        <Item
            type="button"
            role="menuitem"
            $danger={danger}
            disabled={disabled}
            onClick={onSelect}
        >
            <Label>
                <Icon icon={icon} width={13} height={13} />
                {label}
            </Label>
            {shortcut && <S.Shortcut>{shortcut}</S.Shortcut>}
        </Item>
    );
}
