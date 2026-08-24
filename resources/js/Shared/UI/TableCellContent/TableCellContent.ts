import styled from 'styled-components';

type CellAlignment = 'start' | 'center' | 'end';

const justifyContent: Record<CellAlignment, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
};

const TableCellContent = styled.div<{ $align?: CellAlignment }>`
    display: flex;
    align-items: center;
    justify-content: ${({ $align = 'start' }) => justifyContent[$align]};
    width: 100%;
    min-width: 0;
    min-height: 24px;
`;

export default TableCellContent;
