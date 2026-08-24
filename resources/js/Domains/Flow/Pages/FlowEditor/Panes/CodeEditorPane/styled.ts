import styled from 'styled-components';

export const EditorWrapper = styled.div<{ $hidden?: boolean }>`
    display: ${({ $hidden }) => ($hidden ? 'none' : 'flex')};
    min-height: 0;
    overflow: hidden;
    flex: 1;
    position: relative;
`;

export const CodeColumn = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
`;
