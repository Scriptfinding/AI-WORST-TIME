import React, { useEffect, useRef } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import * as Layout from '@/Domains/Flow/Pages/FlowEditor/shared/paneLayout.styled';
import Button from '@/Shared/UI/Button/Button';
import FlowIconPicker from '@/Domains/Flow/Components/FlowIcon/FlowIconPicker';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import type { Flow } from '@/Domains/Flow/types';
import type { FlowEditorProps } from '@/Domains/Flow/Pages/FlowEditor/types';
import AISection from './components/AISection/AISection';
import ArtifactsSection from './components/ArtifactsSection/ArtifactsSection';
import BrowserSection from './components/BrowserSection/BrowserSection';
import CookiesSection from './components/CookiesSection/CookiesSection';
import DangerSection from './components/DangerSection/DangerSection';
import GeneralSection from './components/GeneralSection/GeneralSection';
import OutputSection from './components/OutputSection/OutputSection';
import RunSection from './components/RunSection/RunSection';
import type { SettingsFormData } from './types';
import { useSettingsLimits } from './useSettingsLimits';
import * as S from './styled';

interface SettingsPaneProps {
    flow: Flow;
    workspaceProxies: FlowEditorProps['workspaceProxies'];
    teams: FlowEditorProps['teams'];
    canManageWorkspaceProxies: boolean;
    scrollTo?: string | null;
    onScrollHandled?: () => void;
    onDirtyChange?: (isDirty: boolean) => void;
}

export default function SettingsPane({
    flow,
    workspaceProxies,
    teams,
    canManageWorkspaceProxies,
    scrollTo,
    onScrollHandled,
    onDirtyChange,
}: SettingsPaneProps) {
    const iconSectionRef = useRef<HTMLDivElement>(null);
    const { confirm, ConfirmModal } = useConfirm();
    const limits = useSettingsLimits(flow);
    const isNodalFlow = flow.flow_type === 'nodal';
    const settingsForm = useForm<SettingsFormData>({
        name: flow.name,
        description: flow.description || '',
        available_in_mcp: flow.available_in_mcp ?? false,
        queue_index: flow.queue_index !== null
            && flow.queue_index >= 1
            && flow.queue_index <= limits.queuesCounter
            ? flow.queue_index
            : null,
        proxy_mode: flow.proxy_mode ?? 'none',
        workspace_proxy_id: flow.proxy_mode === 'specific'
            ? flow.workspace_proxy_id
            : null,
        timeout_seconds: limits.initialFlowTimeout,
        operator_seconds: flow.operator_seconds ?? 0,
        max_retries: limits.initialFlowMaxRetries,
        include_raw_output: flow.include_raw_output ?? false,
        include_input_in_output: flow.include_input_in_output ?? false,
        include_context_in_output: flow.include_context_in_output ?? true,
        always_success_response: flow.always_success_response ?? false,
        export_artifacts_screenshots: flow.export_artifacts_screenshots ?? true,
        export_artifacts_downloads: flow.export_artifacts_downloads ?? true,
        export_artifacts_recording: flow.export_artifacts_recording ?? true,
        runs_retention_limit: limits.initialRetentionLimit,
        viewport_width: flow.viewport_width ?? '',
        viewport_height: flow.viewport_height ?? '',
        keyboard_speed: flow.keyboard_speed ?? '',
        disable_web_security: flow.disable_web_security ?? false,
    });

    useEffect(() => {
        if (scrollTo === 'icon' && iconSectionRef.current) {
            iconSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            onScrollHandled?.();
        }
    }, [scrollTo, onScrollHandled]);

    useEffect(() => {
        onDirtyChange?.(settingsForm.isDirty);
    }, [settingsForm.isDirty, onDirtyChange]);

    useEffect(() => {
        return () => onDirtyChange?.(false);
    }, [onDirtyChange]);

    const handleSaveSettings = (event?: React.FormEvent) => {
        event?.preventDefault();
        if (limits.effectiveMaxTimeout > 0 && Number(settingsForm.data.timeout_seconds) > limits.effectiveMaxTimeout) {
            settingsForm.setData('timeout_seconds', limits.effectiveMaxTimeout);
        }
        settingsForm.put(`/flows/${flow.id}`, {
            onSuccess: () => {
                settingsForm.setDefaults();
                onDirtyChange?.(false);
            },
        });
    };

    const handleClearCookies = async () => {
        const confirmed = await confirm({
            title: 'Clear Cookies',
            message: 'Are you sure you want to delete all saved cookies for this flow? Flows that rely on stored sessions will need to log in again.',
            confirmLabel: 'Clear',
            variant: 'danger',
        });
        if (!confirmed) return;

        router.delete(`/flows/${flow.id}/cookies`, {
            preserveState: true,
        });
    };

    const handleDeleteFlow = async () => {
        const confirmed = await confirm({
            title: 'Delete Flow',
            message: `Are you sure you want to delete "${flow.name}"? All run history will be lost. This cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });
        if (confirmed) router.delete(`/flows/${flow.id}`);
    };

    return (
        <Layout.SidePanelSection style={{ paddingTop: 0 }}>
            <Layout.StickyHeader>
                <Layout.StickyHeaderTitle>Settings</Layout.StickyHeaderTitle>
                <Button type="button" variant="secondary" size="sm" disabled={settingsForm.processing} onClick={handleSaveSettings}>
                    <Icon icon="lucide:save" width={13} height={13} />
                    {settingsForm.processing ? 'Saving...' : 'Save'}
                </Button>
            </Layout.StickyHeader>
            <Layout.SidePanelSectionInner>
                <S.SettingsForm onSubmit={handleSaveSettings}>
                    <GeneralSection form={settingsForm} />
                    <AISection form={settingsForm} />
                    <RunSection
                        form={settingsForm}
                        limits={limits}
                        workspaceProxies={workspaceProxies}
                        teams={teams}
                        canManageWorkspaceProxies={canManageWorkspaceProxies}
                    />
                    <OutputSection form={settingsForm} isNodalFlow={isNodalFlow} />
                    <ArtifactsSection
                        form={settingsForm}
                        recordingEnabled={limits.recordingEnabled}
                        isNodalFlow={isNodalFlow}
                    />
                    <BrowserSection
                        form={settingsForm}
                        viewport={limits.wsViewport}
                        keyboardSpeed={limits.wsKeyboardSpeed}
                    />
                    <S.SettingsSeparator />
                    <div ref={iconSectionRef}>
                        <FlowIconPicker flow={flow} />
                    </div>
                    <S.SettingsSeparator />
                </S.SettingsForm>

                <CookiesSection onClear={handleClearCookies} />
                <DangerSection onDelete={handleDeleteFlow} />
            </Layout.SidePanelSectionInner>
            <ConfirmModal />
        </Layout.SidePanelSection>
    );
}
