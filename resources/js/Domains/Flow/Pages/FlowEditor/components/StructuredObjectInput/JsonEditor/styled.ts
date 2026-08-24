import styled from 'styled-components';

export const EditorWrapper = styled.div`
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    overflow: hidden;
`;
