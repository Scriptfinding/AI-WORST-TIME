import { Icon } from '@/Shared/UI/Icon/Icon';
import { useState, type ReactNode } from 'react';
import { Item, Label } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/ContextMenu/components/shared.styled';
import * as S from './styled';

interface MenuSubmenuProps {
    icon: string;
    label: string;
    children: ReactNode;
}

export default function MenuSubmenu({ icon, label, children }: MenuSubmenuProps) {
    const [open, setOpen] = useState(false);

    return (
        <S.Submenu
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <Item
                type="button"
                role="menuitem"
                aria-haspopup="menu"
                aria-expanded={open}
                onFocus={() => setOpen(true)}
                onKeyDown={event => {
                    if (event.key === 'ArrowRight') setOpen(true);
                    if (event.key === 'ArrowLeft') setOpen(false);
                }}
            >
                <Label>
                    <Icon icon={icon} width={13} height={13} />
                    {label}
                </Label>
                <Icon icon="lucide:chevron-right" width={13} height={13} />
            </Item>
            {open && <S.Panel role="menu">{children}</S.Panel>}
        </S.Submenu>
    );
}
