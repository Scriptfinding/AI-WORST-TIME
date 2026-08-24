import styled from 'styled-components';
import { NodeField } from './shared.styled';

export const NodeFieldHeader = styled.div`
    display: flex;
    gap: 6px;
    align-items: flex-start;
    align-items: center;
    margin-bottom: 3px;

    @media (max-width: 640px) {
        flex-wrap: wrap;
    }

    label {
        font-size: 12px;
        font-weight: 600;
        color: ${({ theme }) => theme.colors.text.primary};

        @media (max-width: 640px) {
            order: 1;
        }
    }
`;

export const NodeFieldRemoveButton = styled.button`
    width: 14px;
    height: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 1px;
    padding: 0;
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: transparent;
    border: 0;
    cursor: pointer;
    flex-shrink: 0;

    &:hover:not(:disabled) {
        color: #ef4444;
    }

    &:disabled {
        cursor: default;
        opacity: 0.45;
    }

    svg {
        cursor: pointer;
    }

    @media (max-width: 640px) {
        order: 2;
        width: auto;
        min-width: 100%;
        height: 34px;
        margin-top: 6px;
        margin-bottom: 16px;
        border: 1px solid ${({ theme }) => theme.colors.border.default};
        border-radius: ${({ theme }) => theme.radius.sm};
        background: ${({ theme }) => theme.colors.bg.secondary};
    }
`;

export const NodeFieldRemoveButtonLabel = styled.span`
    display: none;

    @media (max-width: 640px) {
        display: inline;
        font-size: 12px;
        font-weight: 600;
    }
`;

export const NodeFieldHelp = styled.p`
    margin: -2px 0 5px;
    font-size: 11px;
    line-height: 1.45;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const NodeFieldError = styled.p`
    margin: -1px 0 3px;
    font-size: 11px;
    line-height: 1.4;
    font-weight: 600;
    color: #ef4444;
`;

export const ExpressionField = styled(NodeField)<{ $inlineLabel?: boolean }>`
    position: relative;
    display: ${({ $inlineLabel }) => ($inlineLabel ? 'grid' : 'flex')};
    grid-template-columns: ${({ $inlineLabel }) => ($inlineLabel ? '78px minmax(0, 1fr)' : undefined)};
    align-items: ${({ $inlineLabel }) => ($inlineLabel ? 'center' : undefined)};
    gap: ${({ $inlineLabel }) => ($inlineLabel ? '6px 8px' : '3px')};
    padding: ${({ $inlineLabel }) => ($inlineLabel ? '3px 0' : '14px')};
    border-color: ${({ $inlineLabel }) => ($inlineLabel ? 'transparent' : undefined)};
    background: ${({ $inlineLabel }) => ($inlineLabel ? 'transparent' : undefined)};
    box-shadow: ${({ $inlineLabel }) => ($inlineLabel ? 'none' : undefined)};

    ${NodeFieldHeader} {
        margin-bottom: ${({ $inlineLabel }) => ($inlineLabel ? '0' : '3px')};
    }

    input:not([data-object-key-input]),
    select,
    textarea {
        padding: ${({ $inlineLabel }) => ($inlineLabel ? '6px 8px' : '10px 11px')};
    }

    textarea {
        min-height: ${({ $inlineLabel }) => ($inlineLabel ? '34px' : '150px')};
    }

    ${NodeFieldHelp},
    ${NodeFieldError} {
        grid-column: ${({ $inlineLabel }) => ($inlineLabel ? '2' : undefined)};
    }

    ${NodeFieldHeader} + * {
        grid-column: ${({ $inlineLabel }) => ($inlineLabel ? '2' : undefined)};
        min-width: 0;
    }

    @media (max-width: 720px) {
        display: flex;
        padding: 14px;
        border-color: ${({ theme }) => theme.colors.border.default};
        background: ${({ theme }) => theme.colors.bg.secondary};

        ${NodeFieldHelp},
        ${NodeFieldError},
        ${NodeFieldHeader} + * {
            grid-column: auto;
        }
    }
`;
