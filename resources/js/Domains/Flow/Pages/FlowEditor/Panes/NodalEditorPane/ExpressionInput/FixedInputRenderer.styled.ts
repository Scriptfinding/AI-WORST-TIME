import styled from 'styled-components';
import { NodeField } from './shared.styled';

export const BooleanSwitchLabel = styled.label`
    width: 100%;
    min-height: 38px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 11px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    background: ${({ theme }) => theme.colors.bg.primary};
    cursor: pointer;

    ${NodeField}[data-invalid='true'] & {
        border-color: #ef4444;
    }
`;

export const BooleanSwitchInput = styled.input`
    position: absolute;
    opacity: 0;
    pointer-events: none;
`;

export const BooleanSwitchTrack = styled.span`
    position: relative;
    width: 38px;
    height: 22px;
    flex-shrink: 0;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.border.default};
    transition: background ${({ theme }) => theme.transition.fast};

    &::after {
        content: '';
        position: absolute;
        top: 3px;
        left: 3px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: ${({ theme }) => theme.colors.bg.secondary};
        box-shadow: ${({ theme }) => theme.shadow.sm};
        transition: transform ${({ theme }) => theme.transition.fast};
    }

    ${BooleanSwitchInput}:checked + & {
        background: ${({ theme }) => theme.colors.accent.primary};
    }

    ${BooleanSwitchInput}:checked + &::after {
        transform: translateX(16px);
    }
`;
