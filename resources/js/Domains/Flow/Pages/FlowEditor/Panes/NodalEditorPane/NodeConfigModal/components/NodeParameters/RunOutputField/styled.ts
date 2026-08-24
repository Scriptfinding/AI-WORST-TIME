import styled from 'styled-components';
import { SelectField } from '../shared.styled';

export const OutputVariableField = styled(SelectField)<{ $open?: boolean }>`
    gap: ${({ $open }) => ($open ? '7px' : '0')};
    padding: ${({ $open }) => ($open ? '12px 14px' : '0')};
    border-color: ${({ theme, $open }) => ($open ? theme.colors.border.default : 'transparent')};
    background: ${({ theme, $open }) => ($open ? theme.colors.bg.secondary : 'transparent')};

    > button {
        padding: ${({ $open }) => ($open ? '0' : '6px 8px')};
    }
`;

export const OutputVariableToggle = styled.button`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 0;
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: transparent;
    border: 0;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;

    > span {
        cursor: inherit;
    }

    &:hover:not(:disabled) {
        color: ${({ theme }) => theme.colors.text.secondary};
    }

    &:disabled {
        cursor: default;
        opacity: 0.55;
    }
`;

export const OutputVariableSwitch = styled.span<{ $active?: boolean }>`
    position: relative;
    width: 26px;
    height: 15px;
    flex-shrink: 0;
    border-radius: 999px;
    background: ${({ theme, $active }) => ($active ? theme.colors.accent.primary : theme.colors.border.default)};

    &::after {
        content: '';
        position: absolute;
        top: 3px;
        left: ${({ $active }) => ($active ? '14px' : '3px')};
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: ${({ theme }) => theme.colors.bg.secondary};
        box-shadow: ${({ theme }) => theme.shadow.sm};
        transition: left ${({ theme }) => theme.transition.fast};
    }
`;

export { FieldHelp } from '../shared.styled';
