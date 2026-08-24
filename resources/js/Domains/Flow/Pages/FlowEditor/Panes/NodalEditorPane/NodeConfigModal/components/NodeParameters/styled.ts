import styled from 'styled-components';

export const Form = styled.div`
    width: 100%;
    min-height: 0;
    margin: 0 auto;
    padding: 8px;
    overflow: auto;
`;

export const Section = styled.section`
    margin-bottom: 18px;
`;

export const SectionTitle = styled.div`
    margin-bottom: 12px;

    strong {
        display: block;
        font-size: 14px;
        color: ${({ theme }) => theme.colors.text.primary};
    }

    span {
        display: block;
        margin-top: 5px;
        font-size: 12px;
        line-height: 1.5;
        color: ${({ theme }) => theme.colors.text.secondary};
    }
`;

export const RequirementBanner = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
    border: 1px solid ${({ theme }) => theme.colors.accent.warning}40;
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.accent.warning};
    background: ${({ theme }) => theme.colors.accent.warningBg};

    > svg {
        flex: 0 0 auto;
        margin-top: 1px;
    }

    > div {
        min-width: 0;
    }

    strong,
    span {
        display: block;
    }

    strong {
        font-size: 12px;
        color: ${({ theme }) => theme.colors.text.primary};
    }

    span {
        margin-top: 4px;
        font-size: 11px;
        line-height: 1.5;
        color: ${({ theme }) => theme.colors.text.secondary};
    }

    button {
        padding: 0;
        border: 0;
        color: ${({ theme }) => theme.colors.accent.warning};
        background: transparent;
        font-weight: 600;
        text-decoration: underline;
        text-underline-offset: 2px;
        cursor: pointer;

        &:disabled {
            cursor: default;
            opacity: 0.6;
        }
    }
`;

export const Empty = styled.div`
    padding: 24px 16px;
    text-align: center;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const Fields = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 14px;
`;

export const SchemaField = styled.label`
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.secondary};

    strong {
        color: ${({ theme }) => theme.colors.text.primary};
    }

    input {
        width: 100%;
        padding: 9px 10px;
        border: 1px solid ${({ theme }) => theme.colors.border.default};
        border-radius: ${({ theme }) => theme.radius.sm};
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.primary};
        outline: none;
    }

    input:focus {
        border-color: ${({ theme }) => theme.colors.border.focus};
    }
`;
