import styled from 'styled-components';

export const SectionHint = styled.div`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-top: -10px;
    line-height: 1.45;
`;

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 12px;
    min-width: 0;
`;

export const EmptyState = styled.div`
    border: 1px dashed ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    padding: 18px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 13px;
    text-align: center;
`;

export const ModeLabel = styled.div`
    display: inline-flex;
    width: fit-content;
    align-items: center;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.bg.tertiary};
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.04em;
    margin-bottom: 12px;
    padding: 3px 8px;
    text-transform: uppercase;
`;

export const EndpointGrid = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
    margin-top: 18px;
    min-width: 0;
`;

export const ClientForm = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) auto;
    align-items: end;
    gap: 12px;
    min-width: 0;

    @media (max-width: 900px) {
        grid-template-columns: minmax(0, 1fr);
    }
`;

export const Columns = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 18px;
    margin-top: 18px;
    min-width: 0;

    @media (max-width: 980px) {
        grid-template-columns: minmax(0, 1fr);
    }
`;

export const Column = styled.div`
    min-width: 0;
`;

export const SubsectionTitle = styled.h3`
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 10px;
`;

export const ItemList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 18px;
`;

export const Item = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    min-width: 0;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.primary};
    border-radius: ${({ theme }) => theme.radius.md};
    padding: 12px 14px;

    @media (max-width: 640px) {
        align-items: flex-start;
        flex-direction: column;
    }
`;

export const ItemMain = styled.div`
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 7px;
`;

export const ItemHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
`;

export const ItemName = styled.div`
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const ItemPreview = styled.code`
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.text.secondary};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    border-radius: ${({ theme }) => theme.radius.sm};
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 11px;
    padding: 2px 6px;
`;

export const ItemMeta = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
`;
