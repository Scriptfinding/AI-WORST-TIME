import styled from 'styled-components';

export const Root = styled.div<{ $invalid?: boolean }>`
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border: 1px solid ${({ theme, $invalid }) => (
        $invalid ? theme.colors.accent.error : theme.colors.border.default
    )};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.secondary};
`;

export const Header = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;

    label {
        display: block;
        margin-bottom: 3px;
        font-size: 13px;
        font-weight: 600;
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const Help = styled.div`
    font-size: 12px;
    line-height: 1.4;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const Rows = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const Row = styled.div`
    display: grid;
    grid-template-columns: minmax(120px, 0.85fr) minmax(120px, 0.85fr) minmax(140px, 1fr) 30px;
    align-items: center;
    gap: 8px;

    @media (max-width: 720px) {
        grid-template-columns: 1fr;
    }
`;

export const ColumnRow = styled(Row)`
    grid-template-columns: minmax(180px, 1fr) minmax(140px, 0.75fr) 30px;

    @media (max-width: 720px) {
        grid-template-columns: 1fr;
    }
`;

export const Input = styled.input`
    width: 100%;
    min-width: 0;
    height: 36px;
    padding: 0 10px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;

    &:focus {
        outline: none;
        border-color: ${({ theme }) => theme.colors.brand};
        box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.brand}1a;
    }
`;

export const ValueField = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) 38px;
    gap: 5px;
    min-width: 0;
`;

export const RemoveButton = styled.button`
    display: inline-flex;
    width: 30px;
    height: 30px;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;

    &:hover:not(:disabled) {
        background: #dc262612;
        color: #dc2626;
    }
`;

export const AddButton = styled.button`
    display: inline-flex;
    align-self: flex-start;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;

    &:hover:not(:disabled) {
        border-color: ${({ theme }) => theme.colors.brand};
        color: ${({ theme }) => theme.colors.brand};
    }
`;

export const Empty = styled.div`
    padding: 12px;
    border: 1px dashed ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    text-align: center;
`;
