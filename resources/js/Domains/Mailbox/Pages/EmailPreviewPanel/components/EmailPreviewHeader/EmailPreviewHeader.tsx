import { Icon } from '@/Shared/UI/Icon/Icon';
import {
    PanelHeader,
    PanelHeaderLeft,
    PanelHeaderRight,
    PanelTitle,
} from '@/Domains/Mailbox/Pages/shared.styled';
import * as S from './styled';

interface Props {
    isRead: boolean;
    canDeleteEmails: boolean;
    onToggleRead: () => void;
    onViewSource: () => void;
    onDeleteEmail: () => void;
    onBack?: () => void;
}

export default function EmailPreviewHeader({
    isRead,
    canDeleteEmails,
    onToggleRead,
    onViewSource,
    onDeleteEmail,
    onBack,
}: Props) {
    return (
        <PanelHeader>
            <PanelHeaderLeft>
                {onBack && (
                    <S.BackBtn onClick={onBack}>
                        <Icon icon="lucide:arrow-left" width={16} />
                    </S.BackBtn>
                )}
                <PanelTitle>Preview</PanelTitle>
            </PanelHeaderLeft>
            <PanelHeaderRight>
                <S.PreviewActions>
                    <S.PreviewActionButton onClick={onToggleRead} title={isRead ? 'Mark as unread' : 'Mark as read'}>
                        <Icon icon={!isRead ? 'lucide:mail' : 'lucide:mail-open'} width={14} />
                    </S.PreviewActionButton>
                    <S.PreviewActionButton onClick={onViewSource} title="View source">
                        <Icon icon="lucide:code" width={14} />
                    </S.PreviewActionButton>
                    {canDeleteEmails && (
                        <S.PreviewActionButton $danger onClick={onDeleteEmail} title="Delete email">
                            <Icon icon="lucide:trash-2" width={14} />
                        </S.PreviewActionButton>
                    )}
                </S.PreviewActions>
            </PanelHeaderRight>
        </PanelHeader>
    );
}
