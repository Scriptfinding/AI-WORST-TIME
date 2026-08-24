import styled from 'styled-components';

export const Wrapper = styled.div``;

export const TopBar = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-bottom: 4px;
`;

export const ExpandBtn = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
`;

export const FullEditorWrap = styled.div`
    flex: 1;
    min-height: 0;
`;
