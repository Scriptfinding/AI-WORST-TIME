import Button from '@/Shared/UI/Button/Button';
import Input, { TextArea } from '@/Shared/UI/Input/Input';
import Modal from '@/Shared/UI/Modal/Modal';
import VisibilityPicker, { type VisibilityPickerValue } from '@proprietary/Domains/Flow/Components/VisibilityPicker/VisibilityPicker.pp';
import type { FlowEditorProps } from '@/Domains/Flow/Pages/FlowEditor/types';
import * as S from './styled';

export type DuplicateFlowErrors = Partial<Record<'name' | 'description' | 'visibility' | 'folder_id' | 'workspace_folder_id' | 'team_id', string>>;

interface DuplicateFlowModalProps {
    isOpen: boolean;
    loading: boolean;
    form: { name: string; description: string };
    errors: DuplicateFlowErrors;
    visibility: VisibilityPickerValue;
    personalTree: FlowEditorProps['personalTree'];
    workspaceTree: FlowEditorProps['workspaceTree'];
    teamTrees: NonNullable<FlowEditorProps['teamTrees']>;
    onClose: () => void;
    onSubmit: () => void;
    onFormChange: (form: { name: string; description: string }) => void;
    onVisibilityChange: (visibility: VisibilityPickerValue) => void;
}

export default function DuplicateFlowModal({
    isOpen,
    loading,
    form,
    errors,
    visibility,
    personalTree,
    workspaceTree,
    teamTrees,
    onClose,
    onSubmit,
    onFormChange,
    onVisibilityChange,
}: DuplicateFlowModalProps) {
    const visibilityError = errors.visibility || errors.folder_id || errors.workspace_folder_id || errors.team_id;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Clone flow"
            caption="Review the copied flow details before opening it in a new tab."
            width="720px"
            footer={
                <>
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onSubmit}
                        loading={loading}
                        disabled={loading || !form.name.trim() || (visibility.visibility === 'team' && !visibility.teamId)}
                    >
                        Clone &amp; Open
                    </Button>
                </>
            }
        >
            <S.DuplicateModalBody>
                <Input
                    label="Flow name"
                    value={form.name}
                    onChange={event => onFormChange({ ...form, name: event.target.value })}
                    error={errors.name}
                    maxLength={128}
                    showCharCount
                />
                <TextArea
                    label="Description"
                    value={form.description}
                    onChange={event => onFormChange({ ...form, description: event.target.value })}
                    error={errors.description}
                    placeholder="What does this flow do?"
                />
                <S.DuplicateSection>
                    <S.DuplicateSectionTitle>Visibility and folder</S.DuplicateSectionTitle>
                    <VisibilityPicker
                        value={visibility}
                        onChange={onVisibilityChange}
                        personalTree={personalTree}
                        workspaceTree={workspaceTree}
                        teamTrees={teamTrees}
                    />
                    {visibilityError && (
                        <S.DuplicateError>{visibilityError}</S.DuplicateError>
                    )}
                </S.DuplicateSection>
            </S.DuplicateModalBody>
        </Modal>
    );
}
