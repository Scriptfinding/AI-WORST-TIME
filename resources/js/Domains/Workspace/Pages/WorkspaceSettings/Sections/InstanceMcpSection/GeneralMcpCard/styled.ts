import styled from 'styled-components';

export const SectionHint = styled.div`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-top: -10px;
    line-height: 1.45;
`;

export const CardBody = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 18px;
    min-width: 0;
`;

export const SwitchGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const SwitchHint = styled.div`
    padding-left: 46px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
    line-height: 1.4;
`;

export const Divider = styled.div`
    width: 100%;
    border-top: 1px solid var(--pf-border-default);
`;
