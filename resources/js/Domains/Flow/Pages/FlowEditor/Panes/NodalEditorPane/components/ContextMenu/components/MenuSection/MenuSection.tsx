import type { ReactNode } from 'react';
import { Divider } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/ContextMenu/components/shared.styled';

interface MenuSectionProps {
    children: ReactNode;
    separated?: boolean;
}

export default function MenuSection({ children, separated }: MenuSectionProps) {
    return (
        <>
            {separated && <Divider role="separator" />}
            {children}
        </>
    );
}
