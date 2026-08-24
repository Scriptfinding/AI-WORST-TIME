import styled from 'styled-components';
import { dangerCheckboxStyles } from '@/Shared/UI/Checkbox/styles';

export const Body = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 8px 0 4px;
    text-align: left;
`;

export const Message = styled.p`
    font-size: 13px;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const OptionLabel = styled.label`
    width: 100%;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    text-align: left;
    cursor: pointer;

    span {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    strong {
        color: ${({ theme }) => theme.colors.text.primary};
        font-size: 13px;
        font-weight: 600;
    }

    small {
        color: ${({ theme }) => theme.colors.text.tertiary};
        font-size: 12px;
        line-height: 1.4;
    }
`;

export const Checkbox = styled.input`
    ${dangerCheckboxStyles}
    margin-top: 2px;
`;

export const Warning = styled.div`
    width: 100%;
    padding: 9px 10px;
    border: 1px solid ${({ theme }) => theme.colors.accent.error}40;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.accent.errorBg};
    color: ${({ theme }) => theme.colors.accent.error};
    font-size: 12px;
    line-height: 1.4;
    text-align: left;
`;
