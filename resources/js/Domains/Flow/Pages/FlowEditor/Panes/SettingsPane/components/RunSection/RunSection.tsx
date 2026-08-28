import { useEffect, useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import Input, { Select } from '@/Shared/UI/Input/Input';
import { capDefault } from '@/Shared/Utils/limits';
import type { SettingsForm } from '@/Domains/Flow/Pages/FlowEditor/Panes/SettingsPane/types';
import type { SettingsLimits } from '@/Domains/Flow/Pages/FlowEditor/Panes/SettingsPane/useSettingsLimits';
import type { FlowEditorProps } from '@/Domains/Flow/Pages/FlowEditor/types';
import { formatTimeoutLimit } from '@/Domains/Flow/Pages/FlowEditor/Panes/SettingsPane/utils';
import CustomSelect from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/CustomSelect/CustomSelect';
import WorkspaceProxyFormModal from '@/Domains/Workspace/Pages/WorkspaceSettings/Sections/ProxiesSection/WorkspaceProxyFormModal';
import type { WorkspaceProxy } from '@/Domains/Workspace/types';
import * as S from './styled';

interface RunSectionProps {
    form: SettingsForm;
    limits: SettingsLimits;
    workspaceProxies: FlowEditorProps['workspaceProxies'];
    teams: FlowEditorProps['teams'];
    canManageWorkspaceProxies: boolean;
}

export default function RunSection({
    form,
    limits,
    workspaceProxies,
    teams,
    canManageWorkspaceProxies,
}: RunSectionProps) {
    const [refreshingProxies, setRefreshingProxies] = useState(false);
    const [proxyModalOpen, setProxyModalOpen] = useState(false);
    const createResolverRef = useRef<((value: string | null) => void) | null>(null);
    const {
        effectiveMaxTimeout,
        queuesCounter,
        rawWsMaxRetries,
        workspaceDefaultTimeout,
        wsMax,
        wsMaxRetries,
    } = limits;
    const selectedProxyUnavailable = form.data.proxy_mode === 'specific'
        && form.data.workspace_proxy_id !== null
        && !workspaceProxies.some(proxy => proxy.id === form.data.workspace_proxy_id);

    useEffect(() => () => {
        createResolverRef.current?.(null);
        createResolverRef.current = null;
    }, []);
    const selectedProxyValue = form.data.proxy_mode === 'specific'
        && form.data.workspace_proxy_id !== null
        ? `proxy:${form.data.workspace_proxy_id}`
        : form.data.proxy_mode;
    const proxyOptions = useMemo(() => [
        {
            value: 'none',
            label: 'None',
            detail: 'Connect directly without a proxy',
            icon: 'lucide:ban',
        },
        {
            value: 'auto',
            label: 'Auto (round-robin)',
            detail: 'Rotate through the available proxy pool',
            icon: 'lucide:refresh-cw',
        },
        ...(selectedProxyUnavailable ? [{
            value: `proxy:${form.data.workspace_proxy_id}`,
            label: 'Unavailable proxy',
            detail: 'This proxy is no longer available to you',
            icon: 'lucide:triangle-alert',
        }] : []),
        ...workspaceProxies.map(proxy => ({
            value: `proxy:${proxy.id}`,
            label: proxy.label,
            detail: `${proxy.scheme.toUpperCase()} - ${proxy.host}:${proxy.port}`,
            icon: 'lucide:network',
        })),
    ], [form.data.workspace_proxy_id, selectedProxyUnavailable, workspaceProxies]);

    const refreshProxies = () => new Promise<void>(resolve => {
        setRefreshingProxies(true);
        router.reload({
            only: ['workspaceProxies'],
            onFinish: () => {
                setRefreshingProxies(false);
                resolve();
            },
        });
    });

    const createProxy = () => new Promise<string | null>(resolve => {
        createResolverRef.current = resolve;
        setProxyModalOpen(true);
    });

    const closeProxyModal = () => {
        setProxyModalOpen(false);
        createResolverRef.current?.(null);
        createResolverRef.current = null;
    };

    const handleProxySaved = async (proxy: WorkspaceProxy) => {
        setProxyModalOpen(false);
        await refreshProxies();
        createResolverRef.current?.(`proxy:${proxy.id}`);
        createResolverRef.current = null;
    };

    const handleProxyChange = (value: string) => {
        if (value.startsWith('proxy:')) {
            form.setData(data => ({
                ...data,
                proxy_mode: 'specific',
                workspace_proxy_id: Number(value.slice(6)),
            }));
            return;
        }
        form.setData(data => ({
            ...data,
            proxy_mode: value as 'none' | 'auto',
            workspace_proxy_id: null,
        }));
    };

    return (
        <>
            <S.SettingsSeparator />
            <S.SettingsSectionLabel>Run</S.SettingsSectionLabel>

            <Select
                label="Queue"
                value={form.data.queue_index === null ? '' : String(form.data.queue_index)}
                onChange={event => form.setData(
                    'queue_index',
                    event.target.value === '' ? null : Number(event.target.value),
                )}
                options={[
                    { value: '', label: 'Auto' },
                    ...Array.from({ length: queuesCounter }, (_, index) => ({
                        value: String(index + 1),
                        label: `Queue ${index + 1}`,
                    })),
                ]}
                error={form.errors.queue_index}
            />
            <S.SettingsHint>
                Auto selects the queue with the smallest active backlog.
            </S.SettingsHint>

            <S.ProxyField>
                <S.ProxyLabel>Proxy</S.ProxyLabel>
                <CustomSelect
                    value={selectedProxyValue}
                    options={proxyOptions}
                    searchThreshold={0}
                    showOptionValue={false}
                    placeholder="Select a proxy..."
                    ariaLabel="Proxy"
                    invalid={Boolean(form.errors.proxy_mode || form.errors.workspace_proxy_id)}
                    onChange={handleProxyChange}
                    onRefresh={refreshProxies}
                    refreshing={refreshingProxies}
                    actionSlot={canManageWorkspaceProxies ? {
                        label: '+ Add proxy',
                        onAction: createProxy,
                    } : undefined}
                />
                {(form.errors.proxy_mode || form.errors.workspace_proxy_id) && (
                    <S.ProxyError>{form.errors.proxy_mode || form.errors.workspace_proxy_id}</S.ProxyError>
                )}
            </S.ProxyField>
            <S.SettingsHint>
                Auto rotates through the workspace proxy pool for each run.
            </S.SettingsHint>

            <WorkspaceProxyFormModal
                isOpen={proxyModalOpen}
                teams={teams}
                zIndex={1050}
                onClose={closeProxyModal}
                onSaved={proxy => { void handleProxySaved(proxy); }}
            />

            <Input
                label="Timeout (seconds)"
                type="number"
                min={effectiveMaxTimeout > 0 ? 5 : 0}
                max={effectiveMaxTimeout > 0 ? effectiveMaxTimeout : undefined}
                value={String(form.data.timeout_seconds)}
                onChange={e => {
                    const value = Number(e.target.value);
                    form.setData('timeout_seconds', effectiveMaxTimeout > 0
                        ? value === 0 ? workspaceDefaultTimeout : Math.min(value, effectiveMaxTimeout)
                        : value);
                }}
                error={form.errors.timeout_seconds}
            />
            <S.SettingsHint>
                Maximum timeout for this flow.
                {effectiveMaxTimeout > 0
                    ? ' 0 is disabled because a maximum cap is defined.'
                    : workspaceDefaultTimeout > 0 ? ' 0 = use workspace default.' : ' 0 = unlimited.'}
                {' '}Maximum cap: {formatTimeoutLimit(effectiveMaxTimeout)}.
            </S.SettingsHint>

            <Input
                label="Estimated human time (seconds)"
                type="number"
                min={0}
                value={String(form.data.operator_seconds)}
                onChange={e => form.setData('operator_seconds', Number(e.target.value))}
                error={form.errors.operator_seconds}
            />
            <S.SettingsHint>Estimated time a human operator would spend on one successful run.</S.SettingsHint>

            <Input
                label="Max Retries"
                type="number"
                min={rawWsMaxRetries > 0 ? 1 : 0}
                max={wsMaxRetries}
                value={String(form.data.max_retries)}
                onChange={e => form.setData('max_retries', rawWsMaxRetries > 0
                    ? capDefault(Number(e.target.value), wsMaxRetries)
                    : Math.min(Number(e.target.value), wsMaxRetries))}
                error={form.errors.max_retries}
            />
            <S.SettingsHint>
                Number of automatic retries on failure.
                {rawWsMaxRetries > 0 ? ' 0 is disabled because a workspace cap is defined.' : ' 0 = use workspace default.'}
                {' '}Maximum cap: {wsMaxRetries}.
            </S.SettingsHint>

            <Input
                label="Run retention limit"
                type="number"
                min={wsMax > 0 ? 1 : 0}
                max={wsMax > 0 ? wsMax : undefined}
                value={String(form.data.runs_retention_limit)}
                onChange={e => form.setData('runs_retention_limit', capDefault(Number(e.target.value), wsMax))}
                error={form.errors.runs_retention_limit}
            />
            <S.SettingsHint>
                Number of runs to keep for this flow.
                {wsMax > 0 ? ' 0 is disabled because a maximum cap is defined.' : ' 0 = use workspace default.'}
                {wsMax > 0 && ` Workspace cap: ${wsMax}.`}
            </S.SettingsHint>
        </>
    );
}
