import styled from 'styled-components';
import type { UserVariable } from '@/Domains/Variable/types';

export const VaultProviderBadge = styled.span<{ $color: string }>`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ $color }) => $color + '18'};
    color: ${({ $color }) => $color};
    text-transform: uppercase;

    svg {
        flex-shrink: 0;
    }
`;

export const TypeBadge = styled.span<{ $type: UserVariable['type'] }>`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 2px 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ $type }) =>
        $type === 'secret' ? '#ec489918'
        : ['object', 'array', 'json'].includes($type) ? '#f9731618'
        : $type === 'vault' ? '#8b5cf618'
        : $type === 'otp' ? '#8b5cf618'
        : '#10b98118'};
    color: ${({ $type }) =>
        $type === 'secret' ? '#ec4899'
        : ['object', 'array', 'json'].includes($type) ? '#f97316'
        : $type === 'vault' ? '#8b5cf6'
        : $type === 'otp' ? '#8b5cf6'
        : '#10b981'};
`;
