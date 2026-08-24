import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import Button from '@/Shared/UI/Button/Button';
import UserPicker from '@/Shared/UI/UserPicker/UserPicker';
import type { Workspace } from '@/Domains/Workspace/types';
import * as S from './OwnershipSection.styled';

interface Props {
    workspace: Workspace;
    isOwner: boolean;
}

export default function OwnershipSection({ workspace, isOwner }: Props) {
    const [selectedOwnerId, setSelectedOwnerId] = useState<Id | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleTransfer = () => {
        if (!selectedOwnerId || selectedOwnerId === workspace.owner?.id) return;
        setProcessing(true);
        router.put('/workspace/transfer-ownership', {
            owner_id: selectedOwnerId,
        }, {
            onSuccess: () => { setSelectedOwnerId(null); setProcessing(false); },
            onError: () => setProcessing(false),
        });
    };

    return (
        <S.Column>
            {workspace.owner && (
                <S.FieldHint style={{ marginTop: 0 }}>
                    Current owner: <strong>{workspace.owner.name}</strong>
                </S.FieldHint>
            )}
            {isOwner ? (
                <>
                    <UserPicker
                        label="Transfer to"
                        value={selectedOwnerId}
                        onChange={setSelectedOwnerId}
                        placeholder="Select a user..."
                        clearable={false}
                    />
                    <S.FormActions>
                        <Button
                            size="sm"
                            disabled={!selectedOwnerId || selectedOwnerId === workspace.owner?.id || processing}
                            onClick={handleTransfer}
                        >
                            Transfer Ownership
                        </Button>
                    </S.FormActions>
                </>
            ) : (
                <S.FieldHint style={{ marginTop: 0 }}>
                    Only the workspace owner can transfer ownership.
                </S.FieldHint>
            )}
        </S.Column>
    );
}
