import styled from 'styled-components';
import { Link } from '@inertiajs/react';

export const FormFields = styled.div`
    display: flex;
    flex-direction: column;
    gap: 14px;
`;

export const EmptyState = styled.div<{ $compact?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: ${({ $compact }) => $compact ? '20px 12px' : '32px 16px'};
    text-align: center;
`;

export const EmptyIcon = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${({ theme }) => theme.colors.bg.hover};
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const EmptyTitle = styled.div`
    font-size: 13px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const EmptyDesc = styled.div`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    line-height: 1.5;
`;

export const EmptyLink = styled(Link)`
    color: ${({ theme }) => theme.colors.accent.primary};
    font-weight: 500;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;
