const countChars = (value: string, chars: string) =>
    [...value].filter(char => chars.includes(char)).length;

const isExpandableStatementStart = (line: string) => {
    if (/^(if|for|while|switch|try|else\b|catch\b|finally\b)\b/.test(line)) {
        return false;
    }

    return /^(await|return|const|let|var|throw)\b/.test(line)
        || /^[\w$.[\]'"]+\s*(?:=|\+=|-=|\*=|\/=|\?\?=|\|\|=|&&=)/.test(line)
        || /^(?:await\s+)?[\w$.[\]'"]+\s*\(/.test(line);
};

export const getExpandedStatementLines = (
    code: string,
    lines: number[],
): number[] => {
    const sourceLines = code.split('\n');
    const expanded = new Set(lines);

    lines.forEach(lineNumber => {
        const firstLine = sourceLines[lineNumber - 1]?.trim() ?? '';
        if (!isExpandableStatementStart(firstLine) || /;\s*$/.test(firstLine)) {
            return;
        }

        let depth = 0;
        for (let index = lineNumber - 1; index < sourceLines.length; index += 1) {
            const current = sourceLines[index];
            expanded.add(index + 1);
            depth += countChars(current, '({[');
            depth -= countChars(current, ')}]');

            const isComplete = index > lineNumber - 1
                && depth <= 0
                && /(?:;|\)|\]|\})\s*[,;]?$/.test(current.trim());
            if (isComplete) break;
        }
    });

    return Array.from(expanded);
};
