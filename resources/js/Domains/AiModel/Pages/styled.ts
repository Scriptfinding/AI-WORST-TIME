import styled from 'styled-components';

export const HeaderActions = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const BetaBanner = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding: 13px 15px;
    border: 1px solid ${({ theme }) => theme.mode === 'dark'
        ? 'rgba(245, 158, 11, 0.05)'
        : 'rgba(217, 119, 6, 0.05)'};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: ${({ theme }) => theme.mode === 'dark'
        ? 'linear-gradient(110deg, rgba(245, 158, 11, 0.13), rgba(249, 115, 22, 0.05))'
        : 'linear-gradient(110deg, #fff9e8, #fff3e7)'};
`;

export const BetaBannerIcon = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    flex: 0 0 auto;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.accent.warningBg};
    color: ${({ theme }) => theme.colors.accent.warning};
`;

export const BetaBannerContent = styled.div`
    display: grid;
    min-width: 0;
    gap: 3px;
`;

export const BetaBannerTitle = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    font-weight: 700;
`;

export const BetaBadge = styled.span`
    display: inline-flex;
    align-items: center;
    padding: 2px 7px;
    border-radius: ${({ theme }) => theme.radius.full};
    background: ${({ theme }) => theme.colors.accent.warningBg};
    color: ${({ theme }) => theme.colors.accent.warning};
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.08em;
    line-height: 1.3;
    text-transform: uppercase;
`;

export const BetaBannerDescription = styled.div`
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    line-height: 1.45;
`;

export const Toolbar = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 16px;
`;

export const SearchBar = styled.form`
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 220px;
    max-width: 300px;
    padding: 6px 10px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.text.tertiary};

    &:focus-within {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const SearchInput = styled.input`
    flex: 1;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
`;

export const IconButton = styled.button`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 3px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const ResetBanner = styled.button`
    width: 100%;
    margin: -4px 0 16px;
    padding: 9px 12px;
    border: 1px solid ${({ theme }) => theme.colors.accent.primary}33;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.accent.primary}10;
    color: ${({ theme }) => theme.colors.accent.primary};
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
`;

export const Empty = styled.div`
    padding: 52px 16px;
    text-align: center;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 13px;
`;

export const TableWrapper = styled.div`
    width: 100%;
    overflow-x: auto;
`;

export const Table = styled.table`
    width: 100%;
    min-width: 960px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    border-collapse: separate;
    border-spacing: 0;
    overflow: hidden;
`;

export const Th = styled.th<{ $center?: boolean; $width?: number }>`
    width: ${({ $width }) => $width ? `${$width}px` : undefined};
    padding: 10px 14px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
    font-weight: 600;
    text-align: ${({ $center }) => $center ? 'center' : 'left'};
    text-transform: uppercase;
    letter-spacing: 0.04em;
`;

export const Td = styled.td<{ $center?: boolean; $indent?: number }>`
    padding: 10px 14px;
    padding-left: ${({ $indent }) => $indent ? `${$indent}px` : undefined};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    text-align: ${({ $center }) => $center ? 'center' : 'left'};
    tr:last-child & {
        border-bottom: 0;
    }
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
        border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    }
`;

export const GroupHeaderButton = styled.button<{ $depth: number }>`
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    padding: 6px 14px;
    padding-left: ${({ $depth }) => `${14 + $depth * 16}px`};
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

    svg {
        flex-shrink: 0;
    }
`;

export const GroupCount = styled.span`
    margin-left: auto;
    font-size: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    opacity: 0.8;
`;

export const Identity = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const Reference = styled.code`
    padding: 2px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    font-size: 12px;
`;

export const ReferenceIcon = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.bg.tertiary};
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const ProviderBadge = styled.span<{ $color?: string }>`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 11px;
    font-weight: 600;
    text-transform: capitalize;
    background: ${({ $color, theme }) => $color ? `${$color}18` : theme.colors.bg.tertiary};
    color: ${({ $color, theme }) => $color ?? theme.colors.text.secondary};
`;

export const ConnectionName = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.secondary};

    svg {
        flex-shrink: 0;
        opacity: 0.5;
    }
`;

export const ConnectionMissing = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
`;

export const ModelName = styled.code`
    display: inline-flex;
    align-items: center;
    min-width: 0;
    max-width: 240px;
    overflow: hidden;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const Count = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    padding: 2px 8px;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.bg.tertiary};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
`;

export const ClickableCount = styled(Count)`
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.accent.primary};
        color: white;
    }
`;

export const DisabledCount = styled(Count)`
    opacity: 0.35;
`;

export const ModalList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 320px;
    overflow-y: auto;
`;

export const ModalItem = styled.div`
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;

    > svg {
        flex-shrink: 0;
    }
`;

export const ModalItemName = styled.span`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 12px;
`;

export const Capability = styled.span`
    display: inline-flex;
    align-items: center;
    margin-left: 6px;
    color: ${({ theme }) => theme.colors.accent.primary};
`;

export const Status = styled.span<{ $active: boolean }>`
    display: inline-flex;
    padding: 2px 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ $active, theme }) => $active ? theme.colors.accent.successBg : theme.colors.accent.defaultBg};
    color: ${({ $active, theme }) => $active ? theme.colors.accent.success : theme.colors.text.tertiary};
    font-size: 11px;
    font-weight: 600;
`;

export const Scope = styled.span<{ $scope: string; $color?: string }>`
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    white-space: nowrap;
    background: ${({ $scope, $color, theme }) =>
        $scope === 'workspace' ? ($color || '#3b82f6') + '18' :
        $scope === 'team' ? (theme.colors.accent.success || '#22c55e') + '18' :
        '#eab30818'};
    color: ${({ $scope, $color, theme }) =>
        $scope === 'workspace' ? ($color || '#3b82f6') :
        $scope === 'team' ? (theme.colors.accent.success || '#22c55e') :
        '#eab308'};
`;

export const OwnerName = styled.span`
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.secondary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
`;

export const Actions = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 3px;
`;

export const DangerIconButton = styled(IconButton)`
    &:hover {
        color: ${({ theme }) => theme.colors.accent.error};
        background: ${({ theme }) => theme.colors.accent.error}15;
    }
`;

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const Label = styled.label`
    display: block;
    margin-bottom: 6px;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    font-weight: 600;
`;

export const ModelFilters = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    flex-wrap: wrap;
`;

export const ModelFilterButton = styled.button<{ $active: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 8px;
    border: 1px solid ${({ $active, theme }) => $active ? theme.colors.brand : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ $active, theme }) => $active ? `${theme.colors.brand}14` : theme.colors.bg.primary};
    color: ${({ $active, theme }) => $active ? theme.colors.brand : theme.colors.text.secondary};
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
`;

export const PickerState = styled.div`
    padding: 16px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
    text-align: center;
`;

export const EmptyIntegrationResult = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 12px;
    border: 1px solid ${({ theme }) => theme.colors.accent.warning}20;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.accent.warningBg};
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
`;

export const EmptyIntegrationResultContent = styled.div`
    flex: 1;
    line-height: 1.45;
`;

export const ErrorText = styled.div`
    color: ${({ theme }) => theme.colors.accent.error};
    font-size: 12px;
`;

export const FormActions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 4px;
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
