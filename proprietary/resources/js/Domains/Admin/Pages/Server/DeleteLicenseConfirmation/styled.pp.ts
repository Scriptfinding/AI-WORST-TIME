import styled from 'styled-components';

export const Warning = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    border: 1px solid rgba(239, 68, 68, 0.25);
    border-radius: ${({ theme }) => theme.radius.md};
    background: rgba(239, 68, 68, 0.08);
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    line-height: 1.5;

    svg {
        flex-shrink: 0;
        color: #ef4444;
    }
`;
