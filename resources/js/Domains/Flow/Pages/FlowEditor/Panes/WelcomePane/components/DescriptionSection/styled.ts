import styled from 'styled-components';
import { EditIcon, EmptyText, SectionLabel } from '@/Domains/Flow/Pages/FlowEditor/Panes/WelcomePane/shared.styled';

export { EditIcon, EmptyText, SectionLabel };

export const DescriptionSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

export const DescriptionBlock = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 8px;

    &:hover ${EditIcon} {
        opacity: 1;
    }
`;

export const DescriptionText = styled.p`
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.secondary};
    line-height: 1.5;
    margin: 0;
    white-space: pre-wrap;
`;

export const InlineTextarea = styled.textarea`
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.secondary};
    background: transparent;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    outline: none;
    width: 100%;
    padding: 6px 8px;
    font-family: inherit;
    line-height: 1.5;
    resize: vertical;
    min-height: 40px;

    &:focus {
        border-color: ${({ theme }) => theme.colors.border.focus};
    }
`;
