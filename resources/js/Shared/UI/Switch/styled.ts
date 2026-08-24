import styled from 'styled-components';

export const Wrapper = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
    user-select: none;

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.colors.border.focus};
        outline-offset: 3px;
        border-radius: 12px;
    }

    &:disabled {
        cursor: default;
        opacity: 0.55;
    }
`;

export const Track = styled.span<{ $checked: boolean }>`
    position: relative;
    width: 34px;
    height: 20px;
    border-radius: 10px;
    background: ${({ theme, $checked }) =>
        $checked ? theme.colors.brand : theme.colors.border.default};
    transition: background ${({ theme }) => theme.transition.fast};
    flex-shrink: 0;
`;

export const Thumb = styled.span<{ $checked: boolean }>`
    position: absolute;
    top: 2px;
    left: ${({ $checked }) => ($checked ? '16px' : '2px')};
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    transition: left ${({ theme }) => theme.transition.fast};
`;

export const Label = styled.span`
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.primary};
`;
