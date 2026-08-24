import styled from 'styled-components';

export const CodePreview = styled.pre`
    max-height: 180px;
    overflow: auto;
    padding: 10px 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 12px;
    line-height: 1.5;
    white-space: pre-wrap;
`;
