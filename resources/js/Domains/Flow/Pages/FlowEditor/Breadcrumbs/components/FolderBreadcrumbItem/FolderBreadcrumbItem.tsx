import { Icon } from '@/Shared/UI/Icon/Icon';
import { handleLinkClick } from '@/Shared/Utils/navigation';
import type { Breadcrumb } from '@/Domains/Folder/types';
import useBreadcrumbDropdown from '@/Domains/Flow/Pages/FlowEditor/Breadcrumbs/hooks/useBreadcrumbDropdown';
import FolderBreadcrumbMenu from './FolderBreadcrumbMenu';
import * as S from './styled';

const ICON_MAP: Record<string, string> = {
    team: 'lucide:users',
    workspace: 'lucide:building-2',
    personal: 'lucide:home',
};

export default function FolderBreadcrumbItem({ breadcrumb }: { breadcrumb: Breadcrumb }) {
    const dropdown = useBreadcrumbDropdown();
    const siblings = breadcrumb.siblingFolders ?? [];
    const href = breadcrumb.href || `/flows?folder_id=${breadcrumb.id}`;
    const iconName = breadcrumb.icon ? ICON_MAP[breadcrumb.icon] : null;

    if (siblings.length === 0) {
        return (
            <S.Item href={href} onClick={event => handleLinkClick(event, href)}>
                {iconName && <Icon icon={iconName} width={12} height={12} style={{ flexShrink: 0, verticalAlign: -1 }} />}
                {breadcrumb.name}
            </S.Item>
        );
    }

    return (
        <S.Wrapper>
            <S.Button ref={dropdown.anchorRef} onClick={dropdown.toggle}>
                {iconName && <Icon icon={iconName} width={12} height={12} style={{ flexShrink: 0, verticalAlign: -1 }} />}
                {breadcrumb.name}
                <Icon icon="lucide:chevron-down" width={10} height={10} />
            </S.Button>
            <FolderBreadcrumbMenu
                breadcrumb={breadcrumb}
                close={dropdown.close}
                dropdownRef={dropdown.dropdownRef}
                open={dropdown.open}
                position={dropdown.position}
                search={dropdown.search}
                setSearch={dropdown.setSearch}
            />
        </S.Wrapper>
    );
}
