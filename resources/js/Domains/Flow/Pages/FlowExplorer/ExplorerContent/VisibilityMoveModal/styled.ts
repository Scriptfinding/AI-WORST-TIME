import styled from 'styled-components';

export const Warning = styled.div`
    font-size: 13px;
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.text.secondary};

    strong {
        color: ${({ theme }) => theme.colors.text.primary};
        font-weight: 600;
    }
`;
