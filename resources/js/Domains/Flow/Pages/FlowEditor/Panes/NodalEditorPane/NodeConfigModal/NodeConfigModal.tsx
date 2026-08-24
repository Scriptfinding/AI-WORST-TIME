import type { FlowRun } from '@/Domains/Flow/types';
import type { CanvasNode, NodeParameterValue } from '../types';
import type { NodalAutocompleteContext } from '../utils/staticAnalysis';
import { EMPTY_OUTPUT_PORT_SET } from '../utils/node';
import ConnectedNodesRail from './components/ConnectedNodesRail/ConnectedNodesRail';
import NodeConfigHeader from './components/NodeConfigHeader/NodeConfigHeader';
import NodeParameters from './components/NodeParameters/NodeParameters';
import PreviewSection from './components/PreviewSection/PreviewSection';
import useNodeConfigModal from './hooks/useNodeConfigModal';
import * as S from './styled';

interface NodeConfigModalProps {
    node: CanvasNode;
    inputNodes?: CanvasNode[];
    outputNodes?: CanvasNode[];
    connectedOutputPorts?: ReadonlySet<string>;
    currentSiteUrl?: string | null;
    flowId?: Id;
    latestRun: FlowRun | null;
    autocompleteContext: NodalAutocompleteContext;
    isFinallyNode?: boolean;
    readOnly?: boolean;
    onClose: () => void;
    onUpdateValue: (nodeId: string, key: string, value: NodeParameterValue) => void;
    onRenameNode: (nodeId: string, label: string) => void;
    onNavigateNode?: (node: CanvasNode) => void;
}

export default function NodeConfigModal({
    node,
    inputNodes = [],
    outputNodes = [],
    connectedOutputPorts = EMPTY_OUTPUT_PORT_SET,
    currentSiteUrl = null,
    flowId,
    latestRun,
    autocompleteContext,
    isFinallyNode = false,
    readOnly,
    onClose,
    onUpdateValue,
    onRenameNode,
    onNavigateNode,
}: NodeConfigModalProps) {
    const {
        entry,
        visibleArgs,
        defaultNodeLabel,
        outputVariableValue,
        expressionOutputData,
        effectiveAutocompleteContext,
        visibleInputData,
        currentNodeAfterData,
        labelDraft,
        setLabelDraft,
        commitLabel,
        handleClose,
    } = useNodeConfigModal({
        node,
        latestRun,
        autocompleteContext,
        isFinallyNode,
        readOnly,
        onClose,
        onRenameNode,
    });

    return (
        <S.NodeConfigBackdrop
            data-modal-overlay
            data-modal-kind="node-config"
            onClick={handleClose}
            onWheel={event => event.stopPropagation()}
            onPointerDown={event => event.stopPropagation()}
        >
            <S.NodeConfigShell>
                <ConnectedNodesRail
                    nodes={inputNodes}
                    side="left"
                    onNavigate={onNavigateNode}
                />
                <ConnectedNodesRail
                    nodes={outputNodes}
                    side="right"
                    onNavigate={onNavigateNode}
                />
                <S.NodeConfigPanel
                    onClick={event => event.stopPropagation()}
                    onWheel={event => event.stopPropagation()}
                    onPointerDown={event => event.stopPropagation()}
                >
                    <NodeConfigHeader
                        entry={entry}
                        label={labelDraft}
                        currentSiteUrl={currentSiteUrl}
                        readOnly={readOnly}
                        onLabelChange={setLabelDraft}
                        onCommitLabel={commitLabel}
                        onClose={handleClose}
                    />
                    <S.NodeConfigBody>
                        <S.NodeConfigLayout>
                            <PreviewSection
                                title="Before"
                                value={visibleInputData}
                                copyValue={visibleInputData}
                                emptyText="No input data configured yet."
                                flowId={flowId}
                            />
                            <NodeParameters
                                node={node}
                                entry={entry}
                                args={visibleArgs}
                                defaultNodeLabel={defaultNodeLabel}
                                outputVariableValue={outputVariableValue}
                                expressionOutputData={expressionOutputData}
                                autocompleteContext={effectiveAutocompleteContext}
                                connectedOutputPorts={connectedOutputPorts}
                                currentSiteUrl={currentSiteUrl}
                                flowId={flowId}
                                readOnly={readOnly}
                                onUpdateValue={onUpdateValue}
                            />
                            <PreviewSection
                                title="After"
                                value={currentNodeAfterData}
                                copyValue={currentNodeAfterData}
                                emptyText="Run the flow once to populate output data."
                                flowId={flowId}
                            />
                        </S.NodeConfigLayout>
                    </S.NodeConfigBody>
                    <S.NodeConfigFooter>
                        <S.NodeConfigMeta>
                            {latestRun ? `Using run #${latestRun.id} as preview data.` : 'Run the flow once to populate input data.'}
                        </S.NodeConfigMeta>
                        <S.NodeConfigDone type="button" onClick={handleClose}>Done</S.NodeConfigDone>
                    </S.NodeConfigFooter>
                </S.NodeConfigPanel>
            </S.NodeConfigShell>
        </S.NodeConfigBackdrop>
    );
}
