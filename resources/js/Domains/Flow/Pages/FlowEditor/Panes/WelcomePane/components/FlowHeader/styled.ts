import styled from 'styled-components';
import { EditIcon } from '@/Domains/Flow/Pages/FlowEditor/Panes/WelcomePane/shared.styled';

export { EditIcon };

export const IconRow = styled.div`
    margin-top: -28px;
    display: flex;
    align-items: flex-end;
    gap: 14px;
    z-index: 1;
`;

export const IconWrap = styled.button<{ $canEdit: boolean }>`
    border-radius: 9px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    border: 3px solid ${({ theme }) => theme.colors.bg.primary};
    background: ${({ theme }) => theme.colors.bg.primary};
    cursor: ${({ $canEdit }) => ($canEdit ? 'pointer' : 'default')};
    transition: box-shadow ${({ theme }) => theme.transition.fast};
    flex-shrink: 0;
    display: flex;

    & > * {
        border-radius: 6px !important;
    }

    &:hover {
        ${({ $canEdit }) => $canEdit && 'box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);'}
    }
`;

export const HeaderBlock = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    min-width: 0;

    &:hover ${EditIcon} {
        opacity: 1;
    }
`;

export const TitleRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover ${EditIcon} {
        opacity: 1;
    }
`;

export const Title = styled.h2`
    font-size: 20px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text.primary};
    margin: 0;
    line-height: 1.3;
`;

export const SubLine = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const SubLineRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover ${EditIcon} {
        opacity: 1;
    }
`;

export const Dot = styled.span`
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.text.tertiary};
    flex-shrink: 0;
`;

export const InlineInput = styled.input`
    font-size: 20px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text.primary};
    background: transparent;
    border: none;
    border-bottom: 2px solid ${({ theme }) => theme.colors.accent.primary};
    outline: none;
    width: 100%;
    padding: 0 0 2px;
    font-family: inherit;
`;

export const HeaderRow = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 24px;
`;

export const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 3px;
    flex-shrink: 0;
    margin-top: 2px;
`;

export const StatCard = styled.div<{ $accent: string }>`
    display: flex;
    align-items: center;
    gap: 6px;

    &::before {
        content: '';
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: ${({ $accent }) => $accent};
        flex-shrink: 0;
    }
`;

export const StatNumber = styled.span<{ $accent: string }>`
    font-size: 11px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-family: ${({ theme }) => theme.font.mono};
    width: 42px;
    text-align: right;
`;

export const StatLabel = styled.span`
    font-size: 11px;
    flex: 1;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;
