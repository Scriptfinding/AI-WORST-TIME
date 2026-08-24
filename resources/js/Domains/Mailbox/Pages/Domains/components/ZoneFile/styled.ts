import styled from 'styled-components';

export const Block = styled.div`
    position: relative;
    background: ${({ theme }) => theme.mode === 'dark' ? '#1a1a2e' : '#1f2937'};
    border-radius: ${({ theme }) => theme.radius.md};
    padding: 16px;
    overflow-x: auto;
`;

export const Code = styled.pre`
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 12px;
    color: #e5e7eb;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.6;
`;
