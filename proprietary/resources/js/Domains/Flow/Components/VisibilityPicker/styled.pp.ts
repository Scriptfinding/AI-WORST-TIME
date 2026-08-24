import styled from 'styled-components';

export const PickerWrapper = styled.div<{ $disabled?: boolean }>`
    display: flex;
    flex-direction: column;
    gap: 16px;
    opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
    pointer-events: ${({ $disabled }) => ($disabled ? 'none' : 'auto')};
`;

export const DisabledHint = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-style: italic;
    pointer-events: auto;
`;
