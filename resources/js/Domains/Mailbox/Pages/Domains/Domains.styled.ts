import styled from 'styled-components';

export const Subtitle = styled.p`
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin: 0;
`;

export const AddForm = styled.form`
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
`;

export const AddInput = styled.input`
    flex: 1;
    padding: 8px 12px;
    font-size: 13px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;
    transition: border-color ${({ theme }) => theme.transition.fast};
    &:focus { border-color: ${({ theme }) => theme.colors.border.focus}; }
    &::placeholder { color: ${({ theme }) => theme.colors.text.tertiary}; }
`;

export const DomainList = styled.div`
    display: flex;
    flex-direction: column;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    overflow: hidden;
`;

export const DomainRow = styled.div`
    display: flex;
    align-items: center;
    padding: 12px 16px;
    gap: 12px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    transition: background ${({ theme }) => theme.transition.fast};
    &:last-child { border-bottom: none; }
    &:hover { background: ${({ theme }) => theme.colors.bg.secondary}; }
`;

export const DomainName = styled.a`
    font-size: 14px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.primary};
    text-decoration: none;
    cursor: pointer;
    flex: 1;
    &:hover { color: ${({ theme }) => theme.colors.accent.primary}; }
`;

export const DomainMeta = styled.span`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const DeleteBtn = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    background: none;
    border: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};
    &:hover {
        color: ${({ theme }) => theme.colors.accent.error};
        background: ${({ theme }) => theme.colors.accent.errorBg};
    }
`;

export const EmptyState = styled.div`
    padding: 48px 24px;
    text-align: center;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 13px;
    border: 1px dashed ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
`;

export const ErrorText = styled.div`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.accent.error};
    margin-top: -16px;
`;
