import { Icon } from '@/Shared/UI/Icon/Icon';
import Switch from '@/Shared/UI/Switch/Switch';
import type { WorkspaceMcpSettings } from '@/Domains/Workspace/types';
import * as SharedS from '@/Domains/Workspace/Pages/WorkspaceSettings/shared.styled';
import * as S from './styled';

interface Props {
    settings: WorkspaceMcpSettings;
    busy: boolean;
    readOnly?: boolean;
    onUpdate: (patch: Partial<WorkspaceMcpSettings>) => Promise<void>;
}

export default function GeneralMcpCard({ settings, busy, readOnly, onUpdate }: Props) {
    return (
        <SharedS.Card>
            <SharedS.CardTitle>
                <Icon icon="lucide:plug-zap" width={15} height={15} />
                Instance MCP
            </SharedS.CardTitle>
            <S.SectionHint>
                Expose selected Puppetflow flows through one MCP endpoint for AI clients. Clients authenticate as the token owner in this workspace.
            </S.SectionHint>
            <S.CardBody>
                <S.SwitchGroup>
                    <Switch
                        id="mcp_enabled"
                        checked={settings.enabled}
                        onChange={value => void onUpdate({ enabled: value })}
                        label="Enable instance-level MCP for this workspace"
                        disabled={readOnly || busy}
                    />
                    <S.SwitchHint>
                        Allows authenticated MCP clients to connect to this workspace endpoint.
                    </S.SwitchHint>
                </S.SwitchGroup>
                <S.Divider />
                <S.SwitchGroup>
                    <Switch
                        id="mcp_unexposed_previews"
                        checked={settings.include_unexposed_flow_previews}
                        onChange={value => void onUpdate({ include_unexposed_flow_previews: value })}
                        label="Include flows not enabled for MCP in search results"
                        disabled={readOnly || busy}
                    />
                    <S.SwitchHint>
                        Shows basic flow previews in search without exposing their details or allowing runs.
                    </S.SwitchHint>
                </S.SwitchGroup>
            </S.CardBody>
        </SharedS.Card>
    );
}
