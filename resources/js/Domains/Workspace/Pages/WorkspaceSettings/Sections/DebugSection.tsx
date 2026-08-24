import type React from 'react';
import { useForm } from '@inertiajs/react';
import Button from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import type { Workspace } from '@/Domains/Workspace/types';
import * as S from './DebugSection.styled';

interface Props {
    workspace: Workspace;
    readOnly?: boolean;
}

export default function DebugSection({ workspace, readOnly }: Props) {
    const form = useForm({
        debug_log_object_depth: workspace.debug_log_object_depth ?? 8,
        debug_log_array_limit: workspace.debug_log_array_limit ?? 100,
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (readOnly) return;
        form.put('/workspace', { preserveScroll: true });
    };

    return (
        <S.Form onSubmit={handleSubmit}>
            <S.Fields>
                <Input
                    type="number"
                    min={0}
                    max={20}
                    step={1}
                    label="Object depth"
                    value={String(form.data.debug_log_object_depth)}
                    onChange={event => form.setData('debug_log_object_depth', Number(event.target.value))}
                    error={form.errors.debug_log_object_depth}
                    disabled={readOnly}
                />
                <Input
                    type="number"
                    min={1}
                    max={1000}
                    step={1}
                    label="Array item limit"
                    value={String(form.data.debug_log_array_limit)}
                    onChange={event => form.setData('debug_log_array_limit', Number(event.target.value))}
                    error={form.errors.debug_log_array_limit}
                    disabled={readOnly}
                />
            </S.Fields>
            <S.Hint>
                Controls how deeply nested objects and arrays are expanded in console logs for this workspace&apos;s flows.
            </S.Hint>
            {!readOnly && (
                <S.Actions>
                    <Button type="submit" size="sm" disabled={form.processing}>
                        Save
                    </Button>
                </S.Actions>
            )}
        </S.Form>
    );
}
