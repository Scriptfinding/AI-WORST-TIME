import Switch from '@/Shared/UI/Switch/Switch';
import type { SettingsForm } from '@/Domains/Flow/Pages/FlowEditor/Panes/SettingsPane/types';
import * as S from './styled';

interface AISectionProps {
    form: SettingsForm;
}

export default function AISection({ form }: AISectionProps) {
    return (
        <>
            <S.SettingsSeparator />
            <S.SettingsSectionLabel>AI</S.SettingsSectionLabel>
            <Switch
                id="available_in_mcp"
                checked={form.data.available_in_mcp}
                onChange={value => form.setData('available_in_mcp', value)}
                label="Expose this flow in MCP"
            />
            <S.SettingsHint>Allow authenticated MCP clients to read safe details, execute this flow, access run artifacts and continue human validation waits.</S.SettingsHint>
        </>
    );
}
