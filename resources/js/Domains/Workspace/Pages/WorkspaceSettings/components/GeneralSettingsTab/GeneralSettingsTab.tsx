import { Icon } from '@/Shared/UI/Icon/Icon';
import type { Workspace } from '@/Domains/Workspace/types';
import GeneralSection from '@/Domains/Workspace/Pages/WorkspaceSettings/Sections/GeneralSection';
import OwnershipSection from '@/Domains/Workspace/Pages/WorkspaceSettings/Sections/OwnershipSection';
import SecuritySection from '@/Domains/Workspace/Pages/WorkspaceSettings/Sections/SecuritySection';
import DeleteWorkspace from '@/Domains/Workspace/Pages/WorkspaceSettings/components/DeleteWorkspace/DeleteWorkspace';
import * as S from '@/Domains/Workspace/Pages/WorkspaceSettings/shared.styled';

interface Props {
    workspace: Workspace;
    isWorkspaceAdmin: boolean;
    isOwner: boolean;
}

export default function GeneralSettingsTab({ workspace, isWorkspaceAdmin, isOwner }: Props) {
    return (
        <S.TwoColumns>
            <S.CardStack>
                <S.Card>
                    <S.CardTitle>
                        <Icon icon="lucide:settings" width={15} height={15} />
                        General
                    </S.CardTitle>
                    <GeneralSection workspace={workspace} readOnly={!isWorkspaceAdmin} />
                </S.Card>

                <S.Card>
                    <S.CardTitle>
                        <Icon icon="lucide:crown" width={15} height={15} />
                        Ownership
                    </S.CardTitle>
                    <OwnershipSection workspace={workspace} isOwner={isOwner} />
                </S.Card>
            </S.CardStack>

            <S.CardStack>
                <S.Card>
                    <S.CardTitle>
                        <Icon icon="lucide:shield" width={15} height={15} />
                        Security
                    </S.CardTitle>
                    <SecuritySection workspace={workspace} readOnly={!isWorkspaceAdmin} />
                </S.Card>

                {isWorkspaceAdmin && <DeleteWorkspace workspaceName={workspace.name} />}
            </S.CardStack>
        </S.TwoColumns>
    );
}
