const RAW_URL_REGEX = /https?:\/\/[^\s<>()\]]+/g;

export const linkifyRawUrls = (value: string) => {
    return value.replace(RAW_URL_REGEX, (url, offset, source) => {
        const previousChar = source[offset - 1];
        const nextChar = source[offset + url.length];
        const isMarkdownLinkTarget = previousChar === '(' && source.lastIndexOf(']', offset) > source.lastIndexOf('\n', offset);
        const isAlreadyBracketed = previousChar === '[' && nextChar === ']';
        if (isMarkdownLinkTarget || isAlreadyBracketed) return url;

        const trailingPunctuation = url.match(/[.,!?;:]+$/)?.[0] ?? '';
        const cleanUrl = trailingPunctuation ? url.slice(0, -trailingPunctuation.length) : url;
        return `[${cleanUrl}](${cleanUrl})${trailingPunctuation}`;
    });
};
