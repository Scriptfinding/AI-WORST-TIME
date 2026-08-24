import styled from 'styled-components';

export const Badge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    padding: 4px 7px;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.secondary};
    background: ${({ theme }) => theme.colors.bg.secondary};
    font-size: 11px;
    line-height: 1.2;
    user-select: text;

    span {
        color: ${({ theme }) => theme.colors.text.tertiary};
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    strong {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: ${({ theme }) => theme.colors.text.primary};
        font-family: ${({ theme }) => theme.font.mono};
        font-weight: 600;
    }
`;
