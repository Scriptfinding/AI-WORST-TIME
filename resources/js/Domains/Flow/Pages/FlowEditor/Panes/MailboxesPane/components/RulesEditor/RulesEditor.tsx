import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { SettingsHint, SettingsSectionLabel } from '@/Domains/Flow/Pages/FlowEditor/shared/forms.styled';
import type { DraftRule } from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/types';
import { FIELDS, OPERATORS, getRuleGroupNumbers, groupDraftRules } from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/utils/rules';
import * as S from './styled';

interface RulesEditorProps {
    rules: DraftRule[];
    onAddRule: (ruleGroup: number) => void;
    onAddRuleGroup: () => void;
    onUpdateRule: (index: number, field: keyof DraftRule, value: string) => void;
    onRemoveRule: (index: number) => void;
}

export default function RulesEditor({
    rules,
    onAddRule,
    onAddRuleGroup,
    onUpdateRule,
    onRemoveRule,
}: RulesEditorProps) {
    const ruleGroups = groupDraftRules(rules);
    const groupNumbers = getRuleGroupNumbers(ruleGroups);
    let globalRuleIndex = 0;

    return (
        <>
            <SettingsSectionLabel>Rules</SettingsSectionLabel>
            <SettingsHint>
                Rules within a group are AND-ed. Groups are OR-ed. Empty rules match all emails.
            </SettingsHint>

            {groupNumbers.map((groupNumber, groupIndex) => {
                const groupRules = ruleGroups[groupNumber];
                return (
                    <React.Fragment key={groupNumber}>
                        {groupIndex > 0 && <S.OrDivider>OR</S.OrDivider>}
                        <S.RuleGroupWrap>
                            <S.RuleGroupHeader>
                                <S.RuleGroupLabel>Group {groupIndex + 1} (AND)</S.RuleGroupLabel>
                            </S.RuleGroupHeader>
                            {groupRules.map(() => {
                                const ruleIndex = globalRuleIndex++;
                                return (
                                    <S.RuleRow key={ruleIndex}>
                                        <S.RuleSelect
                                            value={rules[ruleIndex].field}
                                            onChange={event => onUpdateRule(ruleIndex, 'field', event.target.value)}
                                        >
                                            {FIELDS.map(field => (
                                                <option key={field.value} value={field.value}>{field.label}</option>
                                            ))}
                                        </S.RuleSelect>
                                        <S.RuleSelect
                                            value={rules[ruleIndex].operator}
                                            onChange={event => onUpdateRule(ruleIndex, 'operator', event.target.value)}
                                        >
                                            {OPERATORS.map(operator => (
                                                <option key={operator.value} value={operator.value}>{operator.label}</option>
                                            ))}
                                        </S.RuleSelect>
                                        <S.RuleInput
                                            value={rules[ruleIndex].value}
                                            onChange={event => onUpdateRule(ruleIndex, 'value', event.target.value)}
                                            placeholder="Value"
                                        />
                                        <S.RuleRemoveBtn onClick={() => onRemoveRule(ruleIndex)} type="button">
                                            <Icon icon="lucide:x" width={13} />
                                        </S.RuleRemoveBtn>
                                    </S.RuleRow>
                                );
                            })}
                            <S.AddRuleBtn type="button" onClick={() => onAddRule(groupNumber)}>
                                <Icon icon="lucide:plus" width={12} /> Add rule (AND)
                            </S.AddRuleBtn>
                        </S.RuleGroupWrap>
                    </React.Fragment>
                );
            })}

            <S.AddRuleBtn type="button" onClick={onAddRuleGroup}>
                <Icon icon="lucide:plus" width={12} /> Add rule group (OR)
            </S.AddRuleBtn>
        </>
    );
}
