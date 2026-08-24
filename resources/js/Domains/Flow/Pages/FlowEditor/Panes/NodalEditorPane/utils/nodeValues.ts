import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import type { NodeParameterValue, RawNodeParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { NODE_RUN_OUTPUT_KEY } from './constants';
import { getSignatureArgs } from './catalog';
import { normalizeNodeValues } from './expression';

const cleanSignatureArg = (arg: string) => arg.replace(/\?$/, '').replace(/^\.\.\./, '');

export const sanitizeNodeValuesForEntry = (
    entry: HelpEntryDef,
    values?: Record<string, RawNodeParameterValue>,
): Record<string, NodeParameterValue> => {
    const normalizedValues = normalizeNodeValues(values);

    if (entry.category === 'Custom') {
        return normalizedValues;
    }

    const allowedKeys = new Set([
        NODE_RUN_OUTPUT_KEY,
        ...getSignatureArgs(entry.signature).map(cleanSignatureArg),
    ]);

    return Object.fromEntries(
        Object.entries(normalizedValues).filter(([key]) => allowedKeys.has(key)),
    );
};
