import styled, { css } from 'styled-components';

export const FlagsSection = styled.div`
    display: grid;
    width: 100%;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;

    @media (max-width: 640px) {
        grid-template-columns: minmax(0, 1fr);
    }
`;

export const FlagsColumn = styled.div`
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 18px;
`;

export const Section = styled.section`
    width: 100%;
`;

export const SectionTitle = styled.h3`
    margin: 0 0 8px;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
`;

export const FlagsTable = styled.div`
    overflow: hidden;
    border: 1px solid var(--pf-border-default);
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.tertiary};
`;

export const FlagRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 10px;

    & + & {
        border-top: 1px solid var(--pf-border-default);
    }
`;

export const FlagName = styled.span`
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    font-weight: 500;
`;

export const FlagValue = styled.span<{ $muted?: boolean }>`
    color: ${({ theme, $muted }) => ($muted ? theme.colors.text.tertiary : theme.colors.text.primary)};
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    text-align: right;
`;

export const FlagBoolean = styled.span<{ $enabled: boolean }>`
    position: relative;
    display: inline-flex;
    width: 18px;
    height: 18px;
    flex: 0 0 18px;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: ${({ theme, $enabled }) => ($enabled ? '#22c55e' : theme.colors.accent.error)};
    color: #ffffff;

    ${({ $enabled }) => $enabled ? css`
        &::before {
            position: absolute;
            top: 46%;
            left: 50%;
            width: 5px;
            height: 9px;
            border: solid #ffffff;
            border-width: 0 2px 2px 0;
            content: '';
            transform: translate(-50%, -50%) rotate(45deg);
        }
    ` : css`
        &::before,
        &::after {
            position: absolute;
            top: 7.75px;
            left: 4.5px;
            width: 9px;
            height: 2px;
            border-radius: 999px;
            background: #ffffff;
            content: '';
        }

        &::before {
            transform: rotate(45deg);
        }

        &::after {
            transform: rotate(-45deg);
        }
    `}
`;
