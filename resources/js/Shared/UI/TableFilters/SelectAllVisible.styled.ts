import styled from 'styled-components';
import { checkboxStyles } from '@/Shared/UI/Checkbox/styles';

export const Container = styled.div`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 7px;
    padding: 8px 10px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const Checkbox = styled.input`
    ${checkboxStyles}

    &::before {
        width: 4px;
        height: 8px;
        border-width: 0 2px 2px 0;
    }
`;

export const Label = styled.label`
    overflow: hidden;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
`;
