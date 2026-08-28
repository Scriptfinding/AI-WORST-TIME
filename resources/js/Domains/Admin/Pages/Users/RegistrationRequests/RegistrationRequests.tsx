import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import RegistrationRequestsPanel, {
    type RegistrationRequestItem,
} from '@/Shared/UI/RegistrationRequestsPanel/RegistrationRequestsPanel';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import WorkspacePicker from '@/Domains/Admin/Pages/Users/UserModals/WorkspacePicker/WorkspacePicker';
import type { WorkspaceOption } from '@/Domains/Admin/Pages/Users/UserModals/types';
import * as S from './styled';

export type RegistrationRequest = RegistrationRequestItem;

interface Props {
    requests: RegistrationRequest[];
    workspaces: WorkspaceOption[];
}

export default function RegistrationRequests({ requests, workspaces }: Props) {
    const [selected, setSelected] = useState<RegistrationRequest | null>(null);
    const { confirm, ConfirmModal } = useConfirm();
    const form = useForm<{ workspace_ids: Id[] }>({ workspace_ids: [] });

    if (requests.length === 0) return null;

    const toggleWorkspace = (id: Id) => {
        form.setData(
            'workspace_ids',
            form.data.workspace_ids.includes(id)
                ? form.data.workspace_ids.filter(workspaceId => workspaceId !== id)
                : [...form.data.workspace_ids, id],
        );
    };

    const approve = () => {
        if (!selected) return;

        form.post(`/admin/registration-requests/${selected.id}/approve`, {
            preserveScroll: true,
            onSuccess: () => {
                setSelected(null);
                form.reset();
            },
        });
    };

    const reject = async (request: RegistrationRequest) => {
        if (await confirm({
            title: 'Reject invitation request',
            message: `Reject the request from "${request.email}"?`,
            confirmLabel: 'Reject',
            variant: 'danger',
        })) {
            router.delete(`/admin/registration-requests/${request.id}`, { preserveScroll: true });
        }
    };

    return (
        <>
            <RegistrationRequestsPanel
                requests={requests}
                onReject={request => { void reject(request); }}
                onReview={request => {
                    form.reset();
                    setSelected(request);
                }}
            />

            <Modal
                isOpen={selected !== null}
                onClose={() => {
                    setSelected(null);
                    form.reset();
                }}
                title="Approve invitation request"
                caption={selected ? `${selected.name} - ${selected.email}` : undefined}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
                        <Button
                            onClick={approve}
                            loading={form.processing}
                            disabled={form.data.workspace_ids.length === 0}
                        >
                            Approve and create account
                        </Button>
                    </>
                }
            >
                <S.ModalBody>
                    <S.Help>
                        Select at least one workspace. The account will not be able to create additional workspaces.
                    </S.Help>
                    <S.Label>Assign to workspaces</S.Label>
                    <WorkspacePicker
                        workspaces={workspaces}
                        selectedIds={form.data.workspace_ids}
                        onToggle={toggleWorkspace}
                    />
                    {form.errors.workspace_ids && <S.Error>{form.errors.workspace_ids}</S.Error>}
                </S.ModalBody>
            </Modal>

            <ConfirmModal />
        </>
    );
}
