import styled from 'styled-components';

export const ModalBody = styled.div`
    display: grid;
    gap: 10px;
`;

export const Help = styled.p`
    margin: 0 0 4px;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    line-height: 1.55;
`;

export const Label = styled.span`
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    font-weight: 500;
`;

export const Error = styled.div`
    color: ${({ theme }) => theme.colors.accent.error};
    font-size: 11px;
`;
