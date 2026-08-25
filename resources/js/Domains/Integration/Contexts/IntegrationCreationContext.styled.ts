import styled from 'styled-components';

export const ProviderGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
`;

export const ProviderButton = styled.button`
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    padding: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    text-align: left;

    &:hover {
        border-color: ${({ theme }) => theme.colors.brand};
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    > span {
        min-width: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    strong,
    small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    strong {
        font-size: 13px;
    }

    small {
        color: ${({ theme }) => theme.colors.text.tertiary};
        font-size: 11px;
    }
`;
