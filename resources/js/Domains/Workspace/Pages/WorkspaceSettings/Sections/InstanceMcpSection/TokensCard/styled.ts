import styled from 'styled-components';

export const SectionHint = styled.div`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-top: -10px;
    line-height: 1.45;
`;

export const SettingsInlineHint = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    line-height: 1.4;
`;

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 12px;
    min-width: 0;
`;

export const SuccessBox = styled.div`
    border: 1px solid ${({ theme }) => theme.colors.accent.success}40;
    background: ${({ theme }) => theme.colors.accent.success}12;
    color: ${({ theme }) => theme.colors.text.primary};
    border-radius: ${({ theme }) => theme.radius.md};
    padding: 10px 12px;
    font-size: 12px;
    line-height: 1.5;
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 12px 0;

    code {
        display: block;
        font-family: ${({ theme }) => theme.font.mono};
        color: ${({ theme }) => theme.colors.accent.success};
        word-break: break-all;
    }
`;

export const TokenValueRow = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;

    code {
        flex: 1;
        min-width: 0;
    }

    @media (max-width: 640px) {
        align-items: stretch;
        flex-direction: column;
    }
`;

export const EmptyState = styled.div`
    border: 1px dashed ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    margin-top: 18px;
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

export const EndpointBox = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 18px;
    min-width: 0;
`;

export const FormRow = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: 12px;
    min-width: 0;

    @media (max-width: 640px) {
        grid-template-columns: minmax(0, 1fr);
    }
`;

export const TokenList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 18px;
`;

export const TokenItem = styled.div`
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

export const TokenMain = styled.div`
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 7px;
`;

export const TokenHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
`;

export const TokenName = styled.div`
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const TokenPreview = styled.code`
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.text.secondary};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    border-radius: ${({ theme }) => theme.radius.sm};
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 11px;
    padding: 2px 6px;
`;

export const TokenMeta = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
`;
