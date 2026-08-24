import { Icon } from '@/Shared/UI/Icon/Icon';
import type { FolderTree } from '@/Domains/Folder/types';
import type { FolderScope } from '@/Domains/Folder/Components/WorkspaceFolderPicker/types';
import InlineFolderCreation from '@/Domains/Folder/Components/WorkspaceFolderPicker/components/InlineFolderCreation/InlineFolderCreation';
import * as S from './styled';

interface Props {
    folder: FolderTree;
    depth: number;
    selectedId: Id | null;
    creatingInId: Id | null;
    newFolderName: string;
    creatingSaving: boolean;
    scope?: FolderScope;
    onSelect: (id: Id) => void;
    onStartCreate: (parentId: Id) => void;
    onCancelCreate: () => void;
    onCreateFolder: () => void;
    onNewFolderNameChange: (name: string) => void;
}

export default function FolderRow({
    folder,
    depth,
    selectedId,
    creatingInId,
    newFolderName,
    creatingSaving,
    scope,
    onSelect,
    onStartCreate,
    onCancelCreate,
    onCreateFolder,
    onNewFolderNameChange,
}: Props) {
    return (
        <>
            <S.Row
                $depth={depth}
                $active={folder.id === selectedId}
                $scope={scope}
                onClick={() => onSelect(folder.id)}
            >
                <S.FolderIcon $scope={scope}>
                    <Icon icon="lucide:folder" />
                </S.FolderIcon>
                <S.Name>{folder.name}</S.Name>
                <S.AddButton
                    onClick={event => {
                        event.stopPropagation();
                        onStartCreate(folder.id);
                    }}
                    title="New sub-folder"
                >
                    <Icon icon="lucide:folder-plus" width={14} />
                </S.AddButton>
            </S.Row>

            {creatingInId === folder.id && (
                <InlineFolderCreation
                    depth={depth + 1}
                    name={newFolderName}
                    onNameChange={onNewFolderNameChange}
                    onCreate={onCreateFolder}
                    onCancel={onCancelCreate}
                    saving={creatingSaving}
                    scope={scope}
                />
            )}

            {folder.children.map(child => (
                <FolderRow
                    key={child.id}
                    folder={child}
                    depth={depth + 1}
                    selectedId={selectedId}
                    creatingInId={creatingInId}
                    newFolderName={newFolderName}
                    creatingSaving={creatingSaving}
                    scope={scope}
                    onSelect={onSelect}
                    onStartCreate={onStartCreate}
                    onCancelCreate={onCancelCreate}
                    onCreateFolder={onCreateFolder}
                    onNewFolderNameChange={onNewFolderNameChange}
                />
            ))}
        </>
    );
}
