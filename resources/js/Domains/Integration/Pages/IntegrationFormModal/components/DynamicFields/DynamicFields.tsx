import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import type { ProviderField } from '@/Domains/Integration/Pages/providerConfig';
import * as S from './styled';

interface Props {
    fields: ProviderField[];
    values: Record<string, string>;
    errors: Record<string, string>;
    onChange: (key: string, value: string) => void;
    getPlaceholder?: (field: ProviderField) => string;
    onCopy?: (field: ProviderField) => void;
    disabled?: boolean;
}

export default function DynamicFields({
    fields,
    values,
    errors,
    onChange,
    getPlaceholder,
    onCopy,
    disabled = false,
}: Props) {
    return (
        <S.Fields>
            {fields.map(field => {
                const input = (
                    <Input
                        label={field.label}
                        type={field.type || 'text'}
                        value={values[field.key] ?? ''}
                        onChange={event => onChange(field.key, event.target.value)}
                        error={errors[field.key]}
                        placeholder={getPlaceholder?.(field) ?? field.placeholder}
                        disabled={disabled}
                    />
                );

                return (
                    <S.Field key={field.key}>
                        {field.copyValue && onCopy ? (
                            <S.CopyableRow>
                                {input}
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => onCopy(field)}
                                    disabled={disabled}
                                >
                                    <Icon icon="lucide:copy" width={14} />
                                    Copy
                                </Button>
                            </S.CopyableRow>
                        ) : input}
                        {field.hint && <S.Hint>{field.hint}</S.Hint>}
                    </S.Field>
                );
            })}
        </S.Fields>
    );
}
