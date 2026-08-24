import styled, { css } from 'styled-components';
import type { FlowCardVariant } from '@/Domains/Flow/Components/Flow/FlowCard/types';

export const Meta = styled.div<{ $variant: FlowCardVariant }>`
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: ${({ $variant }) => $variant === 'list' ? 'nowrap' : 'wrap'};
    ${({ $variant }) => $variant === 'list'
        ? css`flex-shrink: 0;`
        : css`margin-top: auto;`}
`;

export const Item = styled.span`
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};

    svg {
        width: 12px;
        height: 12px;
    }
`;

export const Indicators = styled.div`
    display: flex;
    gap: 10px;
    align-items: center;
    align-self: stretch;
    flex: 1;
`;

export const LeftIndicators = styled.div`
    display: flex;
    gap: 10px;
    align-items: center;
    flex: 1;
`;

export const RightIndicators = styled.div`
    display: flex;
    gap: 10px;
    align-items: center;
    margin-left: auto;
`;

export const Webhooks = styled.div`
    display: flex;
    gap: 2px;
    align-items: center;
    margin-left: auto;
`;

export const WebhookArrow = styled.div<{ $active: boolean; $direction: 'in' | 'out' }>`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme, $active, $direction }) =>
        $active
            ? $direction === 'in'
                ? theme.colors.accent.success
                : theme.colors.accent.error
            : theme.colors.border.light};
    opacity: ${({ $active }) => ($active ? 1 : 0.5)};
    transition: color ${({ theme }) => theme.transition.fast};

    svg {
        width: 14px;
        height: 14px;
    }
`;
