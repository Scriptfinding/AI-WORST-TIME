import styled from 'styled-components';

export const Section = styled.section`
    margin-top: 22px;
`;

export const SectionHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;

    @media (max-width: 768px) {
        align-items: flex-start;
        flex-direction: column;
    }
`;

export const SectionTitle = styled.h2`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text.primary};
    margin: 0;
`;

export const SectionHeaderActions = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;

    @media (max-width: 768px) {
        justify-content: flex-start;
        width: 100%;
    }
`;

export const RunListWrap = styled.div<{ $hasBottomPagination?: boolean }>`
    margin-bottom: ${({ $hasBottomPagination }) => $hasBottomPagination ? '0' : '48px'};
`;

export const RunList = styled.div<{ $dimmed?: boolean }>`
    display: flex;
    flex-direction: column;
    gap: 6px;
    opacity: ${({ $dimmed }) => $dimmed ? 0.5 : 1};
    pointer-events: ${({ $dimmed }) => $dimmed ? 'none' : 'auto'};
    transition: opacity 150ms ease;
`;
