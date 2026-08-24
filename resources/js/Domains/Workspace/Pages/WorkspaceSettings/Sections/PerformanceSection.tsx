import React from 'react';
import { useForm, usePage } from '@inertiajs/react';
import Button from '@/Shared/UI/Button/Button';
import type { PageProps } from '@/App/types';
import type { Workspace } from '@/Domains/Workspace/types';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import PerformanceFields, { type PerformanceFormData } from './PerformanceFields';
import * as S from './PerformanceSection.styled';

interface Props {
    workspace: Workspace;
    readOnly?: boolean;
}

export default function PerformanceSection({ workspace, readOnly }: Props) {
    const { settings } = usePage<InertiaPageProps & PageProps>().props;
    const globalMaxTimeout = settings.maximum_timeout_seconds ?? settings.max_flow_timeout_seconds ?? 0;
    const globalMaxRetries = settings.maximum_retries_limit ?? 5;
    const rawWorkspaceMaxTimeout = workspace.max_flow_timeout_seconds ?? 0;
    const initialWorkspaceMaxTimeout = globalMaxTimeout > 0
        ? rawWorkspaceMaxTimeout === 0 ? globalMaxTimeout : Math.min(rawWorkspaceMaxTimeout, globalMaxTimeout)
        : rawWorkspaceMaxTimeout;
    const rawDefaultFlowTimeout = workspace.default_flow_timeout_seconds ?? 0;
    const initialDefaultFlowTimeout = initialWorkspaceMaxTimeout > 0
        ? rawDefaultFlowTimeout === 0 ? initialWorkspaceMaxTimeout : Math.min(rawDefaultFlowTimeout, initialWorkspaceMaxTimeout)
        : rawDefaultFlowTimeout;
    const rawMaxRetriesMax = workspace.max_retries_max ?? 0;
    const initialMaxRetriesMax = globalMaxRetries > 0
        ? rawMaxRetriesMax === 0 ? globalMaxRetries : Math.min(rawMaxRetriesMax, globalMaxRetries)
        : rawMaxRetriesMax;
    const rawMaxRetriesDefault = workspace.max_retries_default ?? 0;
    const initialMaxRetriesDefault = initialMaxRetriesMax > 0
        ? rawMaxRetriesDefault === 0 ? initialMaxRetriesMax : Math.min(rawMaxRetriesDefault, initialMaxRetriesMax)
        : rawMaxRetriesDefault;
    const form = useForm<PerformanceFormData>({
        default_flow_timeout_seconds: initialDefaultFlowTimeout,
        max_flow_timeout_seconds: initialWorkspaceMaxTimeout,
        max_retries_default: initialMaxRetriesDefault,
        max_retries_max: initialMaxRetriesMax,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly) return;
        if (globalMaxTimeout > 0 && Number(form.data.max_flow_timeout_seconds) > globalMaxTimeout) {
            form.setData('max_flow_timeout_seconds', globalMaxTimeout);
        }
        if (Number(form.data.max_retries_max) > globalMaxRetries) {
            form.setData('max_retries_max', globalMaxRetries);
        }
        if (globalMaxRetries <= 0 && Number(form.data.max_retries_default) > 0) {
            form.setData('max_retries_default', 0);
        }
        form.put('/workspace');
    };

    return (
        <S.Column>
            <S.Form onSubmit={handleSubmit}>
                <PerformanceFields
                    form={form}
                    globalMaxRetries={globalMaxRetries}
                    globalMaxTimeout={globalMaxTimeout}
                    readOnly={readOnly}
                />

                {!readOnly && (
                    <S.FormActions style={{ justifyContent: 'flex-end' }}>
                        <Button type="submit" size="sm" disabled={form.processing}>
                            Save
                        </Button>
                    </S.FormActions>
                )}
            </S.Form>
        </S.Column>
    );
}
