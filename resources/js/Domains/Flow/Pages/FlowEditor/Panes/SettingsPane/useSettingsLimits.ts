import { usePage } from '@inertiajs/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import type { Flow } from '@/Domains/Flow/types';
import type { PageProps } from '@/App/types';

// Loads workspace limits and derives the valid timeout range for flow settings.
export function useSettingsLimits(flow: Flow) {
    const { currentWorkspace, settings } = usePage<InertiaPageProps & PageProps>().props;

    const instanceMaxRetention = settings.maximum_retention_limit ?? 0;
    const rawWsMax = currentWorkspace?.runs_retention_max ?? 0;
    const wsMax = rawWsMax > 0
        ? (instanceMaxRetention > 0 ? Math.min(rawWsMax, instanceMaxRetention) : rawWsMax)
        : (instanceMaxRetention > 0 ? instanceMaxRetention : 0);

    const instanceMaxRetries = settings.maximum_retries_limit ?? 5;
    const rawWsMaxRetries = currentWorkspace?.max_retries_max ?? 0;
    const wsMaxRetries = rawWsMaxRetries > 0
        ? Math.min(rawWsMaxRetries, instanceMaxRetries)
        : instanceMaxRetries;

    const instanceMaxTimeout = settings.maximum_timeout_seconds ?? settings.max_flow_timeout_seconds ?? 0;
    const rawWorkspaceMaxTimeout = currentWorkspace?.max_flow_timeout_seconds ?? 0;
    const workspaceMaxTimeout = rawWorkspaceMaxTimeout > 0
        ? (instanceMaxTimeout > 0 ? Math.min(rawWorkspaceMaxTimeout, instanceMaxTimeout) : rawWorkspaceMaxTimeout)
        : (instanceMaxTimeout > 0 ? instanceMaxTimeout : 0);
    const timeoutLimits = [instanceMaxTimeout, workspaceMaxTimeout].filter(limit => limit > 0);
    const effectiveMaxTimeout = timeoutLimits.length > 0 ? Math.min(...timeoutLimits) : 0;

    const rawWorkspaceDefaultTimeout = currentWorkspace?.default_flow_timeout_seconds ?? 0;
    const workspaceDefaultTimeout = effectiveMaxTimeout > 0
        ? rawWorkspaceDefaultTimeout === 0 ? effectiveMaxTimeout : Math.min(rawWorkspaceDefaultTimeout, effectiveMaxTimeout)
        : rawWorkspaceDefaultTimeout;
    const rawFlowTimeout = flow.timeout_seconds ?? 300;
    const initialFlowTimeout = effectiveMaxTimeout > 0
        ? rawFlowTimeout === 0 ? workspaceDefaultTimeout : Math.min(rawFlowTimeout, effectiveMaxTimeout)
        : rawFlowTimeout === 0 && workspaceDefaultTimeout > 0 ? workspaceDefaultTimeout : rawFlowTimeout;

    const workspaceDefaultRetries = currentWorkspace?.max_retries_default ?? 0;
    const rawFlowMaxRetries = flow.max_retries ?? 0;
    const initialFlowMaxRetries = wsMaxRetries <= 0
        ? 0
        : rawFlowMaxRetries === 0 && workspaceDefaultRetries > 0
        ? Math.min(workspaceDefaultRetries, wsMaxRetries)
        : rawWsMaxRetries > 0 && rawFlowMaxRetries === 0 ? wsMaxRetries : Math.min(rawFlowMaxRetries, wsMaxRetries);

    const rawRetentionLimit = flow.runs_retention_limit ?? 0;
    const workspaceDefaultRetention = currentWorkspace?.runs_retention_default ?? 0;
    const initialRetentionLimit = wsMax > 0
        ? rawRetentionLimit === 0 ? (workspaceDefaultRetention > 0 ? Math.min(workspaceDefaultRetention, wsMax) : wsMax) : Math.min(rawRetentionLimit, wsMax)
        : rawRetentionLimit === 0 && workspaceDefaultRetention > 0 ? workspaceDefaultRetention : rawRetentionLimit;

    return {
        effectiveMaxTimeout,
        initialFlowMaxRetries,
        initialFlowTimeout,
        initialRetentionLimit,
        queuesCounter: Math.max(1, settings.queues_counter ?? 1),
        rawWsMaxRetries,
        recordingEnabled: settings.recording_enabled ?? false,
        workspaceDefaultTimeout,
        wsMax,
        wsMaxRetries,
        wsViewport: {
            width: currentWorkspace?.viewport_width ?? 1280,
            height: currentWorkspace?.viewport_height ?? 720,
        },
        wsKeyboardSpeed: currentWorkspace?.keyboard_speed ?? 100,
    };
}

export type SettingsLimits = ReturnType<typeof useSettingsLimits>;
