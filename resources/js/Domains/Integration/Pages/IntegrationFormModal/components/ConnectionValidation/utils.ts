export type ConnectionResult = {
    valid: boolean;
    error?: string;
    username?: string;
    bot_name?: string;
} | null;

export function getConnectionResultLabel(result: NonNullable<ConnectionResult>): string {
    if (!result.valid) return result.error || 'Connection failed';
    if (result.bot_name) return `Connected to ${result.bot_name}`;
    if (result.username) return `Authenticated as ${result.username}`;
    return 'Connection valid';
}
