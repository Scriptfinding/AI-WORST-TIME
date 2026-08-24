import { Icon } from '@/Shared/UI/Icon/Icon';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import type { Flow } from '@/Domains/Flow/types';
import useBreadcrumbDropdown from '@/Domains/Flow/Pages/FlowEditor/Breadcrumbs/hooks/useBreadcrumbDropdown';
import type { SiblingFlow } from '@/Domains/Flow/Pages/FlowEditor/Breadcrumbs/types';
import FlowBreadcrumbMenu from './FlowBreadcrumbMenu';
import * as S from './styled';
import { BlueprintBadge } from './shared.styled';

interface FlowBreadcrumbItemProps {
    flow: Flow;
    siblingFlows: SiblingFlow[];
}

export default function FlowBreadcrumbItem({ flow, siblingFlows }: FlowBreadcrumbItemProps) {
    const dropdown = useBreadcrumbDropdown();
    const createParams = new URLSearchParams();
    const folderId = flow.visibility === 'owner' ? flow.folder_id : flow.workspace_folder_id;
    if (folderId !== null) createParams.set('folder_id', String(folderId));
    if (flow.visibility !== 'owner') createParams.set('view', 'workspace');
    const createQuery = createParams.toString();
    const createFlowHref = `/flows/create${createQuery ? `?${createQuery}` : ''}`;

    return (
        <S.Wrapper>
            <S.Button ref={dropdown.anchorRef} onClick={dropdown.toggle}>
                <FlowIcon flow={flow} size={18} />
                <S.Name>{flow.name}</S.Name>
                {flow.library_reference && (
                    <BlueprintBadge title="Imported from library">
                        <Icon icon="lucide:store" width={12} height={12} />
                    </BlueprintBadge>
                )}
                <Icon icon="lucide:chevron-down" />
            </S.Button>
            <FlowBreadcrumbMenu
                close={dropdown.close}
                dropdownRef={dropdown.dropdownRef}
                open={dropdown.open}
                position={dropdown.position}
                search={dropdown.search}
                setSearch={dropdown.setSearch}
                siblingFlows={siblingFlows}
                createFlowHref={createFlowHref}
            />
        </S.Wrapper>
    );
}
