import styled, { css } from 'styled-components';
import type { FlowCardVariant } from './types';

export const Card = styled.a<{
    $variant: FlowCardVariant;
    $selected?: boolean;
    $selectionActive?: boolean;
}>`
    display: flex;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme, $selected }) => $selected ? theme.colors.accent.primary : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    padding: 16px;
    cursor: pointer;
    text-decoration: none;
    color: inherit;
    transition: all ${({ theme }) => theme.transition.fast};
    box-shadow: ${({ theme, $selected }) => $selected ? `0 0 0 3px ${theme.colors.accent.primary}18` : 'none'};

    ${({ $variant }) => $variant === 'list'
        ? css`
            flex-direction: row;
            align-items: center;
            gap: 16px;
            padding: 10px 16px;
        `
        : css`
            flex-direction: column;
            gap: 10px;
            height: 100%;
        `}

    &:hover {
        border-color: ${({ theme, $selected }) => $selected ? theme.colors.accent.primary : theme.colors.border.light};
        background: ${({ theme }) => theme.colors.bg.tertiary};
    }

    &:hover [data-select-checkbox] {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }

    &:hover [data-select-icon] {
        opacity: 0;
        transform: scale(0.72);
    }

    ${({ $selected, $selectionActive }) => ($selected || $selectionActive) && css`
        [data-select-checkbox] {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }

        [data-select-icon] {
            opacity: 0;
            transform: scale(0.72);
        }
    `}

    &[draggable='true'] {
        cursor: grab;

        &:active {
            cursor: grabbing;
            opacity: 0.6;
        }
    }
`;
