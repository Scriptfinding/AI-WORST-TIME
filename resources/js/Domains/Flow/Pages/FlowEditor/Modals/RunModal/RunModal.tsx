import Modal from '@/Shared/UI/Modal/Modal';
import RerunInputEditor from './components/RerunInputEditor/RerunInputEditor';
import RunInputEditor from './components/RunInputEditor/RunInputEditor';
import RunModalActions from './components/RunModalActions/RunModalActions';
import { useRunSubmission } from './hooks/useRunSubmission';

interface RunModalProps {
    flowId: Id;
    isNodalFlow: boolean;
    isOpen: boolean;
    onClose: () => void;
    initialInput: string;
    codeSnapshot: string | null;
    rerunData?: string | null;
    onRun: (parsedInput: Record<string, unknown>, useOldCode: boolean) => void;
    onSaveInput: (parsedInput: Record<string, unknown>) => void;
}

export default function RunModal({ flowId, isNodalFlow, isOpen, onClose, initialInput, codeSnapshot, rerunData, onRun, onSaveInput }: RunModalProps) {
    const isRerun = !!rerunData;
    const submission = useRunSubmission({
        isOpen,
        initialInput,
        rerunData,
        onRun,
        onSaveInput,
    });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isRerun ? 'Run Again' : 'Run Flow'}
            width="480px"
            footer={<RunModalActions hasCodeSnapshot={!!codeSnapshot} onRun={submission.handleRun} />}
        >
            {isRerun ? (
                <RerunInputEditor
                    flowId={flowId}
                    value={submission.rerunInput}
                    error={submission.inputError}
                    onChange={submission.setRerunInput}
                />
            ) : (
                <RunInputEditor
                    flowId={flowId}
                    isNodalFlow={isNodalFlow}
                    value={submission.input}
                    error={submission.inputError}
                    visible={submission.showEditor}
                    onChange={submission.handleInputChange}
                    onVisibleChange={submission.handleShowEditorChange}
                />
            )}
        </Modal>
    );
}
