import styled from 'styled-components';

export const ContextMenu = styled.div`
    position: fixed;
    min-width: 210px;
    padding: 5px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.elevated};
    box-shadow: ${({ theme }) => theme.shadow.md};
    z-index: 40;
`;
