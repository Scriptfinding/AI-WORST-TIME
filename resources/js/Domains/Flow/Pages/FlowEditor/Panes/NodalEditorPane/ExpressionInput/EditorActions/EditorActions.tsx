import { Icon } from '@/Shared/UI/Icon/Icon';
import type { ScalarNodeParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { ExpressionHeaderActions } from '../shared.styled';
import VariablePickerButton from './VariablePickerButton';
import * as S from './styled';

interface EditorActionsProps {
    value: ScalarNodeParameterValue;
    expressionFallback?: string;
    readOnly?: boolean;
    fullscreenTitle: string;
    onExpand: () => void;
    onChange: (value: ScalarNodeParameterValue) => void;
    onVariablePickerOpen: () => void;
    onVariableSelect: (key: string) => void;
}

export default function EditorActions({
    value,
    expressionFallback = '{{  }}',
    readOnly,
    fullscreenTitle,
    onExpand,
    onChange,
    onVariablePickerOpen,
    onVariableSelect,
}: EditorActionsProps) {
    return (
        <ExpressionHeaderActions>
            <S.ExpressionExpandButton
                type="button"
                title={fullscreenTitle}
                onClick={onExpand}
            >
                <Icon icon="lucide:external-link" width={12} height={12} />
            </S.ExpressionExpandButton>
            <VariablePickerButton
                disabled={readOnly}
                onBeforeOpen={onVariablePickerOpen}
                onSelect={onVariableSelect}
            />
            <S.ExpressionModeToggle>
                <S.ExpressionModeButton
                    type="button"
                    $active={value.mode === 'fixed'}
                    disabled={readOnly}
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => onChange({ mode: 'fixed', value: value.value })}
                >
                    Fixed
                </S.ExpressionModeButton>
                <S.ExpressionModeButton
                    type="button"
                    $active={value.mode === 'expression'}
                    disabled={readOnly}
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => onChange({
                        mode: 'expression',
                        value: value.value ? value.value : expressionFallback,
                    })}
                >
                    Expression
                </S.ExpressionModeButton>
            </S.ExpressionModeToggle>
        </ExpressionHeaderActions>
    );
}
