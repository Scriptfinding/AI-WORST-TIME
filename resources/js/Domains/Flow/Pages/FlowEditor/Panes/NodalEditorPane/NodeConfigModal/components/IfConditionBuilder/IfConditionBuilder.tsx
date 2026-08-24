import type { IfConditionParameterValue, NodeParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { NodalAutocompleteContext } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/staticAnalysis';
import { normalizeIfConditionValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/utils/ifConditions';
import IfConditionGroup from './IfConditionGroup/IfConditionGroup';

interface IfConditionBuilderProps {
    value: NodeParameterValue | undefined;
    outputData: unknown;
    autocompleteContext: NodalAutocompleteContext;
    readOnly?: boolean;
    onChange: (value: IfConditionParameterValue) => void;
}

export default function IfConditionBuilder({
    value,
    outputData,
    autocompleteContext,
    readOnly,
    onChange,
}: IfConditionBuilderProps) {
    const condition = normalizeIfConditionValue(value);

    return (
        <IfConditionGroup
            condition={condition}
            outputData={outputData}
            autocompleteContext={autocompleteContext}
            readOnly={readOnly}
            onChange={onChange}
        />
    );
}
