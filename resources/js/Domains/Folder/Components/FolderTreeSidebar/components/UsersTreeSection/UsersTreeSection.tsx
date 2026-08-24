import { Icon } from '@/Shared/UI/Icon/Icon';
import type { UserTree } from '@/Domains/Folder/types';
import { handleLinkClick } from '@/Shared/Utils/navigation';
import FolderNode from '@/Domains/Folder/Components/FolderTreeSidebar/components/FolderNode/FolderNode';
import FlowRow from '@/Domains/Folder/Components/FolderTreeSidebar/components/FlowRow/FlowRow';
import * as SectionS from '@/Domains/Folder/Components/FolderTreeSidebar/components/WorkspaceTreeSection/styled';
import * as S from './styled';

interface Props {
    users: UserTree[];
    currentOwnerId: Id | null;
    active: boolean;
    expanded: boolean;
    userSectionsExpanded: Record<string, boolean>;
    onToggle: () => void;
    onToggleUser: (userId: Id) => void;
}

export default function UsersTreeSection({
    users,
    currentOwnerId,
    active,
    expanded,
    userSectionsExpanded,
    onToggle,
    onToggleUser,
}: Props) {
    return (
        <>
            <SectionS.Divider />
            <SectionS.Row
                href="/flows?view=users"
                $active={active}
                onClick={(event) => handleLinkClick(event, '/flows?view=users')}
            >
                <SectionS.Chevron
                    $visible
                    $expanded={expanded}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onToggle();
                    }}
                >
                    <Icon icon="lucide:chevron-right" />
                </SectionS.Chevron>
                <S.HeaderIconSlot>
                    <Icon icon="lucide:users" />
                </S.HeaderIconSlot>
                <SectionS.Label>Users</SectionS.Label>
            </SectionS.Row>

            {expanded && users.map((user) => {
                const userExpanded = userSectionsExpanded[user.id] ?? false;
                const hasContent = user.tree.length > 0 || user.rootFlows.length > 0;
                const userUrl = `/flows?owner_id=${user.id}`;

                return (
                    <div key={`user-${user.id}`}>
                        <S.Row
                            href={userUrl}
                            $active={currentOwnerId === user.id}
                            onClick={(event) => handleLinkClick(event, userUrl)}
                        >
                            <S.Chevron
                                $visible={hasContent}
                                $expanded={userExpanded}
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    onToggleUser(user.id);
                                }}
                            >
                                <Icon icon="lucide:chevron-right" />
                            </S.Chevron>
                            <S.IconSlot>
                                <Icon icon="lucide:user" />
                            </S.IconSlot>
                            <S.Label>{user.name}</S.Label>
                        </S.Row>

                        {userExpanded && (
                            <>
                                {user.tree.map((folder) => (
                                    <FolderNode
                                        key={`user-${user.id}-folder-${folder.id}`}
                                        folder={folder}
                                        depth={2}
                                        ownerId={user.id}
                                    />
                                ))}
                                {user.rootFlows.map((flow) => (
                                    <FlowRow
                                        key={`user-${user.id}-flow-${flow.id}`}
                                        flow={flow}
                                        depth={2}
                                    />
                                ))}
                            </>
                        )}
                    </div>
                );
            })}
        </>
    );
}
