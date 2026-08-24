import styled from 'styled-components';

export const Rows = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
    padding-bottom: 60px;
    min-width: 0;
    width: 100%;
`;

export const Card = styled.div`
    min-width: 0;
    max-width: 100%;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    padding: 20px 24px;
`;

export const CardHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
`;

export const CardTitle = styled.h2`
    min-width: 0;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const AddButtonLabel = styled.span`
    @media (max-width: 520px) {
        display: none;
    }
`;

export const SectionHint = styled.div`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-top: -10px;
    line-height: 1.45;
`;

export const ErrorBox = styled.div`
    border: 1px solid ${({ theme }) => theme.colors.accent.error}40;
    background: ${({ theme }) => theme.colors.accent.errorBg};
    color: ${({ theme }) => theme.colors.accent.error};
    border-radius: ${({ theme }) => theme.radius.md};
    padding: 8px 10px;
    font-size: 12px;
    line-height: 1.4;
`;

export const EmptyState = styled.div`
    border: 1px dashed ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    padding: 18px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 13px;
    text-align: center;
    margin-top: 18px;
`;
