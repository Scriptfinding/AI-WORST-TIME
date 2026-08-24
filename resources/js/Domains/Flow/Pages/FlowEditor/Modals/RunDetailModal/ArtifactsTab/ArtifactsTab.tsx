import React, { useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import * as Layout from '@/Domains/Flow/Pages/FlowEditor/shared/paneLayout.styled';
import type { FlowRun, ArtifactFile } from '@/Domains/Flow/types';
import ArtifactFileList, {
    type ArtifactViewMode,
} from './components/ArtifactFileList/ArtifactFileList';
import { DataPanelLoader } from '../shared.styled';
import * as S from './styled';

interface ArtifactsTabProps {
    run: FlowRun;
    flowId: Id;
    screenshotFiles: ArtifactFile[];
    downloadFiles: ArtifactFile[];
    screenshotsLoading: boolean;
    downloadsLoading: boolean;
}

export default function ArtifactsTab({ run, flowId, screenshotFiles, downloadFiles, screenshotsLoading, downloadsLoading }: ArtifactsTabProps) {
    const [viewMode, setViewMode] = useState<ArtifactViewMode>(() => {
        try { return (localStorage.getItem('nop-artifacts-view') as ArtifactViewMode) || 'grid'; } catch { return 'grid'; }
    });

    const handleViewMode = (mode: ArtifactViewMode) => {
        setViewMode(mode);
        try { localStorage.setItem('nop-artifacts-view', mode); } catch {}
    };

    const screenshotsBase = `/flows/${flowId}/runs/${run.id}/artifacts/screenshots`;
    const downloadsBase = `/flows/${flowId}/runs/${run.id}/artifacts/downloads`;

    return (
        <>
            <S.ViewToggleRow>
                <S.ViewToggleButton $active={viewMode === 'grid'} onClick={() => handleViewMode('grid')} title="Grid view">
                    <Icon icon="lucide:grid-2x2" width={13} height={13} />
                </S.ViewToggleButton>
                <S.ViewToggleButton $active={viewMode === 'list'} onClick={() => handleViewMode('list')} title="List view">
                    <Icon icon="lucide:list" width={13} height={13} />
                </S.ViewToggleButton>
            </S.ViewToggleRow>
            <S.ArtifactSection>
                <S.ArtifactSectionHeader>
                    <Icon icon="lucide:camera" width={12} height={12} />
                    Screenshots {screenshotFiles.length > 0 && `(${screenshotFiles.length})`}
                </S.ArtifactSectionHeader>
                {screenshotsLoading ? (
                    <DataPanelLoader><Icon icon="lucide:loader-2" width={18} height={18} /></DataPanelLoader>
                ) : screenshotFiles.length === 0 ? (
                    <Layout.RunListEmpty><Layout.EmptyText>No screenshots.</Layout.EmptyText></Layout.RunListEmpty>
                ) : (
                    <ArtifactFileList files={screenshotFiles} baseUrl={screenshotsBase} viewMode={viewMode} showPreview />
                )}
            </S.ArtifactSection>
            <S.ArtifactSection>
                <S.ArtifactSectionHeader>
                    <Icon icon="lucide:download" width={12} height={12} />
                    Downloads {downloadFiles.length > 0 && `(${downloadFiles.length})`}
                </S.ArtifactSectionHeader>
                {downloadsLoading ? (
                    <DataPanelLoader><Icon icon="lucide:loader-2" width={18} height={18} /></DataPanelLoader>
                ) : downloadFiles.length === 0 ? (
                    <Layout.RunListEmpty><Layout.EmptyText>No downloads.</Layout.EmptyText></Layout.RunListEmpty>
                ) : (
                    <ArtifactFileList files={downloadFiles} baseUrl={downloadsBase} viewMode={viewMode} />
                )}
            </S.ArtifactSection>
        </>
    );
}
