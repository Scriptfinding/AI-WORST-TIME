import { Icon } from '@/Shared/UI/Icon/Icon';
import ExpressionInput from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/ExpressionInput/ExpressionInput';
import type { IfConditionRule } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { NodalAutocompleteContext } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/staticAnalysis';
import { IF_OPERATORS } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/utils/ifConditions';
import IfOperatorDropdown from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/IfConditionBuilder/IfOperatorDropdown/IfOperatorDropdown';
import * as S from './styled';

interface IfConditionRowProps {
    rule: IfConditionRule;
    canRemove: boolean;
    outputData: unknown;
    autocompleteContext: NodalAutocompleteContext;
    readOnly?: boolean;
    onChange: (patch: Partial<IfConditionRule>) => void;
    onRemove: () => void;
}

export default function IfConditionRow({
    rule,
    canRemove,
    outputData,
    autocompleteContext,
    readOnly,
    onChange,
    onRemove,
}: IfConditionRowProps) {
    const operators = IF_OPERATORS[rule.category];
    const operator = operators.find(item => item.value === rule.operator) ?? operators[0];
    const rightInputType = operator.rightType === 'number'
        ? 'number'
        : operator.rightType === 'boolean'
            ? 'boolean'
            : 'text';

    return (
        <S.ConditionRow>
            <ExpressionInput
                label="Value"
                hint={null}
                value={rule.left}
                outputData={outputData}
                autocompleteContext={autocompleteContext}
                readOnly={readOnly}
                inlineLabel
                onChange={nextValue => onChange({ left: nextValue })}
            />
            <S.OperatorSlot>
                <IfOperatorDropdown
                    category={rule.category}
                    operator={operator}
                    readOnly={readOnly}
                    onChange={(category, nextOperator) => onChange({ category, operator: nextOperator })}
                />
            </S.OperatorSlot>
            {operator.rightType && (
                <S.RightOperandRow>
                    <ExpressionInput
                        label="Compare to"
                        hint={null}
                        inputType={rightInputType}
                        value={rule.right ?? {
                            mode: 'fixed',
                            value: operator.rightType === 'boolean' ? 'false' : '',
                        }}
                        outputData={outputData}
                        autocompleteContext={autocompleteContext}
                        readOnly={readOnly}
                        inlineLabel
                        onChange={nextValue => onChange({ right: nextValue })}
                    />
                </S.RightOperandRow>
            )}
            <S.RemoveButton
                type="button"
                disabled={readOnly || !canRemove}
                onClick={onRemove}
                title="Remove condition"
            >
                <Icon icon="lucide:trash-2" width={13} height={13} />
            </S.RemoveButton>
        </S.ConditionRow>
    );
}
