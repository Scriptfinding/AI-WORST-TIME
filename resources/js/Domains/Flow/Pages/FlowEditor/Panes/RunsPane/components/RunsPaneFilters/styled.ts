import styled from 'styled-components';

export const Section = styled.div`
    margin-bottom: 12px;
    overflow: hidden;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
`;

export const Header = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
`;

export const ToggleWrapper = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
    gap: 6px;
`;

export const Toggle = styled.button`
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    padding: 8px 10px;
    border: none;
    background: none;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: color ${({ theme }) => theme.transition.fast};
    gap: 6px;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const Body = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0 10px 10px;
    gap: 8px;
`;

export const Separator = styled.div`
    margin: 4px 0;
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const FilterFooter = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-top: 4px;
    gap: 6px;
`;
