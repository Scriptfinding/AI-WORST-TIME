import { Icon } from '@/Shared/UI/Icon/Icon';
import { usePageProps } from '@/App/Hooks/usePageProps';
import type { TabKey } from '@/Domains/Flow/Pages/FlowEditor/types';
import * as S from './styled';

interface FlowEditorMobileNavProps {
    activeTab: TabKey;
    canEdit: boolean;
    isNodalFlow: boolean;
    onSwitchTab: (tab: TabKey) => void;
}

export default function FlowEditorMobileNav({
    activeTab,
    canEdit,
    isNodalFlow,
    onSwitchTab,
}: FlowEditorMobileNavProps) {
    const { settings } = usePageProps();
    const showRepository = canEdit && settings.vcs_enabled;

    return (
        <S.MobileBottomBar>
            <S.MobileTab $active={activeTab === 'code'} onClick={() => onSwitchTab('code')}>
                <Icon icon={isNodalFlow ? 'lucide:workflow' : 'lucide:code-2'} />
                <S.MobileTabLabel>{isNodalFlow ? 'Visual' : 'Code'}</S.MobileTabLabel>
            </S.MobileTab>
            <S.MobileTab $active={activeTab === 'info'} onClick={() => onSwitchTab('info')}>
                <Icon icon="lucide:database" />
                <S.MobileTabLabel>Data</S.MobileTabLabel>
            </S.MobileTab>
            <S.MobileTab $active={activeTab === 'runs'} onClick={() => onSwitchTab('runs')}>
                <Icon icon="lucide:play" />
                <S.MobileTabLabel>Runs</S.MobileTabLabel>
            </S.MobileTab>
            {showRepository && (
                <S.MobileTab $active={activeTab === 'repository'} onClick={() => onSwitchTab('repository')}>
                    <Icon icon="lucide:git-branch" />
                    <S.MobileTabLabel>Git</S.MobileTabLabel>
                </S.MobileTab>
            )}
            <S.MobileTab $active={activeTab === 'automation'} onClick={() => onSwitchTab('automation')}>
                <Icon icon="lucide:bot" />
                <S.MobileTabLabel>Autom.</S.MobileTabLabel>
            </S.MobileTab>
            <S.MobileTab $active={activeTab === 'mailboxes'} onClick={() => onSwitchTab('mailboxes')}>
                <Icon icon="lucide:mail-search" />
                <S.MobileTabLabel>Mails</S.MobileTabLabel>
            </S.MobileTab>
            {canEdit && (
                <S.MobileTab $active={activeTab === 'settings'} onClick={() => onSwitchTab('settings')}>
                    <Icon icon="lucide:settings" />
                    <S.MobileTabLabel>Settings</S.MobileTabLabel>
                </S.MobileTab>
            )}
        </S.MobileBottomBar>
    );
}
