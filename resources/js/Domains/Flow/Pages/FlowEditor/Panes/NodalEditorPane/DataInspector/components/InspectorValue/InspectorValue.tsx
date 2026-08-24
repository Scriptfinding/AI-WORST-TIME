import { formatPrimitive, isUnavailableResult, unresolvedResultLabel } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/DataInspector/utils';
import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './styled';

interface InspectorValueProps {
    value: unknown;
    typeOnly?: boolean;
    quoteStrings?: boolean;
    referenceId?: string;
    referenceLabel?: string;
    resourceEditUrl?: string;
    syntaxHighlight?: boolean;
}

export default function InspectorValue({
    value,
    typeOnly = false,
    quoteStrings = true,
    referenceId,
    referenceLabel,
    resourceEditUrl,
    syntaxHighlight = false,
}: InspectorValueProps) {
    const unresolvedLabel = unresolvedResultLabel(value);

    if (isUnavailableResult(value)) {
        return (
            <S.PlaceholderBadge title="Available only in a flow context.">
                <span>Unavailable</span>
            </S.PlaceholderBadge>
        );
    }

    if (unresolvedLabel) {
        return (
            <S.PlaceholderBadge title="Run the flow to preview the real value.">
                <span>Needs run</span>
                <strong>{unresolvedLabel}</strong>
            </S.PlaceholderBadge>
        );
    }

    const formattedValue = typeof value === 'string' && !quoteStrings ? value : formatPrimitive(value);
    const valueKind = referenceId && referenceLabel
        ? 'reference'
        : value === null
            ? 'null'
            : typeof value === 'string'
                ? 'string'
                : typeof value === 'number'
                    ? 'number'
                    : typeof value === 'boolean'
                        ? 'boolean'
                        : 'default';
    const referenceOffset = referenceId ? formattedValue.indexOf(referenceId) : -1;
    const editLink = resourceEditUrl && (
        <S.ResourceEditLink
            href={resourceEditUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open resource in edit mode"
            aria-label="Open resource in edit mode"
        >
            <Icon icon="lucide:external-link" width={10} height={10} />
        </S.ResourceEditLink>
    );

    if (!typeOnly && referenceLabel && referenceId && referenceOffset >= 0) {
        return (
            <S.ValueWithLink>
                <S.PrimitiveValue $kind={syntaxHighlight ? 'reference' : 'default'}>
                    {formattedValue.slice(0, referenceOffset)}
                    <S.ReferenceId>{referenceId}</S.ReferenceId>
                    <S.ReferenceLabel>{referenceLabel}</S.ReferenceLabel>
                    {formattedValue.slice(referenceOffset + referenceId.length)}
                </S.PrimitiveValue>
                {editLink}
            </S.ValueWithLink>
        );
    }

    return typeOnly
        ? null
        : (
            <S.ValueWithLink>
                <S.PrimitiveValue $kind={syntaxHighlight ? valueKind : 'default'}>{formattedValue}</S.PrimitiveValue>
                {editLink}
            </S.ValueWithLink>
        );
}
