export function timeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;

    const months = Math.floor(days / 30);

    if (months < 12) return `${months}mo ago`;

    return `${Math.floor(months / 12)}y ago`;
}
