import styled from 'styled-components';

export const ModalTabContent = styled.div`
    min-height: 120px;
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: auto;
    gap: 12px;
`;

export const BrowserEmptyState = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;
