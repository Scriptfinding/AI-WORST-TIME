export type LaravelValidationErrors = Record<string, string | string[]>;

export function normalizeLaravelValidationErrors(value: unknown): Record<string, string> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

    return Object.entries(value as LaravelValidationErrors).reduce<Record<string, string>>(
        (errors, [key, error]) => {
            const message = Array.isArray(error) ? error.find(item => typeof item === 'string') : error;
            if (typeof message === 'string') errors[key] = message;
            return errors;
        },
        {},
    );
}
