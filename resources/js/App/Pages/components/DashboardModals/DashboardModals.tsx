import type { MouseEvent } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { handleLinkClick } from '@/Shared/Utils/navigation';
import LibraryStoreModal from '@/Domains/Library/Components/LibraryStoreModal/LibraryStoreModal';
import RunDetailModal from '@/Domains/Flow/Pages/FlowEditor/Modals/RunDetailModal/RunDetailModal';
import FlowImportModal from '@/Domains/Flow/Pages/FlowImportModal/FlowImportModal';
import { useToast } from '@/App/Hooks/useToast';
import { useRunAgainModal } from '@/Domains/Flow/Hooks/useRunAgainModal';
import type { FlowRun } from '@/Domains/Flow/types';
import * as S from './styled';

interface Props {
    detailRun: FlowRun | null;
    libraryStoreOpen: boolean;
    importModalOpen: boolean;
    onCloseDetail: () => void;
    onCloseLibraryStore: () => void;
    onCloseImportModal: () => void;
    onKill: (run: FlowRun) => void;
    navigationRuns: FlowRun[];
    onNavigate: (run: FlowRun) => void;
}

export default function DashboardModals({
    detailRun,
    libraryStoreOpen,
    importModalOpen,
    onCloseDetail,
    onCloseLibraryStore,
    onCloseImportModal,
    onKill,
    navigationRuns,
    onNavigate,
}: Props) {
    const { toast } = useToast();
    const { openRunAgainModal, runAgainModal } = useRunAgainModal();

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard'));
    };
    const detailFlowUrl = detailRun?.flow ? `/flows/${detailRun.flow.id}` : null;

    return (
        <>
            <RunDetailModal
                run={detailRun}
                onClose={onCloseDetail}
                flowId={detailRun?.flow?.id ?? ''}
                flowName={detailRun?.flow?.name}
                flowIcon={detailRun?.flow}
                timeoutSeconds={detailRun?.flow?.timeout_seconds}
                copyToClipboard={copyToClipboard}
                onKill={onKill}
                onRerun={openRunAgainModal}
                navigationRuns={navigationRuns}
                onNavigate={onNavigate}
                footerExtra={detailFlowUrl ? (
                    <S.RunActionButton
                        href={detailFlowUrl}
                        onClick={(event: MouseEvent<HTMLAnchorElement>) => handleLinkClick(event, detailFlowUrl)}
                    >
                        <Icon icon="lucide:inspect" width={14} height={14} />
                        Go to flow
                    </S.RunActionButton>
                ) : undefined}
            />
            <LibraryStoreModal
                isOpen={libraryStoreOpen}
                onClose={onCloseLibraryStore}
            />
            <FlowImportModal
                isOpen={importModalOpen}
                onClose={onCloseImportModal}
            />
            {runAgainModal}
        </>
    );
}
