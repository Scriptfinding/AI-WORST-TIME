export function formatTimeoutLimit(seconds: number): string {
    return seconds > 0 ? `${seconds}s` : 'unlimited';
}
