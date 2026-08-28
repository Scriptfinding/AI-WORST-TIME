import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import RegistrationRequestsPanel from '@/Shared/UI/RegistrationRequestsPanel/RegistrationRequestsPanel';
import type { RegistrationRequest } from '@/Domains/Workspace/Pages/WorkspaceMembers/types';
import * as S from './styled';

interface Props {
    requests: RegistrationRequest[];
}

export default function RegistrationRequestsCard({ requests }: Props) {
    const [selected, setSelected] = useState<RegistrationRequest | null>(null);
    const { confirm, ConfirmModal } = useConfirm();
    const approval = useForm({});

    if (requests.length === 0) return null;

    const approve = () => {
        if (!selected) return;

        approval.post(
            `/workspace/registration-requests/${selected.id}/approve`,
            {
                preserveScroll: true,
                onSuccess: () => setSelected(null),
            },
        );
    };

    const reject = async (request: RegistrationRequest) => {
        if (await confirm({
            title: 'Reject invitation request',
            message: `Reject the request from "${request.email}"?`,
            confirmLabel: 'Reject',
            variant: 'danger',
        })) {
            router.delete(`/workspace/registration-requests/${request.id}`, { preserveScroll: true });
        }
    };

    return (
        <>
            <RegistrationRequestsPanel
                requests={requests}
                onReject={request => { void reject(request); }}
                onReview={setSelected}
            />

            <Modal
                isOpen={selected !== null}
                onClose={() => setSelected(null)}
                title="Approve invitation request"
                caption={selected ? `${selected.name} - ${selected.email}` : undefined}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
                        <Button onClick={approve} loading={approval.processing}>
                            Approve and create account
                        </Button>
                    </>
                }
            >
                <S.ReviewMessage>
                    This account will be created as a member and assigned to the current workspace.
                </S.ReviewMessage>
            </Modal>

            <ConfirmModal />
        </>
    );
}
