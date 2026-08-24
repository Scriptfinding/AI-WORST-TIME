import { Icon } from '@/Shared/UI/Icon/Icon';
import styled from 'styled-components';

export const Section = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

export const Label = styled.label`
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const TeamFolderLabel = styled(Label)`
    margin-top: 12px;
`;

export const FolderButton = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};
    text-align: left;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
        border-color: ${({ theme }) => theme.colors.border.focus};
    }
`;

export const Chevron = styled(Icon)`
    margin-left: auto;
    opacity: 0.5;
`;

export const DisabledHint = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    font-size: 12px;
    line-height: 1.4;
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    border: 1px dashed ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
`;
