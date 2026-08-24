import styled from 'styled-components';

export const SelectField = styled.div`
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding: 14px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};

    label {
        font-size: 12px;
        font-weight: 600;
        color: ${({ theme }) => theme.colors.text.primary};
        text-transform: capitalize;
    }

    select,
    input {
        width: 100%;
        min-width: 0;
        padding: 10px 11px;
        border-radius: ${({ theme }) => theme.radius.md};
        border: 1px solid ${({ theme }) => theme.colors.border.default};
        color: ${({ theme }) => theme.colors.text.primary};
        font-size: 12px;
        background: ${({ theme }) => theme.colors.bg.primary};
        outline: none;
    }

    select {
        cursor: pointer;
    }

    input {
        cursor: text;
    }
`;

export const FieldHelp = styled.p`
    margin: 0;
    font-size: 11px;
    line-height: 1.45;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const PickerLabel = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 10px;
`;

export const PickerButton = styled.button<{ $active?: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 7px;
    border: 1px solid ${({ theme }) => theme.colors.brand}66;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.brand};
    background: ${({ theme, $active }) => (
        $active ? `${theme.colors.brand}24` : `${theme.colors.brand}0d`
    )};
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    transition:
        color 160ms ease,
        background 160ms ease,
        border-color 160ms ease,
        box-shadow 180ms ease;

    svg {
        transition: transform 180ms cubic-bezier(.2, .8, .2, 1);
    }

    &:hover:not(:disabled) {
        border-color: ${({ theme }) => theme.colors.brand};
        color: ${({ theme }) => theme.colors.white};
        background: ${({ theme }) => theme.colors.brand};
        box-shadow: none;

        svg {
            transform: scale(1.08);
        }
    }

    &:active:not(:disabled) {
        box-shadow: none;
    }

    &:disabled {
        opacity: 0.55;
        cursor: default;
    }
`;
