import styled from 'styled-components';

export const Card = styled.div`
    grid-column: 1 / -1;
    padding: 20px 24px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: ${({ theme }) => theme.colors.bg.secondary};
`;

export const Header = styled.div`
    margin-bottom: 18px;
`;

export const Title = styled.h2`
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 14px;
    font-weight: 600;
`;

export const Subtitle = styled.p`
    margin: 5px 0 0;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
    line-height: 1.45;
`;

export const ProviderGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;

    @media (max-width: 760px) {
        grid-template-columns: minmax(0, 1fr);
    }
`;

export const Provider = styled.div`
    display: grid;
    align-content: start;
    gap: 14px;
    min-width: 0;
    padding: 16px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.tertiary};
`;

export const ProviderHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
`;

export const ProviderName = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    font-weight: 650;
`;

export const Status = styled.span<{ $linked: boolean }>`
    padding: 3px 7px;
    border-radius: 999px;
    background: ${({ $linked }) => $linked ? 'rgba(22, 163, 74, 0.12)' : 'rgba(100, 116, 139, 0.12)'};
    color: ${({ $linked }) => $linked ? '#16a34a' : '#64748b'};
    font-size: 10px;
    font-weight: 700;
`;

export const Identity = styled.div`
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    line-height: 1.45;
`;

export const IdentityName = styled.div`
    color: ${({ theme }) => theme.colors.text.primary};
    font-weight: 600;
`;

export const Form = styled.form`
    display: grid;
    gap: 12px;
`;

export const Unlink = styled.div`
    display: grid;
    gap: 10px;
    padding-top: 14px;
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const Hint = styled.div`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
    line-height: 1.4;
`;

export const Empty = styled.div`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
`;
