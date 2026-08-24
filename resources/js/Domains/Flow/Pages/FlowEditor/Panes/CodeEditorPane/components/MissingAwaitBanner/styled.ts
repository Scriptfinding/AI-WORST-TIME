import styled from 'styled-components';

export const Banner = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 44px;
    padding: 8px 16px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.accent.warning}38;
    background: ${({ theme }) => theme.colors.accent.warning}10;
`;

export const Content = styled.div`
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 10px;
`;

export const IconWrap = styled.span`
    display: grid;
    flex: 0 0 auto;
    width: 26px;
    height: 26px;
    place-items: center;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.accent.warning}1f;
    color: ${({ theme }) => theme.colors.accent.warning};
`;

export const Text = styled.div`
    display: flex;
    align-items: baseline;
    min-width: 0;
    gap: 8px;
`;

export const Title = styled.span`
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    font-weight: 650;
    white-space: nowrap;
`;

export const Helpers = styled.span`
    overflow: hidden;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const FixButton = styled.button`
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    gap: 6px;
    padding: 5px 10px;
    border: 1px solid ${({ theme }) => theme.colors.accent.warning}66;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.accent.warning};
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: background 120ms ease, border-color 120ms ease;

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.warning};
        background: ${({ theme }) => theme.colors.accent.warning}12;
    }
`;
