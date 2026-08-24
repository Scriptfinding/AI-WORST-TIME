import Input from '@/Shared/UI/Input/Input';
import { SettingsHint, SettingsSeparator } from '@/Domains/Flow/Pages/FlowEditor/shared/forms.styled';
import ExtractionSettings from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/components/ExtractionSettings/ExtractionSettings';
import RulesEditor from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/components/RulesEditor/RulesEditor';
import type { DraftRule } from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/types';

interface RulesExtractionFieldsProps {
    isNodalFlow: boolean;
    rules: DraftRule[];
    extractEnabled: boolean;
    extractMode: 'regex' | 'selector';
    extractExpr: string;
    timeout: string;
    onAddRule: (ruleGroup: number) => void;
    onAddRuleGroup: () => void;
    onUpdateRule: (index: number, field: keyof DraftRule, value: string) => void;
    onRemoveRule: (index: number) => void;
    onExtractEnabledChange: (value: boolean) => void;
    onExtractModeChange: (value: 'regex' | 'selector') => void;
    onExtractExprChange: (value: string) => void;
    onTimeoutChange: (value: string) => void;
}

export default function RulesExtractionFields({
    isNodalFlow,
    rules,
    extractEnabled,
    extractMode,
    extractExpr,
    timeout,
    onAddRule,
    onAddRuleGroup,
    onUpdateRule,
    onRemoveRule,
    onExtractEnabledChange,
    onExtractModeChange,
    onExtractExprChange,
    onTimeoutChange,
}: RulesExtractionFieldsProps) {
    return (
        <>
            <SettingsSeparator />
            <RulesEditor
                rules={rules}
                onAddRule={onAddRule}
                onAddRuleGroup={onAddRuleGroup}
                onUpdateRule={onUpdateRule}
                onRemoveRule={onRemoveRule}
            />
            <SettingsSeparator />
            <ExtractionSettings
                enabled={extractEnabled}
                mode={extractMode}
                expression={extractExpr}
                onEnabledChange={onExtractEnabledChange}
                onModeChange={onExtractModeChange}
                onExpressionChange={onExtractExprChange}
            />
            <Input
                label="Timeout (seconds)"
                type="number"
                value={timeout}
                onChange={event => onTimeoutChange(event.target.value)}
                placeholder="300 (default)"
                min={1}
                max={86400}
                step={1}
            />
            <SettingsHint>
                {isNodalFlow
                    ? 'Maximum time to wait for a matching email before the watcher times out.'
                    : <>How long <code>$waitForEmail</code> waits before throwing. Can be overridden per call via <code>options.timeout</code>.</>}
            </SettingsHint>
        </>
    );
}
