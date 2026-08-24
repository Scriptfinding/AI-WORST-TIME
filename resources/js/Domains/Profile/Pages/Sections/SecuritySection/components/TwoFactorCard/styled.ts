import styled from 'styled-components';

export const Card = styled.div`
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    padding: 20px 24px;
`;

export const CardTitle = styled.h2`
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

export const Actions = styled.div`
    display: flex;
    gap: 12px;

    @media (max-width: 520px) {
        flex-direction: column;
    }
`;

export const Status = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
`;

export const Badge = styled.span<{ $enabled: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: ${({ theme }) => theme.radius.sm};
    width: fit-content;
    color: ${({ theme, $enabled }) => $enabled ? theme.colors.accent.success ?? '#22c55e' : theme.colors.text.tertiary};
    background: ${({ theme, $enabled }) => $enabled ? (theme.colors.accent.successBg ?? '#22c55e18') : theme.colors.bg.hover};
`;

export const Hint = styled.p`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin: 0;
    line-height: 1.4;
`;
