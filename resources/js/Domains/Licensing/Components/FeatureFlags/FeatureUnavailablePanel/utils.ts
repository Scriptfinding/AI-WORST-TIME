const UNDERLINE_PATTERN = /(\+\+([\s\S]+?)\+\+|<u>([\s\S]+?)<\/u>)/gi;
const UNAVAILABLE_FEATURE_PREFIX = /^This feature is not available on your instance\.\s*/;

export interface MessageSegment {
    text: string;
    underline: boolean;
}

export function parseMessageSegments(message: string): MessageSegment[] {
    const segments: MessageSegment[] = [];
    let lastIndex = 0;

    for (const match of message.matchAll(UNDERLINE_PATTERN)) {
        const index = match.index ?? 0;
        if (index > lastIndex) {
            segments.push({
                text: message.slice(lastIndex, index),
                underline: false,
            });
        }

        segments.push({
            text: match[2] ?? match[3] ?? '',
            underline: true,
        });
        lastIndex = index + match[0].length;
    }

    if (lastIndex < message.length) {
        segments.push({
            text: message.slice(lastIndex),
            underline: false,
        });
    }

    return segments;
}

export function promotionReason(message: string): string {
    return message.replace(UNAVAILABLE_FEATURE_PREFIX, '').trim() || message;
}
