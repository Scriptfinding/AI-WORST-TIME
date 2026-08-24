import { css } from 'styled-components';

export const tableCellStyles = css<{ $center?: boolean; $right?: boolean }>`
    text-align: ${({ $center, $right }) => $center ? 'center' : ($right ? 'right' : 'left')};
    padding: 10px 16px;
    white-space: nowrap;
`;
