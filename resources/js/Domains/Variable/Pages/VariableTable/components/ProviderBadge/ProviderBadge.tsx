import { Icon } from '@/Shared/UI/Icon/Icon';
import type { UserVariable } from '@/Domains/Variable/types';
import * as S from './styled';

const VAULT_PROVIDERS: Record<string, { label: string; icon: string; color: string }> = {
    onepassword: { label: '1Password', icon: 'simple-icons:1password', color: '#0572ec' },
    hashicorp_vault: { label: 'HashiCorp Vault', icon: 'simple-icons:hashicorp', color: '#000000' },
    aws_secrets_manager: { label: 'AWS Secrets Manager', icon: 'simple-icons:amazonaws', color: '#ff9900' },
    azure_key_vault: { label: 'Azure Key Vault', icon: 'simple-icons:microsoftazure', color: '#0078d4' },
};

interface ProviderBadgeProps {
    variable: UserVariable;
}

export default function ProviderBadge({ variable }: ProviderBadgeProps) {
    const provider = variable.vault_provider ? VAULT_PROVIDERS[variable.vault_provider] : undefined;

    if (variable.type === 'vault' && provider) {
        return (
            <S.VaultProviderBadge $color={provider.color}>
                <Icon icon={provider.icon} width={13} />
                {provider.label}
            </S.VaultProviderBadge>
        );
    }

    return (
        <S.TypeBadge $type={variable.type}>
            <Icon
                icon={variable.type === 'otp'
                    ? 'lucide:timer'
                    : variable.type === 'secret'
                        ? 'lucide:eye-off'
                        : variable.type === 'object' || variable.type === 'json'
                            ? 'lucide:braces'
                            : variable.type === 'array'
                                ? 'lucide:list'
                                : 'lucide:text'}
                width={11}
            />
            {variable.type === 'otp'
                ? 'OTP'
                : variable.type === 'json'
                    ? (variable.value.trim().startsWith('[') ? 'array' : 'object')
                    : variable.type}
        </S.TypeBadge>
    );
}
