import styled from 'styled-components';

export const Rail = styled.div<{ $side: 'left' | 'right' }>`
    position: absolute;
    ${({ $side }) => ($side === 'left' ? 'right: calc(100% + 18px);' : 'left: calc(100% + 18px);')}
    top: 50%;
    width: 128px;
    max-height: calc(100vh - 64px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    transform: translateY(-50%);
    overflow: auto;
    padding: 6px;
    z-index: 2;
    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }

    @media (max-width: 1120px) {
        display: none;
    }

    * {
        cursor: pointer !important;
    }
`;
