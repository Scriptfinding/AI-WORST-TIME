import { formatDateTime } from '@/Shared/Utils/formatDate';

export function formatInvitedAt(value: string) {
    try {
        return formatDateTime(value, {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch {
        return value;
    }
}
