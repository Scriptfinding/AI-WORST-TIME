import styled from 'styled-components';

export const SidePanelSection = styled.div`
    padding: 16px 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    flex: 1;
    min-height: 0;
    overflow-y: auto;
`;

export const SidePanelSectionInner = styled.div`
    padding: 0 16px;
    margin-top: 10px;
`;

export const StickyHeader = styled.div`
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    margin-bottom: 4px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);

    > button {
        border-color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const StickyHeaderTitle = styled.h3`
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const SectionTitle = styled.h3`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-bottom: 12px;
`;

export const SectionHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;

    ${SectionTitle} {
        margin-bottom: 0;
    }
`;

export const SectionHeaderActions = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const EmptyText = styled.span`
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const RunListEmpty = styled.div`
    text-align: center;
    padding: 20px 0;
`;
