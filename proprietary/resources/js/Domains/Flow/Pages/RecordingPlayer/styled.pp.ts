import styled from 'styled-components';
import { Link } from '@inertiajs/react';

export const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    background: ${({ theme }) => theme.colors.bg.primary};
    overflow: hidden;
`;

export const TopBar = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 16px;
    height: 44px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    flex-shrink: 0;
    z-index: 10;
    white-space: nowrap;
    overflow: hidden;
`;

export const BackLink = styled(Link)`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 6px;
    color: ${({ theme }) => theme.colors.text.secondary};
    flex-shrink: 0;
    transition: background 0.12s, color 0.12s;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.tertiary};
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const Separator = styled.div`
    width: 1px;
    height: 18px;
    background: ${({ theme }) => theme.colors.border.default};
    flex-shrink: 0;
`;

export const FlowName = styled.span`
    font-size: 13px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
`;

export const RunId = styled.span`
    font-size: 11px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.tertiary};
    flex-shrink: 0;
`;

export const Spacer = styled.div`
    flex: 1;
`;

export const RecBadge = styled.span`
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #ef4444;
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid rgba(239, 68, 68, 0.2);
    white-space: nowrap;
    flex-shrink: 0;
`;

export const MetaBar = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding: 6px 16px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    flex-shrink: 0;
`;

export const LegendTag = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.secondary};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    padding: 2px 8px;
    border-radius: 4px;

    svg {
        flex-shrink: 0;
    }
`;

export const MetaChip = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 1px 6px;
    font-size: 10px;
    font-family: ${({ theme }) => theme.font.mono};
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: 3px;
    white-space: nowrap;

    a {
        color: inherit;
        text-decoration: underline;
        cursor: pointer;

        &:hover {
            opacity: 0.8;
        }
    }
`;

export const MetaChipKey = styled.span`
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const PlayerWrapper = styled.div`
    flex: 1;
    min-height: 0;
    display: flex;
    padding: 12px;
`;

export const PlayerInner = styled.div`
    flex: 1;
    min-height: 0;
    display: flex;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const NoRecording = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 40px;
    text-align: center;
    background: ${({ theme }) => theme.colors.bg.secondary};
`;

export const NoRecordingIcon = styled.div<{ $success?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: ${({ $success }) => $success ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)'};
    color: ${({ $success }) => $success ? '#22c55e' : '#ef4444'};
`;

export const NoRecordingTitle = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const NoRecordingDesc = styled.div`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.secondary};
    max-width: 400px;
    line-height: 1.5;
`;

export const NoRecordingError = styled.pre`
    font-size: 11px;
    font-family: ${({ theme }) => theme.font.mono};
    color: #ef4444;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: 6px;
    padding: 12px 16px;
    max-width: 600px;
    white-space: pre-wrap;
    word-break: break-word;
    text-align: left;
    margin: 0;
`;
