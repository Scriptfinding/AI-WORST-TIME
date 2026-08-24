import styled from 'styled-components';

export const Submenu = styled.div`
    position: relative;
`;

export const Panel = styled.div`
    position: absolute;
    left: calc(100% + 5px);
    top: -5px;
    min-width: 190px;
    padding: 5px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.elevated};
    box-shadow: ${({ theme }) => theme.shadow.md};
`;
