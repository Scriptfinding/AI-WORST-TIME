import styled from 'styled-components';

export const Section = styled.section`
    margin-bottom: 32px;

    &:last-of-type {
        padding-bottom: 40px;
    }
`;

export const SectionTitle = styled.h2`
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 12px;
`;

export const RunList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const EmptyRunItem = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    font-size: 13px;
    cursor: pointer;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.border.light};
    }

    @media (max-width: 768px) {
        flex-wrap: wrap;
    }
`;

export const EmptyText = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
`;
