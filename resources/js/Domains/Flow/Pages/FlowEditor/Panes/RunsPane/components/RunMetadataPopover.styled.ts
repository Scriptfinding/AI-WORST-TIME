import styled from 'styled-components';

export const MetaPopover = styled.div`
    position: absolute;
    top: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    min-width: 200px;
    max-width: min(500px, 90vw);
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    user-select: text;
    cursor: default;
`;

export const MetaPopoverTitle = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    font-size: 11px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.secondary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    border-radius: ${({ theme }) => theme.radius.md} ${({ theme }) => theme.radius.md} 0 0;
`;

export const MetaPopoverBody = styled.div`
    max-height: 200px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    align-self: stretch;
    gap: 2px;
`;

export const MetaPopoverRow = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: baseline;
    gap: 12px;
    padding: 3px 10px;
    font-size: 11px;
    max-width: 100%;

    &:nth-child(even) {
        background: ${({ theme }) => theme.colors.bg.secondary};
    }
`;

export const MetaPopoverKey = styled.span`
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-family: ${({ theme }) => theme.font.mono};
    flex-shrink: 0;
    white-space: nowrap;
`;

export const MetaPopoverValue = styled.span`
    color: ${({ theme }) => theme.colors.text.primary};
    font-family: ${({ theme }) => theme.font.mono};
    text-align: right;
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    a {
        color: ${({ theme }) => theme.colors.accent.primary};
        text-decoration: underline;
        cursor: pointer;

        &:hover {
            opacity: 0.8;
        }
    }
`;
