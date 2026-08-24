export type ImportType = 'text' | 'secret' | 'object' | 'array';

export interface ImportVariable {
    key: string;
    value: string;
    type: ImportType;
    sourceKey: string;
    error?: string;
}

export interface ParsedImport {
    format: 'JSON' | 'env' | 'unknown';
    variables: ImportVariable[];
    error?: string;
}

const KEY_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export function stringifyImportValue(value: unknown): { value: string; type: ImportType } {
    if (value !== null && typeof value === 'object') {
        return {
            value: JSON.stringify(value, null, 2),
            type: Array.isArray(value) ? 'array' : 'object',
        };
    }

    return { value: value === null || value === undefined ? '' : String(value), type: 'text' };
}

export function stripSecretMarker(key: string) {
    const trimmed = key.trim();
    return {
        key: trimmed.startsWith('!') ? trimmed.slice(1).trim() : trimmed,
        secret: trimmed.startsWith('!'),
    };
}

export function buildVariable(rawKey: string, rawValue: unknown, prefix: string, forcedType?: string): ImportVariable {
    const marker = stripSecretMarker(rawKey);
    const inferred = stringifyImportValue(rawValue);
    const type = marker.secret || forcedType === 'secret'
        ? 'secret'
        : forcedType === 'object' || forcedType === 'array'
            ? forcedType
            : inferred.type;
    const key = `${prefix.trim()}${marker.key}`;
    const value = type === 'object' || type === 'array' ? inferred.value : String(inferred.value);

    return {
        key,
        value,
        type,
        sourceKey: rawKey,
        error: KEY_RE.test(key) ? undefined : 'Key must start with a letter or underscore and contain only letters, numbers or underscores.',
    };
}

export function parseEnvValue(value: string) {
    let next = value.trim();

    if (!next.startsWith('"') && !next.startsWith("'")) {
        next = next.replace(/\s+#.*$/, '').trim();
    }

    if ((next.startsWith('"') && next.endsWith('"')) || (next.startsWith("'") && next.endsWith("'"))) {
        next = next.slice(1, -1);
    }

    return next.replace(/\\n/g, '\n');
}

export function parseEnv(raw: string, prefix: string): ParsedImport {
    const variables: ImportVariable[] = [];
    const errors: string[] = [];

    raw.split(/\r?\n/).forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        const normalized = trimmed.startsWith('export ') ? trimmed.slice(7).trim() : trimmed;
        const equalsIndex = normalized.indexOf('=');
        if (equalsIndex < 1) {
            errors.push(`Line ${index + 1} is not a KEY=value entry.`);
            return;
        }

        const key = normalized.slice(0, equalsIndex).trim();
        const value = parseEnvValue(normalized.slice(equalsIndex + 1));
        variables.push(buildVariable(key, value, prefix));
    });

    return {
        format: 'env',
        variables,
        error: errors[0],
    };
}

export function parseJsonValue(raw: string, prefix: string): ParsedImport | null {
    try {
        const decoded = JSON.parse(raw) as unknown;

        if (Array.isArray(decoded)) {
            const variables = decoded.map((item) => {
                if (!item || typeof item !== 'object') {
                    return buildVariable('', '', prefix);
                }

                const row = item as { key?: unknown; name?: unknown; value?: unknown; type?: unknown };
                return buildVariable(String(row.key ?? row.name ?? ''), row.value ?? '', prefix, String(row.type ?? ''));
            });

            return { format: 'JSON', variables };
        }

        if (decoded && typeof decoded === 'object') {
            const variables = Object.entries(decoded as Record<string, unknown>).map(([key, value]) => buildVariable(key, value, prefix));
            return { format: 'JSON', variables };
        }

        return { format: 'JSON', variables: [], error: 'JSON must be an object or an array of key/value entries.' };
    } catch {
        return null;
    }
}

export function parseImport(raw: string, prefix: string): ParsedImport {
    if (!raw.trim()) {
        return { format: 'unknown', variables: [] };
    }

    const parsedJson = parseJsonValue(raw, prefix);
    if (parsedJson) return parsedJson;

    return parseEnv(raw, prefix);
}
