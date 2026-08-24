import styled, { css } from 'styled-components';

export const Nav = styled.nav`
    flex: 1;
    padding: 0 8px;
    overflow-y: auto;
`;

export const Section = styled.div`
    margin-bottom: 16px;
    display: flex;
    flex-direction: column;
    gap: 3px;
`;

export const SectionTitle = styled.div<{ $collapsed?: boolean }>`
    padding: 4px 8px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-bottom: 4px;
    display: ${({ $collapsed }) => ($collapsed ? 'none' : 'block')};
`;

export const Item = styled.a<{ $active?: boolean; $collapsed?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    border-radius: ${({ theme }) => theme.radius.md};
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.secondary};
    transition: all ${({ theme }) => theme.transition.fast};
    cursor: pointer;
    justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};
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

export const ItemLabel = styled.span<{ $collapsed?: boolean }>`
    display: ${({ $collapsed }) => ($collapsed ? 'none' : 'inline')};
    overflow: hidden;
    text-overflow: ellipsis;
`;
