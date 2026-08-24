import { Icon } from '@/Shared/UI/Icon/Icon';
import {
    EvalBody,
    EvalClose,
    EvalExpr,
    EvalHeader,
    EvalLabel,
    EvalModal,
    EvalOverlay,
    EvalResult,
    EvalTitle,
} from '@/Shared/CodeEditor/shared/evaluation-modal.styled';
import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';

export interface EvaluationResult {
    entry: HelpEntryDef;
    result: unknown;
    error?: string;
}

interface EvaluationModalProps {
    evaluation: EvaluationResult;
    onClose: () => void;
}

export function EvaluationModal({ evaluation, onClose }: EvaluationModalProps) {
    return (
        <EvalOverlay onClick={onClose}>
            <EvalModal onClick={event => event.stopPropagation()}>
                <EvalHeader>
                    <EvalTitle>Test Expression</EvalTitle>
                    <EvalClose onClick={onClose}>
                        <Icon icon="lucide:x" />
                    </EvalClose>
                </EvalHeader>
                <EvalBody>
                    <div>
                        <EvalLabel>Expression</EvalLabel>
                        <EvalExpr>{evaluation.entry.evalExpr}</EvalExpr>
                    </div>
                    <div>
                        <EvalLabel>Result</EvalLabel>
                        <EvalResult $error={Boolean(evaluation.error)}>
                            {evaluation.error
                                ? evaluation.error
                                : typeof evaluation.result === 'object'
                                    ? JSON.stringify(evaluation.result, null, 2)
                                    : String(evaluation.result)}
                        </EvalResult>
                    </div>
                </EvalBody>
            </EvalModal>
        </EvalOverlay>
    );
}
