import { Icon } from '@/Shared/UI/Icon/Icon';
import type { InputMode } from '@/Domains/Flow/Pages/FlowEditor/components/StructuredObjectInput/utils';
import CustomSelect from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/CustomSelect/CustomSelect';
import * as S from './styled';

const INPUT_MODE_OPTIONS = [
    { value: 'json', label: 'JSON' },
    { value: 'form', label: 'Form' },
];

interface ModeControlsProps {
    mode: InputMode;
    readOnly: boolean;
    onChange: (mode: InputMode) => void;
    onExpand: () => void;
}

export default function ModeControls({
    mode,
    readOnly,
    onChange,
    onExpand,
}: ModeControlsProps) {
    return (
        <S.Controls>
            <CustomSelect
                value={mode}
                disabled={readOnly}
                ariaLabel="Input mode"
                compact
                compactHeight={32}
                showOptionValue={false}
                options={INPUT_MODE_OPTIONS}
                onChange={nextMode => onChange(nextMode === 'form' ? 'form' : 'json')}
            />
            {mode === 'json' && (
                <S.ExpandButton
                    type="button"
                    onClick={onExpand}
                    title="Open in fullscreen"
                    disabled={readOnly}
                >
                    <Icon icon="lucide:external-link" width={14} height={14} />
                </S.ExpandButton>
            )}
        </S.Controls>
    );
}
