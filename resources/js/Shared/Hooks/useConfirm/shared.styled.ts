import styled from 'styled-components';

export const ConfirmFlowList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 8px 0;
    max-height: 200px;
    overflow-y: auto;
`;

export const ConfirmFlowItem = styled.a`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 6px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    text-decoration: none;
    transition: background 120ms ease;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    > span {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    > svg:last-child {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const ConfirmationFlowItemLabel = styled.div`
    display: flex;
    flex: 1;
    min-width: 0;
    align-items: center;
    gap: 8px;

    > :first-child {
        flex-shrink: 0;
    }

    > span:not(:first-child) {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
        flex: 1;
    }
`;
