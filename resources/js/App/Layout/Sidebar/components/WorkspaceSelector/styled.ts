import styled, { css } from 'styled-components';

export const Wrapper = styled.div<{ $collapsed?: boolean }>`
    position: relative;
    margin: 0 12px 12px;
    display: ${({ $collapsed }) => ($collapsed ? 'none' : 'block')};
`;

export const Select = styled.button`
    width: 100%;
    padding: 8px 10px;
    background: ${({ theme }) => theme.colors.bg.tertiary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.border.light};
    }
`;

export const Name = styled.span`
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const Item = styled.a<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    border-radius: ${({ theme }) => theme.radius.md};
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.secondary};
    transition: all ${({ theme }) => theme.transition.fast};
    cursor: pointer;
    overflow: hidden;
    white-space: nowrap;

    svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
    }

    ${({ $active, theme }) =>
        $active
            ? css`
                  background: ${theme.colors.bg.hover};
                  color: ${theme.colors.text.primary};
              `
            : css`
                  &:hover {
                      background: ${theme.colors.brand};
                      color: ${theme.colors.white};
                  }
              `}
`;

export const Dropdown = styled.div`
    position: absolute;
    top: 100%;
    left: 0;
    min-width: 100%;
    width: max-content;
    margin-top: 4px;
    padding: 6px;
    max-height: 200px;
    overflow-y: auto;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: ${({ theme }) => theme.shadow.md};
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-height: 120px;
    z-index: 50;
`;

export const DropdownTitle = styled.div`
    padding: 4px 8px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-bottom: 4px;
`;

export const ItemLabel = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
`;
