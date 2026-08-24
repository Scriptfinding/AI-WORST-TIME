import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import * as S from './styled';
import { getConnectionResultLabel, type ConnectionResult } from './utils';

export type { ConnectionResult } from './utils';

interface Props {
    result: ConnectionResult;
    validating: boolean;
    onValidate: () => void;
    disabled?: boolean;
}

export default function ConnectionValidation({
    result,
    validating,
    onValidate,
    disabled = false,
}: Props) {
    return (
        <S.Validation>
            {result && (
                <S.Status $valid={result.valid}>
                    <Icon icon={result.valid ? 'lucide:check-circle' : 'lucide:x-circle'} width={14} />
                    {getConnectionResultLabel(result)}
                </S.Status>
            )}
            <S.Action>
                <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={onValidate}
                    loading={validating}
                    disabled={disabled}
                >
                    <Icon icon="lucide:check-circle" width={14} />
                    Test connection
                </Button>
            </S.Action>
        </S.Validation>
    );
}
