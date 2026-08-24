import Input from '@/Shared/UI/Input/Input';
import Switch from '@/Shared/UI/Switch/Switch';
import { SettingsHint } from '@/Domains/Flow/Pages/FlowEditor/shared/forms.styled';
import * as S from './styled';

interface ExtractionSettingsProps {
    enabled: boolean;
    mode: 'regex' | 'selector';
    expression: string;
    onEnabledChange: (enabled: boolean) => void;
    onModeChange: (mode: 'regex' | 'selector') => void;
    onExpressionChange: (expression: string) => void;
}

export default function ExtractionSettings({
    enabled,
    mode,
    expression,
    onEnabledChange,
    onModeChange,
    onExpressionChange,
}: ExtractionSettingsProps) {
    return (
        <S.ExtractSection>
            <Switch
                id="extract-enabled"
                checked={enabled}
                onChange={onEnabledChange}
                label="Additional parsing"
            />
            {enabled && (
                <S.ExtractModeRow>
                    <S.ExtractModeSelect
                        value={mode}
                        onChange={event => onModeChange(event.target.value as 'regex' | 'selector')}
                    >
                        <option value="regex">Regex</option>
                        <option value="selector">XPath Selector</option>
                    </S.ExtractModeSelect>
                    <Input
                        value={expression}
                        onChange={event => onExpressionChange(event.target.value)}
                        placeholder={mode === 'regex' ? 'e.g. code[:\\s]*(\\d{4,6})' : 'e.g. //a[@class="test"]/@href or //a[contains(., \'Download Link\')]/@href'}
                        style={{ flex: 1 }}
                    />
                </S.ExtractModeRow>
            )}
            <SettingsHint>
                {mode === 'regex'
                    ? <>Extract a value from the email body using a regex. The first capture group is returned as <code>parsed_value</code>.</>
                    : <>Extract a value from the HTML body using an XPath expression. The text content of the first match is returned as <code>parsed_value</code>.</>
                }
            </SettingsHint>
        </S.ExtractSection>
    );
}
