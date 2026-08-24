import styled from 'styled-components';

export const OperatorDropdown = styled.div`
    position: relative;
`;

export const OperatorButton = styled.button`
    width: 100%;
    min-width: 0;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 7px;
    padding: 10px 9px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    background: ${({ theme }) => theme.colors.bg.primary};
    cursor: pointer;
    text-align: left;

    span {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    > svg {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    small {
        color: ${({ theme }) => theme.colors.text.tertiary};
        font-size: 10px;
        font-weight: 700;
    }

    &:disabled {
        cursor: default;
        opacity: 0.6;
    }
`;

export const OperatorMenu = styled.div`
    position: absolute;
    z-index: 80;
    top: calc(100% + 6px);
    right: 0;
    width: min(360px, 82vw);
    max-height: 320px;
    overflow: auto;
    padding: 8px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.primary};
    box-shadow: ${({ theme }) => theme.shadow.lg};
`;

export const OperatorGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;

    & + & {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid ${({ theme }) => theme.colors.border.default};
    }
`;

export const OperatorGroupLabel = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
`;

export const OperatorOption = styled.button`
    width: 100%;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 7px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    text-align: left;
    cursor: pointer;

    &:hover,
    &[data-active='true'] {
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    span {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    svg {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;
