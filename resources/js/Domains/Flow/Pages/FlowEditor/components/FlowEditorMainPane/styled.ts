import styled from 'styled-components';

export const LeftColumn = styled.div<{ $hidden?: boolean }>`
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;

    @media (max-width: 768px) {
        display: ${({ $hidden }) => ($hidden ? 'none' : 'flex')};
    }
`;
