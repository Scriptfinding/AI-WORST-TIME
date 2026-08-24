import styled from 'styled-components';

export const Layout = styled.div`
    display: flex;
    flex: 1;
    min-width: 0;
    min-height: 0;
    background: ${({ theme }) => theme.colors.border.default};
    gap: 1px;

    @media (max-width: 768px) {
        flex-direction: column;
    }
`;

export const Preview = styled.div`
    display: flex;
    flex: 1;
    min-width: 0;
    min-height: 0;
    padding: 12px;
    background: ${({ theme }) => theme.colors.bg.secondary};
`;

export const PreviewContent = styled.div`
    display: flex;
    flex: 1;
    min-width: 0;
    min-height: 0;
`;

export const Sidebar = styled.aside`
    display: flex;
    flex-direction: column;
    width: 330px;
    min-width: 280px;
    min-height: 0;
    background: ${({ theme }) => theme.colors.bg.secondary};

    @media (max-width: 768px) {
        width: 100%;
        min-width: 0;
        height: 300px;
    }
`;

export const SidebarHeader = styled.div`
    padding: 14px 16px 12px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const SidebarTitle = styled.div`
    font-size: 13px;
    font-weight: 650;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const SidebarCaption = styled.div`
    margin-top: 3px;
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const Timeline = styled.div`
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 10px;
`;

export const VersionRow = styled.div`
    position: relative;
    margin: 2px 0;

    &:not(:last-child)::after {
        content: '';
        position: absolute;
        z-index: 0;
        top: 23px;
        bottom: -11px;
        left: 14px;
        width: 1px;
        background: ${({ theme }) => theme.colors.border.default};
    }
`;

export const VersionButton = styled.button<{ $active: boolean }>`
    position: relative;
    display: flex;
    width: 100%;
    gap: 10px;
    padding: 10px 38px 10px 10px;
    border: 1px solid ${({ theme, $active }) => $active
        ? theme.colors.accent.primary
        : 'transparent'};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme, $active }) => $active
        ? theme.colors.bg.tertiary
        : 'transparent'};
    text-align: left;
    cursor: pointer;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }

`;

export const TimelineMarker = styled.span<{ $current: boolean }>`
    width: 9px;
    height: 9px;
    margin-top: 4px;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
    border: 2px solid ${({ theme, $current }) => $current
        ? theme.colors.brand
        : theme.colors.text.tertiary};
    border-radius: 50%;
    background: ${({ theme, $current }) => $current
        ? theme.colors.brand
        : theme.colors.bg.secondary};
`;

export const VersionBody = styled.span`
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
`;

export const VersionHeading = styled.span`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
`;

export const VersionActions = styled.div`
    position: absolute;
    z-index: 3;
    top: 7px;
    right: 7px;
`;

export const VersionMenuButton = styled.button<{ $open: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: ${({ theme, $open }) => $open ? theme.colors.bg.hover : 'transparent'};

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const VersionMenu = styled.div`
    position: fixed;
    z-index: 2001;
    width: 190px;
    padding: 5px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ theme }) => theme.shadow.lg};
`;

export const VersionMenuItem = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 9px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 11px;
    text-align: left;

    &:hover:not(:disabled) {
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.45;
    }
`;

export const VersionName = styled.span`
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    font-weight: 650;
`;

export const CurrentBadge = styled.span`
    padding: 2px 6px;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.brand}20;
    color: ${({ theme }) => theme.colors.brand};
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
`;

export const VersionMeta = styled.span`
    margin-top: 3px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 10px;
    line-height: 1.4;
`;

export const State = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    min-height: 0;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
`;

export const Title = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 8px;
`;
