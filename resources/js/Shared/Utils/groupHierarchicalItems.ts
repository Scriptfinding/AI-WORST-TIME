export interface GroupHeader {
    label: string;
    depth: number;
    key: string;
    count: number;
}

export interface GroupedSection<T> {
    group: string | null;
    items: T[];
    headers: GroupHeader[];
}

export function groupHierarchicalItems<T>(
    items: T[],
    getGroup: (item: T) => string | null | undefined,
): GroupedSection<T>[] {
    const sections = items.reduce<Omit<GroupedSection<T>, 'headers'>[]>((accumulator, item) => {
        const group = getGroup(item) || null;
        const last = accumulator[accumulator.length - 1];
        if (last && last.group === group) {
            last.items.push(item);
        } else {
            accumulator.push({ group, items: [item] });
        }
        return accumulator;
    }, []);
    const rendered = new Set<string>();
    const groupCounts: Record<string, number> = {};

    for (const item of items) {
        const group = getGroup(item);
        if (!group) continue;
        const segments = group.split('/');
        for (let index = 0; index < segments.length; index++) {
            const path = segments.slice(0, index + 1).join('/');
            groupCounts[path] = (groupCounts[path] ?? 0) + 1;
        }
    }

    const orderedSections = [
        ...sections.filter(section => section.group),
        ...sections.filter(section => !section.group),
    ];

    return orderedSections.map(section => {
        const headers: GroupHeader[] = [];
        if (section.group) {
            const segments = section.group.split('/');
            for (let index = 0; index < segments.length; index++) {
                const path = segments.slice(0, index + 1).join('/');
                if (!rendered.has(path)) {
                    rendered.add(path);
                    headers.push({
                        label: segments[index],
                        depth: index,
                        key: path,
                        count: groupCounts[path] ?? 0,
                    });
                }
            }
        }
        return { ...section, headers };
    });
}
