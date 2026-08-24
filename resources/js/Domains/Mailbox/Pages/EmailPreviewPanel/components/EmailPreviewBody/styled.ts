import styled from 'styled-components';

export const PreviewContent = styled.div`
    padding: 20px;
`;

export const PreviewSubject = styled.h2`
    font-size: 17px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
    margin: 0 0 16px;
    line-height: 1.3;
`;

export const PreviewMeta = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const MetaRow = styled.div`
    display: flex;
    gap: 8px;
    font-size: 12px;
`;

export const MetaLabel = styled.span`
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.tertiary};
    min-width: 40px;
`;

export const MetaValue = styled.span`
    color: ${({ theme }) => theme.colors.text.primary};
    word-break: break-all;
`;

export const RemoteImagesNotice = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
    padding: 9px 10px 9px 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: 8px;
    background: ${({ theme }) => theme.colors.bg.secondary};
`;

export const RemoteImagesText = styled.span`
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    line-height: 1.4;
`;

export const RemoteImagesButton = styled.button`
    flex: 0 0 auto;
    padding: 5px 9px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: 6px;
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.primary};
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;

    &:hover {
        border-color: ${({ theme }) => theme.colors.text.tertiary};
    }

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.colors.text.primary};
        outline-offset: 2px;
    }
`;

export const PreviewFrame = styled.iframe`
    width: 100%;
    min-height: 420px;
    border: 0;
    background: #fff;
`;

export const TextBody = styled.pre`
    white-space: pre-wrap;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.primary};
    font-family: ${({ theme }) => theme.font.mono};
    line-height: 1.5;
    margin: 0;
`;
