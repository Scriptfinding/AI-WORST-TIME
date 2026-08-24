import styled from 'styled-components';

export const ModalForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const DestinationSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const DestinationRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const DestinationCurrent = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.secondary};
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    svg {
        flex-shrink: 0;
        opacity: 0.6;
    }
`;

export const InspectContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

export const InspectLoading = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    padding: 16px 0;

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    svg {
        animation: spin 1s linear infinite;
    }
`;

export const InspectEmpty = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    padding: 16px 0;

    svg {
        color: #22c55e;
    }
`;

export const InspectCount = styled.div`
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-transform: uppercase;
    letter-spacing: 0.04em;
`;

export const InspectList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 320px;
    overflow-y: auto;
`;

export const InspectItem = styled.a`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: ${({ theme }) => theme.radius.md};
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    text-decoration: none;
    transition: background 120ms ease;

    &[href]:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const InspectItemLabel = styled.div`
    display: flex;
    flex: 1;
    min-width: 0;
    align-items: center;
    gap: 8px;

    > svg, > div:first-child, > span:first-child {
        flex-shrink: 0;
    }
`;

export const InspectItemName = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    flex: 1;
`;

export const InspectItemEnd = styled.div`
    flex-shrink: 0;
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

