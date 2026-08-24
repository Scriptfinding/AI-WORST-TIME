import { Icon } from '@/Shared/UI/Icon/Icon';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import Modal from '@/Shared/UI/Modal/Modal';
import Button from '@/Shared/UI/Button/Button';
import { ConfirmFlowList, ConfirmFlowItem, ConfirmationFlowItemLabel } from '@/Shared/Hooks/useConfirm';
import type { Flow } from '@/Domains/Flow/types';
import type { Folder } from '@/Domains/Folder/types';
import * as S from './styled';

interface Props {
    isOpen: boolean;
    deleting: boolean;
    selectedCount: number;
    selectedFlows: Flow[];
    selectedFolders: Folder[];
    folderTotals: { folders: number; flows: number };
    hasNestedItems: boolean;
    nestedDeleteConfirmed: boolean;
    onNestedDeleteConfirmedChange: (confirmed: boolean) => void;
    onClose: () => void;
    onConfirm: () => void;
}

export default function BatchDeleteModal({
    isOpen,
    deleting,
    selectedCount,
    selectedFlows,
    selectedFolders,
    folderTotals,
    hasNestedItems,
    nestedDeleteConfirmed,
    onNestedDeleteConfirmedChange,
    onClose,
    onConfirm,
}: Props) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                if (!deleting) onClose();
            }}
            title={selectedCount === 1 ? 'Delete Item' : 'Delete Items'}
            width="440px"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={deleting}>
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={onConfirm}
                        loading={deleting}
                        disabled={hasNestedItems && !nestedDeleteConfirmed}
                    >
                        <Icon icon="lucide:trash-2" width={14} />
                        Delete ({selectedCount})
                    </Button>
                </>
            }
        >
            <S.Body>
                <S.Intro>
                    Delete {selectedCount === 1 ? 'this item' : `these ${selectedCount} items`}? This action cannot be undone.
                </S.Intro>

                <ConfirmFlowList>
                    {selectedFolders.map(folder => (
                        <ConfirmFlowItem key={`folder-${folder.id}`} as="div">
                            <ConfirmationFlowItemLabel>
                                <Icon icon="lucide:folder" width={16} height={16} />
                                <span>{folder.name}</span>
                            </ConfirmationFlowItemLabel>
                        </ConfirmFlowItem>
                    ))}
                    {selectedFlows.map(flow => (
                        <ConfirmFlowItem key={`flow-${flow.id}`} as="div">
                            <ConfirmationFlowItemLabel>
                                <FlowIcon flow={flow} size={16} radius="xs" />
                                <span>{flow.name}</span>
                            </ConfirmationFlowItemLabel>
                        </ConfirmFlowItem>
                    ))}
                </ConfirmFlowList>

                {hasNestedItems && (
                    <>
                        <S.Warning>
                            <Icon icon="lucide:alert-triangle" width={16} height={16} />
                            <span>
                                The selected folder{selectedFolders.length > 1 ? 's contain' : ' contains'}{' '}
                                {folderTotals.flows > 0 && (
                                    <strong>{folderTotals.flows} flow{folderTotals.flows > 1 ? 's' : ''}</strong>
                                )}
                                {folderTotals.flows > 0 && folderTotals.folders > 0 && ' and '}
                                {folderTotals.folders > 0 && (
                                    <strong>{folderTotals.folders} sub-folder{folderTotals.folders > 1 ? 's' : ''}</strong>
                                )}
                                . Everything inside will be deleted too.
                            </span>
                        </S.Warning>

                        <S.CheckLabel>
                            <input
                                type="checkbox"
                                checked={nestedDeleteConfirmed}
                                onChange={event => onNestedDeleteConfirmedChange(event.target.checked)}
                            />
                            <span>I understand that selected folders and their children will be permanently deleted.</span>
                        </S.CheckLabel>
                    </>
                )}
            </S.Body>
        </Modal>
    );
}
