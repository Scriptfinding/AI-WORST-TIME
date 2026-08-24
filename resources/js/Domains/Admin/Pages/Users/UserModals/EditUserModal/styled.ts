import styled from 'styled-components';

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

export const Section = styled.div`
    & + & {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid ${({ theme }) => theme.colors.border.default};
    }
`;

export const SectionTitle = styled.div`
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-bottom: 12px;
`;

export const ToggleRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
`;

export const ToggleLabel = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
`;

export const ToggleLabelText = styled.span`
    font-size: 13px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const ToggleHint = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const OwnRoleHint = styled(ToggleHint)`
    margin-top: 6px;
`;

export const Toggle = styled.button<{ $active?: boolean }>`
    position: relative;
    width: 36px;
    height: 20px;
    border-radius: 999px;
    flex-shrink: 0;
    background: ${({ theme, $active }) => $active ? theme.colors.accent.primary : theme.colors.bg.tertiary};
    border: 1px solid ${({ theme, $active }) => $active ? theme.colors.accent.primary : theme.colors.border.default};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

export const ToggleKnob = styled.span<{ $active?: boolean }>`
    position: absolute;
    top: 2px;
    left: ${({ $active }) => $active ? '17px' : '2px'};
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: white;
    transition: left ${({ theme }) => theme.transition.fast};
`;
