import type { InertiaFormProps } from '@inertiajs/react';
import Input from '@/Shared/UI/Input/Input';
import { capDefault } from '@/Shared/Utils/limits';
import * as S from './PerformanceFields.styled';

export interface PerformanceFormData {
    default_flow_timeout_seconds: number;
    max_flow_timeout_seconds: number;
    max_retries_default: number;
    max_retries_max: number;
}

interface Props {
    form: InertiaFormProps<PerformanceFormData>;
    globalMaxRetries: number;
    globalMaxTimeout: number;
    readOnly?: boolean;
}

function formatLimit(seconds: number): string {
    return seconds > 0 ? `${seconds}s` : 'unlimited';
}

export default function PerformanceFields({
    form,
    globalMaxRetries,
    globalMaxTimeout,
    readOnly,
}: Props) {
    return (
        <>
            <Input
                label="Default flow timeout (seconds)"
                type="number"
                min={Number(form.data.max_flow_timeout_seconds) > 0 ? 1 : 0}
                max={Number(form.data.max_flow_timeout_seconds) > 0 ? Number(form.data.max_flow_timeout_seconds) : undefined}
                value={String(form.data.default_flow_timeout_seconds)}
                onChange={e => form.setData('default_flow_timeout_seconds', capDefault(Number(e.target.value), Number(form.data.max_flow_timeout_seconds)))}
                error={form.errors.default_flow_timeout_seconds}
                disabled={readOnly}
            />
            <S.FieldHint>
                Default timeout used by flows that do not define their own timeout.
                {Number(form.data.max_flow_timeout_seconds) > 0 ? ' 0 is disabled because a maximum cap is defined.' : ' 0 = unlimited.'}
            </S.FieldHint>

            <Input
                label="Maximum flow timeout (seconds)"
                type="number"
                min={globalMaxTimeout > 0 ? 1 : 0}
                max={globalMaxTimeout > 0 ? globalMaxTimeout : undefined}
                value={String(form.data.max_flow_timeout_seconds)}
                onChange={e => {
                    const value = Number(e.target.value);
                    const nextMax = globalMaxTimeout > 0
                        ? value === 0 ? globalMaxTimeout : Math.min(value, globalMaxTimeout)
                        : value;
                    form.setData(prev => ({
                        ...prev,
                        max_flow_timeout_seconds: nextMax,
                        default_flow_timeout_seconds: capDefault(Number(prev.default_flow_timeout_seconds), nextMax),
                    }));
                }}
                error={form.errors.max_flow_timeout_seconds}
                disabled={readOnly}
            />
            <S.FieldHint>
                Maximum timeout users can set on flows in this workspace.
                {globalMaxTimeout > 0 ? ' 0 is disabled because a maximum cap is defined.' : ' 0 = no workspace cap.'}
                {' '}Maximum cap: {formatLimit(globalMaxTimeout)}.
            </S.FieldHint>

            <S.Divider />

            <Input
                label="Default max retries"
                type="number"
                min={Number(form.data.max_retries_max) > 0 ? 1 : 0}
                max={Number(form.data.max_retries_max) > 0 ? Number(form.data.max_retries_max) : globalMaxRetries}
                value={String(form.data.max_retries_default)}
                onChange={e => form.setData('max_retries_default', capDefault(Number(e.target.value), Number(form.data.max_retries_max) > 0 ? Number(form.data.max_retries_max) : globalMaxRetries))}
                error={form.errors.max_retries_default}
                disabled={readOnly}
            />
            <S.FieldHint>
                Default retry count used by flows that do not define their own retry count.
                {Number(form.data.max_retries_max) > 0 ? ' 0 is disabled because a maximum cap is defined.' : ' 0 = no retries by default.'}
            </S.FieldHint>

            <Input
                label="Maximum max retries"
                type="number"
                min={globalMaxRetries > 0 ? 1 : 0}
                max={globalMaxRetries > 0 ? globalMaxRetries : undefined}
                value={String(form.data.max_retries_max)}
                onChange={e => {
                    const value = Number(e.target.value);
                    const nextMax = globalMaxRetries > 0
                        ? value === 0 ? globalMaxRetries : Math.min(value, globalMaxRetries)
                        : value;
                    form.setData(prev => ({
                        ...prev,
                        max_retries_max: nextMax,
                        max_retries_default: capDefault(Number(prev.max_retries_default), nextMax),
                    }));
                }}
                error={form.errors.max_retries_max}
                disabled={readOnly}
            />
            <S.FieldHint>
                Maximum retry count users can set on flows in this workspace.
                {globalMaxRetries > 0 ? ' 0 is disabled because a global cap is defined.' : ' 0 = no workspace cap.'}
                {' '}Global cap: {globalMaxRetries}.
            </S.FieldHint>
        </>
    );
}
