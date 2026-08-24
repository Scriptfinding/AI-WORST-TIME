import styled from 'styled-components';

export const Page = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 24px;
    padding-bottom: 60px;

    @media (max-width: 768px) {
        grid-template-columns: minmax(0, 1fr);
    }
`;

export const Column = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
    width: 100%;
`;

export const FullWidth = styled.div`
    min-width: 0;
    grid-column: 1 / -1;
`;

export const Card = styled.div`
    padding: 20px 24px;
    border: 1px solid var(--pf-border-default);
    border-radius: ${({ theme }) => theme.radius.lg};
    background: ${({ theme }) => theme.colors.bg.secondary};
`;

export const CardTitle = styled.h2`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 14px;
    font-weight: 600;
`;

export const AboutRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0;

    & + & {
        border-top: 1px solid var(--pf-border-default);
    }
`;

export const AboutLabel = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 13px;
`;

export const AboutValue = styled.span`
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    font-weight: 500;
`;

export const StorageUsageHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
`;

export const StorageUsageTitle = styled.div`
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    font-weight: 600;
`;

export const StorageUsageValue = styled.div`
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
`;

export const StorageUsageTrack = styled.div`
    height: 8px;
    overflow: hidden;
    margin-top: 12px;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.bg.tertiary};
`;

export const StorageUsageFill = styled.div<{ $width: number; $danger?: boolean; $brand?: boolean }>`
    width: ${({ $width }) => `${Math.min(100, Math.max(0, $width))}%`};
    height: 100%;
    border-radius: inherit;
    background: ${({ theme, $danger, $brand }) =>
        $danger ? theme.colors.accent.error : $brand ? theme.colors.brand : theme.colors.accent.success};
    transition: width ${({ theme }) => theme.transition.fast};
`;

export const StorageUsageMeta = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
    line-height: 1.4;

    @media (max-width: 520px) {
        flex-direction: column;
        gap: 4px;
    }
`;

export const ToggleDescription = styled.div`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
`;
