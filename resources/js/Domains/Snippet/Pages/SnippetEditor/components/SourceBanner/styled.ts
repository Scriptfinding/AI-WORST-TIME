import styled from 'styled-components';

export const Banner = styled.div<{ $outdated?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    border-bottom: 1px solid ${({ theme, $outdated }) => ($outdated ? theme.colors.accent.warning : theme.colors.accent.primary)}33;
    background: ${({ theme, $outdated }) => ($outdated ? theme.colors.accent.warning : theme.colors.accent.primary)}12;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
`;

export const Text = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const UpdateButton = styled.button`
    padding: 4px 9px;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: 1px solid ${({ theme }) => theme.colors.brand}66;
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.brand};
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;

    &:disabled {
        cursor: wait;
        opacity: 0.7;
    }
`;
