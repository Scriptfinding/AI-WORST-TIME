import { Icon } from '@/Shared/UI/Icon/Icon';
import type { UserVariable } from '@/Domains/Variable/types';
import * as S from './styled';

interface VariableValueProps {
    variable: UserVariable;
}

export default function VariableValue({ variable }: VariableValueProps) {
    if (variable.type === 'secret' || variable.type === 'otp') {
        return (
            <S.SecretDots title="Secret value">
                ••••••••
            </S.SecretDots>
        );
    }
    if (variable.type === 'vault') {
        const parts = [
            variable.vault_vault_name,
            variable.vault_item_name,
            variable.vault_field_label,
        ].filter(Boolean);
        return (
            <S.VaultRef title="Vault reference">
                <Icon icon="lucide:lock-keyhole" width={12} />
                {parts.length > 0 ? parts.join(' / ') : 'Vault reference'}
            </S.VaultRef>
        );
    }
    if (variable.type === 'object' || variable.type === 'array' || variable.type === 'json') {
        try {
            const value = JSON.parse(variable.value);
            const keys = Object.keys(value);
            const isArray = Array.isArray(value);
            return (
                <S.JsonPreview title={variable.value}>
                    {isArray
                        ? `[ ${keys.length} item${keys.length === 1 ? '' : 's'} ]`
                        : `{ ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? ', ...' : ''} }`}
                </S.JsonPreview>
            );
        } catch {
            return <span>{variable.value}</span>;
        }
    }
    return <span>{variable.value}</span>;
}
