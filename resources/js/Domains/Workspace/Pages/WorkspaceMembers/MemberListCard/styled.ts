import styled from 'styled-components';
import { CardTitle } from '@/Domains/Workspace/Pages/WorkspaceMembers/shared.styled';

export const CardHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;

    ${CardTitle} {
        min-width: 0;
        margin-bottom: 0;
    }
`;

export const AddButtonLabel = styled.span`
    @media (max-width: 520px) {
        display: none;
    }
`;

export const HeaderActions = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const MemberCount = styled.span`
    font-size: 12px;
    font-weight: 400;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const SearchInput = styled.input`
    width: 100%;
    min-width: 0;
    padding: 8px 12px 8px 32px;
    font-size: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    &:focus {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const SearchWrapper = styled.div`
    position: relative;
    margin-bottom: 12px;
    min-width: 0;

    svg {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: ${({ theme }) => theme.colors.text.tertiary};
        pointer-events: none;
    }
`;
