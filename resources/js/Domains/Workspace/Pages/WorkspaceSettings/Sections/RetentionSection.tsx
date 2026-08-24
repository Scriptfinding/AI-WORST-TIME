import React from 'react';
import { useForm, usePage } from '@inertiajs/react';
import Input from '@/Shared/UI/Input/Input';
import Button from '@/Shared/UI/Button/Button';
import type { PageProps } from '@/App/types';
import type { Workspace } from '@/Domains/Workspace/types';
import { capDefault } from '@/Shared/Utils/limits';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import * as S from './RetentionSection.styled';

interface Props {
    workspace: Workspace;
    readOnly?: boolean;
}

export default function RetentionSection({ workspace, readOnly }: Props) {
    const { settings } = usePage<InertiaPageProps & PageProps>().props;
    const globalMax = settings.maximum_retention_limit ?? 0;
    const rawMax = workspace.runs_retention_max ?? 0;
    const initialMax = globalMax > 0
        ? rawMax === 0 ? globalMax : Math.min(rawMax, globalMax)
        : rawMax;
    const initialDefault = workspace.runs_retention_default ?? 0;
    const form = useForm({
        runs_retention_default: initialMax > 0
            ? initialDefault === 0 ? initialMax : Math.min(initialDefault, initialMax)
            : initialDefault,
        runs_retention_max: initialMax,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly) return;
        if (globalMax > 0 && Number(form.data.runs_retention_max) > globalMax) {
            form.setData('runs_retention_max', globalMax);
        }
        if (Number(form.data.runs_retention_max) > 0) {
            form.setData('runs_retention_default', capDefault(
                Number(form.data.runs_retention_default),
                Number(form.data.runs_retention_max),
            ));
        }
        form.put('/workspace');
    };

    return (
        <S.Form onSubmit={handleSubmit}>
            <Input
                label="Default retention limit"
                type="number"
                min={Number(form.data.runs_retention_max) > 0 ? 1 : 0}
                max={Number(form.data.runs_retention_max) > 0 ? Number(form.data.runs_retention_max) : undefined}
                value={String(form.data.runs_retention_default)}
                onChange={e => form.setData('runs_retention_default', capDefault(Number(e.target.value), Number(form.data.runs_retention_max)))}
                error={form.errors.runs_retention_default}
                disabled={readOnly}
            />
            <S.FieldHint>
                Number of runs to keep per flow by default.
                {Number(form.data.runs_retention_max) > 0 ? ' 0 is disabled because a maximum cap is defined.' : ' 0 = unlimited.'}
            </S.FieldHint>

            <Input
                label="Maximum retention limit"
                type="number"
                min={globalMax > 0 ? 1 : 0}
                max={globalMax > 0 ? globalMax : undefined}
                value={String(form.data.runs_retention_max)}
                onChange={e => {
                    const value = Number(e.target.value);
                    const nextMax = globalMax > 0
                        ? value === 0 ? globalMax : Math.min(value, globalMax)
                        : value;
                    form.setData(prev => ({
                        ...prev,
                        runs_retention_max: nextMax,
                        runs_retention_default: capDefault(Number(prev.runs_retention_default), nextMax),
                    }));
                }}
                error={form.errors.runs_retention_max}
                disabled={readOnly}
            />
            <S.FieldHint>
                Maximum allowed retention limit across all flows.
                {globalMax > 0 ? ' 0 is disabled because a global cap is defined.' : ' 0 = no cap.'}
                {globalMax > 0 && ` Global cap: ${globalMax}.`}
            </S.FieldHint>

            {!readOnly && (
                <S.FormActions>
                    <Button type="submit" size="sm" disabled={form.processing}>
                        Save
                    </Button>
                </S.FormActions>
            )}
        </S.Form>
    );
}
