import styled, { css } from 'styled-components';

export const Item = styled.a<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    padding: 6px 10px;
    font-size: 12px;
    border-radius: ${({ theme }) => theme.radius.sm};
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: background ${({ theme }) => theme.transition.fast};

    ${({ $active, theme }) =>
        $active
            ? css`
                  background: ${theme.colors.accent.primary}18;
                  color: ${theme.colors.accent.primary};
                  font-weight: 500;
              `
            : css`
                  color: ${theme.colors.text.secondary};
                  &:hover {
                      background: ${theme.colors.bg.hover};
                      color: ${theme.colors.text.primary};
                  }
              `}
`;

export const ItemName = styled.span`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export const Divider = styled.div`
    height: 1px;
    flex-shrink: 0;
    margin: 2px 4px;
    background: ${({ theme }) => theme.colors.border.default};
`;

export const Empty = styled.div`
    flex-shrink: 0;
    padding: 8px 10px;
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;
