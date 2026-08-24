import FlowEditorView from './components/FlowEditorView/FlowEditorView';
import { useFlowEditorController } from './hooks/useFlowEditorController';
import { NodeValidationProvider } from './Panes/NodalEditorPane/contexts/NodeValidationContext';
import { QuickRequirementCreationProvider } from './Panes/NodalEditorPane/contexts/QuickRequirementCreationContext';
import type { FlowEditorProps } from './types';

export default function FlowEditor(props: FlowEditorProps) {
    const controller = useFlowEditorController(props);

    return (
        <NodeValidationProvider flowId={props.flow.id}>
            <QuickRequirementCreationProvider
                flowId={props.flow.id}
                isNodalFlow={props.flow.flow_type === 'nodal'}
            >
                <FlowEditorView {...props} controller={controller} />
            </QuickRequirementCreationProvider>
        </NodeValidationProvider>
    );
}
