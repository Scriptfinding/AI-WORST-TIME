import type { MutableRefObject } from 'react';
import * as Layout from '@/Domains/Flow/Pages/FlowEditor/shared/paneLayout.styled';
import type { Flow, FlowRun } from '@/Domains/Flow/types';
import FlowDetails from './components/FlowDetails/FlowDetails';
import InputsEditor from './components/InputsEditor/InputsEditor';
import LatestRunCard from './components/LatestRunCard/LatestRunCard';

interface InfoPaneProps {
    flow: Flow;
    canEdit: boolean;
    onViewRunDetails: (run: FlowRun) => void;
    onKillRun: (run: FlowRun) => void;
    copyToClipboard: (text: string) => void;
    defaultInputsSaveRef?: MutableRefObject<(() => void) | null>;
}

export default function InfoPane({
    flow,
    canEdit,
    onViewRunDetails,
    onKillRun,
    defaultInputsSaveRef,
}: InfoPaneProps) {
    return (
        <>
            <Layout.SidePanelSection>
                <Layout.SidePanelSectionInner>
                    <FlowDetails flow={flow} />
                    {flow.latest_run && (
                        <LatestRunCard
                            flowId={flow.id}
                            run={flow.latest_run}
                            onViewDetails={onViewRunDetails}
                            onKill={onKillRun}
                        />
                    )}
                </Layout.SidePanelSectionInner>
            </Layout.SidePanelSection>

            <Layout.SidePanelSection>
                <Layout.SidePanelSectionInner>
                    <InputsEditor
                        flow={flow}
                        canEdit={canEdit}
                        saveRef={defaultInputsSaveRef}
                    />
                </Layout.SidePanelSectionInner>
            </Layout.SidePanelSection>
        </>
    );
}
