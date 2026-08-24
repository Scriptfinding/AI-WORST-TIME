import styled from 'styled-components';

export const ToggleGroup = styled.div`
    display: grid;
`;

export const ToggleRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 0;

    &:first-child {
        padding-top: 0;
    }

    &:last-child {
        padding-bottom: 0;
    }

    & + & {
        border-top: 1px solid var(--pf-border-default);
    }
`;

export const ToggleInfo = styled.div`
    flex: 1;
`;

export const ToggleLabel = styled.div`
    margin-bottom: 2px;
    font-size: 13px;
    font-weight: 500;
`;
