import { useCallback, useMemo } from 'react';
import { router } from '@inertiajs/react';
import type { Flow } from '@/Domains/Flow/types';
import type { FlowStats } from '@/Domains/Flow/Pages/FlowEditor/types';
import { useUrlSyncedModal } from '@/Shared/Hooks/useUrlSyncedModal';
import CoverColorPicker from './components/CoverColorPicker/CoverColorPicker';
import CoverSection from './components/CoverSection/CoverSection';
import DescriptionSection from './components/DescriptionSection/DescriptionSection';
import FlowHeader from './components/FlowHeader/FlowHeader';
import ReadmeSection from './components/ReadmeSection/ReadmeSection';
import WelcomeToolbar from './components/WelcomeToolbar/WelcomeToolbar';
import * as S from './styled';

interface WelcomePaneProps {
    flow: Flow;
    stats: FlowStats;
    canEdit: boolean;
    onSwitchToCode: () => void;
    onSwitchToSettings: (scrollTo?: string) => void;
    sidePanelOpen?: boolean;
    onToggleSidePanel?: () => void;
}

export default function WelcomePane({
    flow,
    stats,
    canEdit,
    onSwitchToCode,
    onSwitchToSettings,
    sidePanelOpen,
    onToggleSidePanel,
}: WelcomePaneProps) {
    const modalFlows = useMemo(() => [flow], [flow]);
    const {
        selectedItem: coverFlow,
        openModal: openCoverPicker,
        closeModal: closeCoverPicker,
    } = useUrlSyncedModal(modalFlows, 'edit-flow-cover');

    const saveField = useCallback((data: Record<string, string | null>, onDone?: () => void) => {
        router.put(`/flows/${flow.id}`, data, { preserveScroll: true, onFinish: onDone });
    }, [flow.id]);

    const handleCoverColorPick = useCallback((color: string | null, onDone?: () => void) => {
        saveField({ cover_color: color }, onDone);
    }, [saveField]);

    const isNodalFlow = flow.flow_type === 'nodal';
    const editorIcon = isNodalFlow ? 'lucide:workflow' : 'lucide:code-2';
    const editorTitle = isNodalFlow ? 'Visual Builder' : 'Code editor';
    const editorLabel = isNodalFlow ? 'Edit Flow' : 'Edit Code';
    const fileExtension = isNodalFlow ? 'flow' : 'js';

    return (
        <S.Wrapper>
            <WelcomeToolbar
                flowName={flow.name}
                fileExtension={fileExtension}
                editorIcon={editorIcon}
                editorTitle={editorTitle}
                onSwitchToCode={onSwitchToCode}
                sidePanelOpen={sidePanelOpen}
                onToggleSidePanel={onToggleSidePanel}
            />
            <CoverSection
                color={flow.cover_color}
                canEdit={canEdit}
                editorIcon={editorIcon}
                editorLabel={editorLabel}
                onEditCover={() => openCoverPicker(flow)}
                onSwitchToCode={onSwitchToCode}
            />

            <S.Body>
                <FlowHeader
                    flow={flow}
                    stats={stats}
                    canEdit={canEdit}
                    onSave={saveField}
                    onSwitchToSettings={onSwitchToSettings}
                />
                <DescriptionSection
                    description={flow.description}
                    canEdit={canEdit}
                    onSave={saveField}
                />
                <ReadmeSection
                    readme={flow.readme}
                    canEdit={canEdit}
                    onSave={saveField}
                />
            </S.Body>

            <CoverColorPicker
                isOpen={coverFlow !== null}
                onClose={closeCoverPicker}
                currentColor={flow.cover_color}
                onPick={handleCoverColorPick}
            />
        </S.Wrapper>
    );
}
