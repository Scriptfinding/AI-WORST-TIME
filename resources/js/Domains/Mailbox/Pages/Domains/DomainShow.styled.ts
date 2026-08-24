import styled from 'styled-components';

export const InfoGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    padding: 16px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border-radius: ${({ theme }) => theme.radius.md};
    margin-bottom: 32px;
`;

export const InfoItem = styled.div``;

export const InfoLabel = styled.dt`
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-bottom: 4px;
`;

export const InfoValue = styled.dd`
    font-size: 13px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.primary};
    margin: 0;
`;

export const Section = styled.div`
    margin-bottom: 24px;
`;

export const SectionTitle = styled.h2`
    font-size: 16px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
    margin: 0 0 8px;
`;

export const SectionDesc = styled.p`
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin: 0 0 16px;
`;

export const TabsBar = styled.div`
    display: flex;
    gap: 2px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    margin-bottom: 16px;
`;

export const Tab = styled.button<{ $active?: boolean }>`
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 500;
    background: none;
    border: none;
    border-bottom: 2px solid ${({ $active, theme }) => $active ? theme.colors.accent.primary : 'transparent'};
    color: ${({ $active, theme }) => $active ? theme.colors.accent.primary : theme.colors.text.tertiary};
    cursor: pointer;
    margin-bottom: -1px;
    transition: color ${({ theme }) => theme.transition.fast};
    &:hover { color: ${({ theme }) => theme.colors.accent.primary}; }
`;

export const VerifyHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding-top: 24px;
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
`;
