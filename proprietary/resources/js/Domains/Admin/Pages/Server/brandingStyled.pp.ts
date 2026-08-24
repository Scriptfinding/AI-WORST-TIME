import styled from 'styled-components';

export const Preview = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.tertiary};
`;

export const LogoPreview = styled.img`
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: ${({ theme }) => theme.radius.md};
    object-fit: contain;
`;

export const PreviewCopy = styled.div`
    min-width: 0;
`;

export const PreviewName = styled.div`
    overflow: hidden;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 14px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const PreviewHint = styled.div`
    margin-top: 3px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
    line-height: 1.4;
`;

export const LogoActions = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
`;

export const HelpText = styled.div`
    margin-top: 6px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
`;

export const Form = styled.form`
    display: grid;
    gap: 16px;
    margin-top: 18px;
    padding-top: 18px;
    border-top: 1px solid var(--pf-border-default);
`;

export const Field = styled.div`
    display: grid;
    gap: 8px;
`;

export const Label = styled.label`
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    font-weight: 600;
`;

export const Input = styled.input`
    width: 100%;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    outline: none;
    background: ${({ theme }) => theme.colors.bg.tertiary};
    color: ${({ theme }) => theme.colors.text.primary};
    font: inherit;
    font-size: 13px;
    padding: 9px 11px;

    &:focus {
        border-color: ${({ theme }) => theme.colors.accent.primary};
        box-shadow: 0 0 0 3px ${({ theme }) => `${theme.colors.accent.primary}20`};
    }
`;

export const Swatches = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
`;

export const Swatch = styled.button<{ $color: string; $active: boolean }>`
    width: 25px;
    height: 25px;
    flex-shrink: 0;
    border: 0;
    border-radius: ${({ theme }) => theme.radius.sm};
    outline: ${({ $active, theme }) => $active ? `2px solid ${theme.colors.text.primary}` : '2px solid transparent'};
    outline-offset: 2px;
    background: ${({ $color }) => $color};
    cursor: pointer;
    transition: transform ${({ theme }) => theme.transition.fast};

    &:hover {
        transform: scale(1.12);
    }
`;

export const CustomColor = styled.label<{ $active: boolean }>`
    position: relative;
    display: inline-flex;
    width: 25px;
    height: 25px;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid ${({ theme }) => theme.colors.border.light};
    border-radius: ${({ theme }) => theme.radius.sm};
    outline: ${({ $active, theme }) => $active ? `2px solid ${theme.colors.text.primary}` : '2px solid transparent'};
    outline-offset: 2px;
    background: ${({ theme }) => theme.colors.bg.tertiary};
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;

    input {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
    }
`;

export const Actions = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
`;
