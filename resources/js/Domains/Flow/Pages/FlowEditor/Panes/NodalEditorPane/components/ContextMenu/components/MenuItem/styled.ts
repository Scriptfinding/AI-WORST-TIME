import styled from 'styled-components';

export const Shortcut = styled.div`
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 3px;

    kbd {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        font-family: ${({ theme }) => theme.font.mono};
        font-size: 10px;
        color: ${({ theme }) => theme.colors.text.tertiary};

        span {
            font-size: 16px;
            line-height: 1;
        }

        b {
            font-size: 13px;
            font-weight: 400;
            line-height: 1;
        }
    }
`;
