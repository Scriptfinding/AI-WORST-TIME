import { useEffect, useState } from 'react';
import type { CanvasNode, NodeParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { NODE_RUN_OUTPUT_KEY } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';
import { toCamelCaseVariableName } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/utils/values';
import * as S from './styled';

interface RunOutputFieldProps {
    node: CanvasNode;
    defaultNodeLabel: string;
    outputVariableValue: string;
    readOnly?: boolean;
    onUpdateValue: (nodeId: string, key: string, value: NodeParameterValue) => void;
}

export default function RunOutputField({
    node,
    defaultNodeLabel,
    outputVariableValue,
    readOnly,
    onUpdateValue,
}: RunOutputFieldProps) {
    const [outputVariableOpen, setOutputVariableOpen] = useState(Boolean(outputVariableValue.trim()));
    const defaultOutputVariableName = toCamelCaseVariableName(node.label?.trim() || defaultNodeLabel);

    useEffect(() => {
        setOutputVariableOpen(Boolean(outputVariableValue.trim()));
    }, [node.id, outputVariableValue]);

    return (
        <S.OutputVariableField $open={outputVariableOpen}>
            <S.OutputVariableToggle
                type="button"
                disabled={readOnly}
                onClick={() => {
                    const nextOpen = !outputVariableOpen;
                    setOutputVariableOpen(nextOpen);
                    if (!nextOpen) {
                        onUpdateValue(node.id, NODE_RUN_OUTPUT_KEY, { mode: 'fixed', value: '' });
                    }
                }}
            >
                <span>{outputVariableOpen ? 'Store result for later nodes' : 'Store result variable'}</span>
                <S.OutputVariableSwitch $active={outputVariableOpen} />
            </S.OutputVariableToggle>
            {outputVariableOpen && (
                <>
                    <S.FieldHelp>
                        Use this variable name to reference the result in following nodes.
                    </S.FieldHelp>
                    <input
                        value={outputVariableValue}
                        placeholder={defaultOutputVariableName}
                        disabled={readOnly}
                        onChange={event => onUpdateValue(node.id, NODE_RUN_OUTPUT_KEY, { mode: 'fixed', value: event.target.value })}
                    />
                </>
            )}
        </S.OutputVariableField>
    );
}
