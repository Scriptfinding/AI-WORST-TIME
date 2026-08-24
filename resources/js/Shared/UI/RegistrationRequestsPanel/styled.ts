import styled from 'styled-components';

export const Panel = styled.section`
    overflow: hidden;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ theme }) => theme.shadow.sm};
`;

export const Header = styled.header`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 13px 16px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const Title = styled.h2`
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 0;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    font-weight: 600;
`;

export const Count = styled.span`
    display: inline-grid;
    min-width: 20px;
    height: 20px;
    place-items: center;
    padding: 0 6px;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.accent.successBg};
    color: ${({ theme }) => theme.colors.accent.primary};
    font-size: 11px;
    font-weight: 600;
`;

export const List = styled.div`
    display: grid;
`;

export const Row = styled.div`
    display: grid;
    grid-template-columns: minmax(220px, 1fr) auto auto;
    align-items: center;
    gap: 20px;
    padding: 12px 16px;

    & + & {
        border-top: 1px solid ${({ theme }) => theme.colors.border.default};
    }

    @media (max-width: 720px) {
        grid-template-columns: 1fr;
        gap: 10px;
    }
`;

export const Identity = styled.div`
    min-width: 0;
`;

export const Name = styled.div`
    overflow: hidden;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const Email = styled.div`
    overflow: hidden;
    margin-top: 2px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const Status = styled.span<{ $verified: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: ${({ theme, $verified }) => $verified ? theme.colors.accent.success : theme.colors.text.tertiary};
    font-size: 11px;
`;

export const Actions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 6px;
`;
