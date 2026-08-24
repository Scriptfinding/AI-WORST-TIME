import styled from 'styled-components';

export const DataPanelLoader = styled.div`
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    min-height: 80px;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.colors.text.tertiary};

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    svg { animation: spin 1s linear infinite; }
`;
