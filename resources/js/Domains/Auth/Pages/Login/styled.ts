import styled from 'styled-components';

export const SsoPanel = styled.div`
    display: grid;
    gap: 14px;
    margin-bottom: 16px;
    padding: 16px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: ${({ theme }) => theme.colors.bg.secondary};
`;

export const MethodHeading = styled.div`
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    font-weight: 650;
`;

export const SocialLoginGrid = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
`;

export const SocialLoginButton = styled.a`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    height: 42px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    transition:
        border-color ${({ theme }) => theme.transition.fast},
        background ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.brand};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const Divider = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;

    &::before,
    &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: ${({ theme }) => theme.colors.border.default};
    }
`;
