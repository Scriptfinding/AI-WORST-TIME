import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
`;

export const Card = styled.div<{ $connected?: boolean; $disabled?: boolean }>`
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    animation: ${fadeIn} 200ms ease;
    transition: border-color 200ms, box-shadow 200ms;
    align-self: baseline;
    opacity: ${({ $disabled }) => $disabled ? 0.65 : 1};
    filter: ${({ $disabled }) => $disabled ? 'grayscale(1)' : 'none'};

    &:hover {
        border-color: ${({ theme, $disabled }) => $disabled ? theme.colors.border.default : `${theme.colors.accent.primary}60`};
        box-shadow: ${({ theme, $disabled }) => $disabled ? 'none' : `0 0 0 1px ${theme.colors.accent.primary}15`};
    }
`;

export const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

export const Info = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

export const Logo = styled.div<{ $color?: string }>`
    width: 38px;
    height: 38px;
    border-radius: ${({ theme }) => theme.radius.md};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    background: ${({ $color }) => $color ? $color + '18' : '#88888818'};
    color: ${({ $color }) => $color || '#888'};
    flex-shrink: 0;
`;

export const Name = styled.div`
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 14px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const SoonBadge = styled.span`
    padding: 2px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.accent.primary}18;
    color: ${({ theme }) => theme.colors.accent.primary};
    font-size: 9px;
    font-weight: 700;
    line-height: 1.4;
    letter-spacing: 0.05em;
    text-transform: uppercase;
`;

export const Type = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const Actions = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
`;

export const DisabledNotice = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    line-height: 1.45;

    svg {
        flex-shrink: 0;
        margin-top: 2px;
    }
`;

export const Separator = styled.div`
    height: 1px;
    background: ${({ theme }) => theme.colors.border.default};
    margin: 0 -20px;
    width: calc(100% + 40px);
`;

export const StatusInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.secondary};
    padding: 8px 10px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.accent.primary}08;
    border: 1px solid ${({ theme }) => theme.colors.accent.primary}20;

    svg {
        color: ${({ theme }) => theme.colors.accent.primary};
        flex-shrink: 0;
    }
`;

export const List = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

export const SectionDivider = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

export const SectionDividerLine = styled.div`
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.border.default};
`;

export const SectionDividerLabel = styled.span`
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    flex-shrink: 0;
`;
