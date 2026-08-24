import { useMemo, type RefObject } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { handleLinkClick } from '@/Shared/Utils/navigation';
import type { Breadcrumb } from '@/Domains/Folder/types';
import BreadcrumbDropdown from '@/Domains/Flow/Pages/FlowEditor/Breadcrumbs/components/BreadcrumbDropdown/BreadcrumbDropdown';
import * as Dropdown from '@/Domains/Flow/Pages/FlowEditor/Breadcrumbs/shared/dropdown.styled';

interface FolderBreadcrumbMenuProps {
    breadcrumb: Breadcrumb;
    close: () => void;
    dropdownRef: RefObject<HTMLDivElement | null>;
    open: boolean;
    position: { top: number; left: number };
    search: string;
    setSearch: (value: string) => void;
}

export default function FolderBreadcrumbMenu({
    breadcrumb,
    close,
    dropdownRef,
    open,
    position,
    search,
    setSearch,
}: FolderBreadcrumbMenuProps) {
    const siblings = breadcrumb.siblingFolders;
    const href = breadcrumb.href || `/flows?folder_id=${breadcrumb.id}`;
    const explorerParams = new URLSearchParams(href.split('?')[1] ?? '');
    const createParams = new URLSearchParams();
    if (breadcrumb.id !== null) createParams.set('folder_id', String(breadcrumb.id));
    if (explorerParams.get('view') === 'workspace') createParams.set('view', 'workspace');
    const createQuery = createParams.toString();
    const createFlowHref = `/flows/create${createQuery ? `?${createQuery}` : ''}`;
    const options = useMemo(() => {
        const query = search.trim().toLowerCase();
        const folderOptions = [
            { id: breadcrumb.id, name: breadcrumb.name, href, active: true },
            ...(siblings ?? []).map(sibling => ({ ...sibling, active: false })),
        ];

        if (!query) return folderOptions;

        return folderOptions.filter(option => option.name.toLowerCase().includes(query));
    }, [breadcrumb.id, breadcrumb.name, href, search, siblings]);

    return (
        <BreadcrumbDropdown
            dropdownRef={dropdownRef}
            open={open}
            position={position}
            search={search}
            searchPlaceholder="Search folders..."
            onSearchChange={setSearch}
        >
            <Dropdown.Item
                href={createFlowHref}
                onClick={event => {
                    close();
                    handleLinkClick(event, createFlowHref);
                }}
            >
                <Icon icon="lucide:plus" width={14} height={14} />
                <Dropdown.ItemName>Add Flow</Dropdown.ItemName>
            </Dropdown.Item>
            <Dropdown.Divider role="separator" />
            {options.length > 0 ? options.map(option => (
                <Dropdown.Item
                    key={option.id}
                    $active={option.active}
                    href={option.href}
                    onClick={event => {
                        close();
                        handleLinkClick(event, option.href);
                    }}
                >
                    <Icon icon="lucide:folder" width={14} height={14} />
                    <Dropdown.ItemName>{option.name}</Dropdown.ItemName>
                </Dropdown.Item>
            )) : (
                <Dropdown.Empty>No matching folders</Dropdown.Empty>
            )}
        </BreadcrumbDropdown>
    );
}
