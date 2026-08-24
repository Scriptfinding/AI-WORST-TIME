import type { ReactNode } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './styled';

export interface BulkDeleteItem {
    id: number | string;
    title: string;
    subtitle?: string;
    icon: ReactNode;
}

interface Props {
    description: string;
    items: BulkDeleteItem[];
    selectionLabel?: string;
    warning?: string;
}

export default function BulkDeleteConfirmation({
    description,
    items,
    selectionLabel = 'Selected for deletion',
    warning = 'This action cannot be undone.',
}: Props) {
    return (
        <S.Content>
            <S.Description>{description}</S.Description>
            <S.Selection>
                <S.SelectionHeader>
                    <span>{selectionLabel}</span>
                    <S.Count>{items.length}</S.Count>
                </S.SelectionHeader>
                <S.List>
                    {items.map(item => (
                        <S.Item key={item.id}>
                            <S.ItemIcon>{item.icon}</S.ItemIcon>
                            <S.ItemCopy>
                                <S.ItemTitle>{item.title}</S.ItemTitle>
                                {item.subtitle && <S.ItemSubtitle>{item.subtitle}</S.ItemSubtitle>}
                            </S.ItemCopy>
                            <Icon icon="lucide:x" width={14} height={14} />
                        </S.Item>
                    ))}
                </S.List>
            </S.Selection>
            <S.Warning>
                <S.WarningIcon>
                    <Icon icon="lucide:shield-alert" width={14} height={14} />
                </S.WarningIcon>
                <span>{warning}</span>
            </S.Warning>
        </S.Content>
    );
}
