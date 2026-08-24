export const asRecord = (value: unknown): Record<string, unknown> | null => {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;
};

export const withoutContext = (value: Record<string, unknown> | null) => {
    if (!value) return null;

    const { $context: _context, ...rest } = value;
    return rest;
};

export const isInternalNodeOutputKey = (key: string, nodeId: string) => {
    if (!key) return false;
    if (key === nodeId) return true;

    return /^\$?[A-Za-z_$][\w$]*-\d{10,}-\d+$/.test(key);
};

export const toCamelCaseVariableName = (value: string) => {
    const words = value
        .trim()
        .replace(/^\$+/, '')
        .match(/[A-Za-z0-9]+/g) ?? [];
    const camelCase = words
        .map((word, index) => {
            const normalized = word.toLowerCase();
            return index === 0
                ? normalized
                : normalized.charAt(0).toUpperCase() + normalized.slice(1);
        })
        .join('');

    if (!camelCase) return 'nodeResult';
    return /^[A-Za-z_$]/.test(camelCase)
        ? camelCase
        : `node${camelCase.charAt(0).toUpperCase()}${camelCase.slice(1)}`;
};
