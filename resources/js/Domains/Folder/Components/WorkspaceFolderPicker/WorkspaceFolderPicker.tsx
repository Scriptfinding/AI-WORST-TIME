import { Icon } from '@/Shared/UI/Icon/Icon';
import Modal from '@/Shared/UI/Modal/Modal';
import Button from '@/Shared/UI/Button/Button';
import FolderRow from './components/FolderRow/FolderRow';
import InlineFolderCreation from './components/InlineFolderCreation/InlineFolderCreation';
import { useFolderPicker } from './hooks/useFolderPicker';
import type { WorkspaceFolderPickerProps } from './types';
import * as S from './styled';

export default function WorkspaceFolderPicker({
    isOpen,
    onClose,
    onConfirm,
    workspaceTree,
    loading,
    title = 'Share to Workspace',
    confirmLabel = 'Share',
    rootLabel = 'Workspace',
    rootIcon = 'lucide:building-2',
    scope,
    rootFolderId,
    ownerId,
}: WorkspaceFolderPickerProps) {
    const picker = useFolderPicker({
        workspaceTree,
        rootFolderId,
        rootLabel,
        scope,
        ownerId,
        onConfirm,
    });

    const handleClose = () => {
        if (!loading) {
            picker.reset();
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={title}
            footer={
                <>
                    <Button
                        variant="secondary"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={picker.confirm}
                        disabled={picker.selectedId === null}
                        loading={loading}
                    >
                        <Icon icon={rootIcon} width={14} />
                        {confirmLabel}
                    </Button>
                </>
            }
        >
            <S.Tree>
                <S.RootRow
                    $active={picker.selectedId === 'root'}
                    $scope={scope}
                    onClick={() => picker.selectFolder('root')}
                >
                    <S.RootIcon
                        $scope={scope}
                        $workspace={!scope && rootIcon === 'lucide:building-2'}
                    >
                        <Icon icon={rootIcon} />
                    </S.RootIcon>
                    <S.RootName>{rootLabel}</S.RootName>
                    <S.AddButton
                        onClick={event => {
                            event.stopPropagation();
                            picker.startCreateRoot();
                        }}
                        title="New folder"
                    >
                        <Icon icon="lucide:folder-plus" width={14} />
                    </S.AddButton>
                </S.RootRow>

                {picker.localTree.map(folder => (
                    <FolderRow
                        key={folder.id}
                        folder={folder}
                        depth={1}
                        selectedId={
                            picker.selectedId !== 'root'
                                ? picker.selectedId
                                : null
                        }
                        creatingInId={picker.creatingInId}
                        newFolderName={picker.newFolderName}
                        creatingSaving={picker.creatingSaving}
                        scope={scope}
                        onSelect={id => picker.selectFolder(id)}
                        onStartCreate={picker.startCreate}
                        onCancelCreate={picker.cancelCreate}
                        onCreateFolder={picker.createFolder}
                        onNewFolderNameChange={picker.setNewFolderName}
                    />
                ))}

                {picker.creatingAtRoot && (
                    <InlineFolderCreation
                        depth={1}
                        name={picker.newFolderName}
                        onNameChange={picker.setNewFolderName}
                        onCreate={picker.createFolder}
                        onCancel={picker.cancelCreate}
                        saving={picker.creatingSaving}
                        scope={scope}
                    />
                )}
            </S.Tree>
        </Modal>
    );
}
