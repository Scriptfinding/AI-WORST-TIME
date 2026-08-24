import styled from 'styled-components';

export const DuplicateModalBody = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const DuplicateSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const DuplicateSectionTitle = styled.div`
    font-size: 12px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const DuplicateError = styled.div`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.accent.error};
`;
