import { useMemo, type RefObject } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import { handleLinkClick } from '@/Shared/Utils/navigation';
import type { SiblingFlow } from '@/Domains/Flow/Pages/FlowEditor/Breadcrumbs/types';
import BreadcrumbDropdown from '@/Domains/Flow/Pages/FlowEditor/Breadcrumbs/components/BreadcrumbDropdown/BreadcrumbDropdown';
import * as Dropdown from '@/Domains/Flow/Pages/FlowEditor/Breadcrumbs/shared/dropdown.styled';
import { BlueprintBadge } from './shared.styled';

interface FlowBreadcrumbMenuProps {
    close: () => void;
    createFlowHref: string;
    dropdownRef: RefObject<HTMLDivElement | null>;
    open: boolean;
    position: { top: number; left: number };
    search: string;
    setSearch: (value: string) => void;
    siblingFlows: SiblingFlow[];
}

export default function FlowBreadcrumbMenu({
    close,
    createFlowHref,
    dropdownRef,
    open,
    position,
    search,
    setSearch,
    siblingFlows,
}: FlowBreadcrumbMenuProps) {
    const filteredSiblingFlows = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return siblingFlows;

        return siblingFlows.filter(siblingFlow => siblingFlow.name.toLowerCase().includes(query));
    }, [search, siblingFlows]);

    return (
        <BreadcrumbDropdown
            dropdownRef={dropdownRef}
            open={open}
            position={position}
            search={search}
            searchPlaceholder="Search flows..."
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
            {filteredSiblingFlows.length > 0 ? filteredSiblingFlows.map(siblingFlow => {
                const href = `/flows/${siblingFlow.id}`;

                return (
                    <Dropdown.Item
                        key={siblingFlow.id}
                        href={href}
                        onClick={event => {
                            close();
                            handleLinkClick(event, href);
                        }}
                    >
                        <FlowIcon flow={siblingFlow} size={16} />
                        <Dropdown.ItemName>{siblingFlow.name}</Dropdown.ItemName>
                        {siblingFlow.library_reference && (
                            <BlueprintBadge title="Imported from library">
                                <Icon icon="lucide:store" width={12} height={12} />
                            </BlueprintBadge>
                        )}
                    </Dropdown.Item>
                );
            }) : (
                <Dropdown.Empty>
                    {siblingFlows.length > 0 ? 'No matching flows' : 'No sibling flows'}
                </Dropdown.Empty>
            )}
        </BreadcrumbDropdown>
    );
}
