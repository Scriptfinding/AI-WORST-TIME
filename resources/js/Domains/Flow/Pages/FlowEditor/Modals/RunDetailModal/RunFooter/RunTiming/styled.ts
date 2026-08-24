import styled from 'styled-components';

export const TimingItem = styled.span<{ $urgent?: boolean }>`
    font-size: 12px;
    color: ${({ $urgent, theme }) => $urgent
        ? 'var(--accent-error, #ef4444)'
        : theme.colors.text.tertiary};
    display: inline-flex;
    align-items: center;
    gap: 3px;
`;
