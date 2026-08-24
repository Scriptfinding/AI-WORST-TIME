import styled from 'styled-components';

export const Section = styled.div`
    display: grid;
    gap: 20px;
    width: 100%;
    padding-bottom: 60px;
`;

export const Intro = styled.div`
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 13px;
    line-height: 1.55;
`;

export const Cards = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
    align-items: start;

    @media (max-width: 1050px) {
        grid-template-columns: minmax(0, 1fr);
    }
`;

export const Card = styled.div`
    min-width: 0;
    padding: 22px 24px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: ${({ theme }) => theme.colors.bg.secondary};
`;

export const Header = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
`;

export const Heading = styled.div`
    display: flex;
    gap: 12px;
    min-width: 0;
`;

export const IconBox = styled.div`
    display: grid;
    width: 36px;
    height: 36px;
    flex: 0 0 auto;
    place-items: center;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => `${theme.colors.brand}18`};
    color: ${({ theme }) => theme.colors.brand};
`;

export const Title = styled.h2`
    margin: 0;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 15px;
    font-weight: 650;
`;

export const Description = styled.p`
    margin: 4px 0 0;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
    line-height: 1.45;
`;

export const HeaderToggle = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 9px;
    flex: 0 0 auto;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    font-weight: 650;
    white-space: nowrap;
`;

export const Form = styled.form`
    display: grid;
    gap: 18px;
`;

export const ErrorMessage = styled.div`
    padding: 9px 11px;
    border: 1px solid rgba(220, 38, 38, 0.3);
    border-radius: ${({ theme }) => theme.radius.md};
    background: rgba(220, 38, 38, 0.08);
    color: #dc2626;
    font-size: 12px;
`;

export const TestResultMessage = styled.div<{ $status: 'success' | 'error' }>`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border: 1px solid ${({ $status }) =>
        $status === 'success' ? 'rgba(22, 163, 74, 0.3)' : 'rgba(220, 38, 38, 0.3)'};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ $status }) =>
        $status === 'success' ? 'rgba(22, 163, 74, 0.08)' : 'rgba(220, 38, 38, 0.08)'};
    color: ${({ $status }) => $status === 'success' ? '#16a34a' : '#dc2626'};
    font-size: 13px;
    line-height: 1.45;

    svg {
        flex: 0 0 auto;
    }
`;

export const WarningMessage = styled.div`
    padding: 9px 11px;
    border: 1px solid rgba(217, 119, 6, 0.3);
    border-radius: ${({ theme }) => theme.radius.md};
    background: rgba(217, 119, 6, 0.08);
    color: #d97706;
    font-size: 12px;
    line-height: 1.45;
`;

export const FormGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;

    @media (max-width: 620px) {
        grid-template-columns: minmax(0, 1fr);
    }
`;

export const FullField = styled.div`
    grid-column: 1 / -1;
`;

export const Group = styled.div`
    display: grid;
    gap: 14px;
    padding-top: 18px;
    border-top: 1px solid var(--pf-border-default);
`;

export const GroupTitle = styled.div`
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
`;

export const ToggleRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
`;

export const ToggleCopy = styled.div`
    min-width: 0;
`;

export const ToggleLabel = styled.div`
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    font-weight: 600;
`;

export const ToggleHint = styled.div`
    margin-top: 2px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
    line-height: 1.4;
`;

export const ProvisioningPanel = styled.div`
    display: grid;
    gap: 14px;
    padding: 14px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
`;

export const WorkspaceField = styled.div`
    display: grid;
    gap: 7px;
`;

export const FieldLabel = styled.div`
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    font-weight: 600;
`;

export const FieldHint = styled.div`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
    line-height: 1.45;
`;

export const FieldError = styled.div`
    color: #dc2626;
    font-size: 11px;
    line-height: 1.45;
`;

export const Footer = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding-top: 18px;
    border-top: 1px solid var(--pf-border-default);
`;

export const Actions = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
`;

export const Validation = styled.div`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
`;
