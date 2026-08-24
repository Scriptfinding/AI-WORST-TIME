import styled from 'styled-components';

export const Rows = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
    padding-bottom: 60px;
    min-width: 0;
    width: 100%;
`;

export const Card = styled.div`
    min-width: 0;
    max-width: 100%;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    padding: 20px 24px;
`;

export const CardHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
`;

export const CardTitle = styled.h2`
    min-width: 0;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const AddButtonLabel = styled.span`
    @media (max-width: 520px) {
        display: none;
    }
`;

export const SectionHint = styled.div`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-top: -10px;
    line-height: 1.45;
`;

export const EmptyState = styled.div`
    border: 1px dashed ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    padding: 18px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 13px;
    text-align: center;
    margin-top: 18px;
`;

export const TableWrapper = styled.div`
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
`;

export const Table = styled.table`
    width: 100%;
    min-width: 900px;
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};

    th {
        padding: 10px 14px;
        color: ${({ theme }) => theme.colors.text.tertiary};
        font-size: 11px;
        font-weight: 600;
        text-align: left;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
        background: ${({ theme }) => theme.colors.bg.secondary};
    }

    thead th:first-child { border-top-left-radius: ${({ theme }) => theme.radius.lg}; }
    thead th:last-child { border-top-right-radius: ${({ theme }) => theme.radius.lg}; }

    td {
        padding: 8px 14px;
        color: ${({ theme }) => theme.colors.text.primary};
        font-size: 13px;
        border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
        white-space: nowrap;
    }

    tbody tr:last-child > td { border-bottom: 0; }
`;

export const GroupRow = styled.tr`
    td {
        padding: 0;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: ${({ theme }) => theme.colors.text.tertiary};
        background: ${({ theme }) => theme.colors.bg.tertiary};
    }
`;

export const GroupButton = styled.button`
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    padding: 6px 14px;
    font: inherit;
    text-transform: inherit;
    letter-spacing: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.colors.text.secondary};
        background: ${({ theme }) => theme.colors.bg.secondary};
    }
`;

export const GroupCount = styled.span`
    margin-left: auto;
    font-size: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    opacity: 0.8;
`;

export const Row = styled.tr`
    td { background: ${({ theme }) => theme.colors.bg.primary}; }
`;

export const ProxyName = styled.div`
    display: inline-block;
    max-width: 220px;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    font-weight: 500;
    font-family: ${({ theme }) => theme.font.mono};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    padding: 1px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const InlineCell = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const Endpoint = styled.span`
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const ScopeBadge = styled.span<{ $scope: string }>`
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ $scope, theme }) =>
        $scope === 'workspace' ? '#3b82f618' :
        $scope === 'team' ? (theme.colors.accent.success || '#22c55e') + '18' :
        '#eab30818'};
    color: ${({ $scope, theme }) =>
        $scope === 'workspace' ? '#3b82f6' :
        $scope === 'team' ? (theme.colors.accent.success || '#22c55e') :
        '#eab308'};
`;

export const Muted = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const OwnerName = styled.span`
    display: inline-block;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
`;

export const Actions = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 6px;
    position: relative;
`;

export const OverflowWrapper = styled.div`
    position: relative;
    flex-shrink: 0;
`;

export const OverflowButton = styled.button`
    width: 30px;
    height: 30px;
    border-radius: ${({ theme }) => theme.radius.md};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.colors.text.secondary};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const OverflowMenu = styled.div`
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 2000;
    min-width: 150px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    padding: 6px;
`;

export const DangerMenuItem = styled.button`
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    padding: 8px 10px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.accent.error};

    &:hover { background: ${({ theme }) => theme.colors.accent.errorBg}; }
`;

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 12px;
    min-width: 0;
`;

export const FormLayout = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
    min-width: 0;
`;

export const Fields = styled.div<{ $columns?: number }>`
    display: grid;
    grid-template-columns: ${({ $columns = 1 }) => `repeat(${$columns}, minmax(0, 1fr))`};
    gap: 12px;
    align-items: start;
    min-width: 0;

    @media (max-width: 560px) {
        grid-template-columns: minmax(0, 1fr);
    }
`;

export const Error = styled.div`
    border: 1px solid ${({ theme }) => theme.colors.accent.error}40;
    padding: 8px 10px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.accent.errorBg};
    color: ${({ theme }) => theme.colors.accent.error};
    font-size: 12px;
    line-height: 1.4;
`;

export const FormActions = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: flex-end;
`;
