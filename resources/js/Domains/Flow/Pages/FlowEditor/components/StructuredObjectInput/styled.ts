import styled from 'styled-components';

export const ObjectInput = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

export const ObjectInputHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
`;

export const ObjectInputHeaderActions = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    margin-left: auto;
`;

export const ObjectInputLabel = styled.label`
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const ObjectInputHint = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;
