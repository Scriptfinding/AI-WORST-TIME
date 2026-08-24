import RunModal from '@/Domains/Flow/Pages/FlowEditor/Modals/RunModal/RunModal';
import { QuickRequirementCreationProvider } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/contexts/QuickRequirementCreationContext';

const noop = () => {};

interface Props {
    flowId: Id;
    isNodalFlow: boolean;
    codeSnapshot: string | null;
    isOpen: boolean;
    onClose: () => void;
    onRun: (parsedInput: Record<string, unknown>, useOldCode: boolean) => void;
    rerunData: string | null;
}

export default function RunAgainModal({
    flowId,
    isNodalFlow,
    codeSnapshot,
    isOpen,
    onClose,
    onRun,
    rerunData,
}: Props) {
    return (
        <QuickRequirementCreationProvider flowId={flowId} isNodalFlow={isNodalFlow}>
            <RunModal
                flowId={flowId}
                isNodalFlow={isNodalFlow}
                isOpen={isOpen}
                onClose={onClose}
                initialInput="{}"
                codeSnapshot={codeSnapshot}
                rerunData={rerunData}
                onRun={onRun}
                onSaveInput={noop}
            />
        </QuickRequirementCreationProvider>
    );
}
