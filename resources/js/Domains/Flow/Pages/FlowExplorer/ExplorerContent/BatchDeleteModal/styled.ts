import styled from 'styled-components';
import { checkboxStyles } from '@/Shared/UI/Checkbox/styles';

export const Body = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

export const Intro = styled.div`
    font-size: 13px;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const Warning = styled.div`
    display: flex;
    gap: 8px;
    padding: 10px 12px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.accent.errorBg};
    color: ${({ theme }) => theme.colors.accent.error};
    font-size: 12px;
    line-height: 1.5;

    svg {
        flex-shrink: 0;
        margin-top: 1px;
    }

    strong {
        color: inherit;
        font-weight: 700;
    }
`;

export const CheckLabel = styled.label`
    display: flex;
    align-items: flex-start;
    gap: 9px;
    font-size: 12px;
    line-height: 1.4;
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;

    input {
        ${checkboxStyles}
        margin-top: 1px;
        width: 16px;
        height: 16px;
    }
`;
