import React from 'react';
import { router } from '@inertiajs/react';
import Switch from '@/Shared/UI/Switch/Switch';
import type { Workspace } from '@/Domains/Workspace/types';
import * as S from './TriggersActionsSection.styled';

interface Props {
    workspace: Workspace;
    readOnly?: boolean;
}

export default function TriggersActionsSection({ workspace, readOnly }: Props) {
    const handleToggleAdvertising = (value: boolean) => {
        if (readOnly) return;
        const data: Pick<Workspace, 'allow_trigger_advertising'> = {
            allow_trigger_advertising: value,
        };
        router.put('/workspace', data, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <S.Column>
            <Switch
                id="allow_trigger_advertising"
                checked={workspace.allow_trigger_advertising ?? true}
                onChange={handleToggleAdvertising}
                label="Allow members to advertise triggers/actions"
                disabled={readOnly}
            />
            <S.FieldHint>
                Advertising makes a flow's triggers and actions discoverable by other authorized workspace members so they can reuse them from their own automations. It does not change who can run the flow.
            </S.FieldHint>
        </S.Column>
    );
}
