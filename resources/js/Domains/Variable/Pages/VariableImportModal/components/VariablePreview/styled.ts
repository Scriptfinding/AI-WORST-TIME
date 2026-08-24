import styled from 'styled-components';

export const Preview = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const List = styled.div`
    max-height: 180px;
    overflow-y: auto;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
`;

export const Row = styled.div<{ $error?: boolean }>`
    display: grid;
    grid-template-columns: minmax(120px, 1fr) 72px minmax(120px, 1.2fr);
    gap: 10px;
    align-items: center;
    padding: 8px 10px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme, $error }) => $error ? `${theme.colors.accent.error}0F` : theme.colors.bg.primary};
    font-size: 12px;

    &:last-child {
        border-bottom: none;
    }
`;

export const Key = styled.code`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const TypeBadge = styled.span<{ $secret?: boolean; $json?: boolean }>`
    justify-self: flex-start;
    padding: 2px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme, $secret, $json }) =>
        $secret ? `${theme.colors.accent.warning}20` : $json ? `${theme.colors.accent.info}20` : theme.colors.bg.hover};
    color: ${({ theme, $secret, $json }) =>
        $secret ? theme.colors.accent.warning : $json ? theme.colors.accent.info : theme.colors.text.tertiary};
    font-weight: 600;
    text-transform: uppercase;
    font-size: 10px;
`;

export const Value = styled.span`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const Error = styled.div`
    grid-column: 1 / -1;
    color: ${({ theme }) => theme.colors.accent.error};
    font-size: 11px;
`;
