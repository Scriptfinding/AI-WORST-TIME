import { useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import Switch from '@/Shared/UI/Switch/Switch';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import * as TabsS from '@/Shared/UI/SettingsTabs/styled';
import type { McpTool, WorkspaceMcpSettings } from '@/Domains/Workspace/types';
import * as SharedS from '@/Domains/Workspace/Pages/WorkspaceSettings/shared.styled';
import {
    MCP_TOOL_CATEGORIES,
    toolCategory,
    toolLabel,
    type McpToolCategory,
} from '@/Domains/Workspace/Pages/WorkspaceSettings/Sections/InstanceMcpSection/utils';
import * as S from './styled';

interface Props {
    settings: WorkspaceMcpSettings;
    tools: McpTool[];
    busy: boolean;
    readOnly?: boolean;
    onUpdate: (patch: Partial<WorkspaceMcpSettings>) => Promise<void>;
}

export default function ToolsCard({ settings, tools, busy, readOnly, onUpdate }: Props) {
    const { confirm, ConfirmModal } = useConfirm();
    const [activeCategory, setActiveCategory] = useState<McpToolCategory>('flows');
    const visibleTools = activeCategory === 'all'
        ? tools
        : tools.filter(tool => toolCategory(tool.name) === activeCategory);
    const visibleEnabledCount = visibleTools.filter(tool => settings.enabled_tools.includes(tool.name)).length;

    const updateTool = async (toolName: string, value: boolean) => {
        if (readOnly || busy) return;

        const enabledTools = value
            ? Array.from(new Set([...settings.enabled_tools, toolName]))
            : settings.enabled_tools.filter(name => name !== toolName);

        await onUpdate({ enabled_tools: enabledTools });
    };

    const updateVisibleTools = async (enabled: boolean) => {
        if (readOnly || busy) return;
        const visibleNames = new Set(visibleTools.map(tool => tool.name));
        const enabledTools = enabled
            ? Array.from(new Set([...settings.enabled_tools, ...visibleNames]))
            : settings.enabled_tools.filter(name => !visibleNames.has(name));

        await onUpdate({ enabled_tools: enabledTools });
    };

    const restoreDefaults = async () => {
        if (readOnly || busy) return;
        if (!await confirm({
            title: 'Restore MCP tool defaults',
            message: 'Replace the current MCP tool selection with the workspace defaults?',
            confirmLabel: 'Restore defaults',
            variant: 'primary',
        })) {
            return;
        }

        await onUpdate({
            enabled_tools: tools.filter(tool => tool.enabled_by_default).map(tool => tool.name),
        });
    };

    return (
        <>
            <SharedS.Card>
                <SharedS.CardTitle>
                    <Icon icon="lucide:wrench" width={15} height={15} />
                    MCP Tools
                </SharedS.CardTitle>
                <S.SectionHint>
                    Choose which tools this workspace exposes to connected MCP clients. Disabled tools are hidden from discovery and cannot be called.
                </S.SectionHint>
                <S.TabsWrap>
                    <TabsS.SettingsTabsScroller>
                        <TabsS.SettingsTabs role="tablist" aria-label="MCP tool categories">
                            {MCP_TOOL_CATEGORIES.map(category => {
                                const categoryTools = category.key === 'all'
                                    ? tools
                                    : tools.filter(tool => toolCategory(tool.name) === category.key);
                                const enabledCount = categoryTools.filter(tool => settings.enabled_tools.includes(tool.name)).length;

                                return (
                                    <TabsS.SettingsTab
                                        key={category.key}
                                        type="button"
                                        role="tab"
                                        aria-selected={activeCategory === category.key}
                                        $active={activeCategory === category.key}
                                        onClick={() => setActiveCategory(category.key)}
                                    >
                                        {category.label}
                                        <S.TabCount>{enabledCount}/{categoryTools.length}</S.TabCount>
                                    </TabsS.SettingsTab>
                                );
                            })}
                        </TabsS.SettingsTabs>
                    </TabsS.SettingsTabsScroller>
                </S.TabsWrap>
                <S.Header>
                    <S.SettingsInlineHint>{visibleEnabledCount} of {visibleTools.length} tools enabled in this view</S.SettingsInlineHint>
                    {!readOnly && (
                        <S.FormActions>
                            <Button type="button" variant="secondary" size="sm" disabled={busy || visibleTools.length === 0} onClick={() => void updateVisibleTools(true)}>
                                <Icon icon="lucide:list-checks" width={13} height={13} />
                                Enable
                            </Button>
                            <Button type="button" variant="secondary" size="sm" disabled={busy || visibleTools.length === 0} onClick={() => void updateVisibleTools(false)}>
                                <Icon icon="lucide:list-x" width={13} height={13} />
                                Disable
                            </Button>
                            <Button type="button" variant="secondary" size="sm" disabled={busy || tools.length === 0} onClick={() => void restoreDefaults()}>
                                <Icon icon="lucide:rotate-ccw" width={13} height={13} />
                                Restore defaults
                            </Button>
                        </S.FormActions>
                    )}
                </S.Header>
                <S.Grid>
                    {visibleTools.map(tool => {
                        const enabled = settings.enabled_tools.includes(tool.name);

                        return (
                            <S.Item key={tool.name} $enabled={enabled}>
                                <S.Info>
                                    <S.Name>{toolLabel(tool.name)}</S.Name>
                                    <S.Code>{tool.name}</S.Code>
                                    <S.Description>{tool.description}</S.Description>
                                </S.Info>
                                <Switch
                                    id={`mcp_tool_${tool.name}`}
                                    checked={enabled}
                                    onChange={value => void updateTool(tool.name, value)}
                                    label={enabled ? 'Enabled' : 'Disabled'}
                                    disabled={readOnly || busy}
                                />
                            </S.Item>
                        );
                    })}
                </S.Grid>
            </SharedS.Card>
            <ConfirmModal />
        </>
    );
}
