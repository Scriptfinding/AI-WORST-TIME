import styled from 'styled-components';

export const HeaderMeta = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    min-width: 0;
`;

export const HeaderMetaLabel = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    flex-shrink: 0;
`;

export const HeaderMetaEntries = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    min-width: 0;
`;

export const HeaderMetaChip = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    font-size: 11px;
    font-family: ${({ theme }) => theme.font.mono};
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};

    a {
        color: inherit;
        text-decoration: underline;
        cursor: pointer;

        &:hover {
            opacity: 0.8;
        }
    }
`;

export const HeaderMetaChipKey = styled.span`
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.secondary};
`;
