import { Icon } from '@/Shared/UI/Icon/Icon';
import { NodeFieldHelp } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/shared.styled';
import { defaultIfRule, IF_OPERATORS } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/utils/ifConditions';
import type { IfConditionParameterValue, IfConditionRule } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { NodalAutocompleteContext } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/staticAnalysis';
import IfConditionRow from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/IfConditionBuilder/IfConditionRow/IfConditionRow';
import * as S from './styled';

interface IfConditionGroupProps {
    condition: IfConditionParameterValue;
    outputData: unknown;
    autocompleteContext: NodalAutocompleteContext;
    readOnly?: boolean;
    onChange: (value: IfConditionParameterValue) => void;
}

export default function IfConditionGroup({
    condition,
    outputData,
    autocompleteContext,
    readOnly,
    onChange,
}: IfConditionGroupProps) {
    const updateRule = (ruleId: string, patch: Partial<IfConditionRule>) => {
        onChange({
            ...condition,
            rules: condition.rules.map(rule => {
                if (rule.id !== ruleId) return rule;

                const nextCategory = patch.category ?? rule.category;
                const operators = IF_OPERATORS[nextCategory];
                const nextOperator = patch.category && !operators.some(item => item.value === rule.operator)
                    ? operators[0].value
                    : patch.operator ?? rule.operator;

                return { ...rule, ...patch, category: nextCategory, operator: nextOperator };
            }),
        });
    };

    const removeRule = (ruleId: string) => {
        if (condition.rules.length <= 1) return;
        onChange({ ...condition, rules: condition.rules.filter(rule => rule.id !== ruleId) });
    };

    return (
        <S.ConditionField>
            <S.ConditionHeader>
                <div>
                    <label>Conditions</label>
                    <NodeFieldHelp>Build one or more conditions for this branch.</NodeFieldHelp>
                </div>
                <S.CombinatorToggle>
                    {(['and', 'or'] as const).map(item => (
                        <button
                            key={item}
                            type="button"
                            disabled={readOnly}
                            data-active={condition.combinator === item}
                            onClick={() => onChange({ ...condition, combinator: item })}
                        >
                            {item.toUpperCase()}
                        </button>
                    ))}
                </S.CombinatorToggle>
            </S.ConditionHeader>

            <S.ConditionRows>
                {condition.rules.map(rule => (
                    <IfConditionRow
                        key={rule.id}
                        rule={rule}
                        canRemove={condition.rules.length > 1}
                        outputData={outputData}
                        autocompleteContext={autocompleteContext}
                        readOnly={readOnly}
                        onChange={patch => updateRule(rule.id, patch)}
                        onRemove={() => removeRule(rule.id)}
                    />
                ))}
            </S.ConditionRows>

            <S.AddButton
                type="button"
                disabled={readOnly}
                onClick={() => onChange({ ...condition, rules: [...condition.rules, defaultIfRule()] })}
            >
                <Icon icon="lucide:plus" width={12} height={12} />
                Add condition
            </S.AddButton>
        </S.ConditionField>
    );
}
