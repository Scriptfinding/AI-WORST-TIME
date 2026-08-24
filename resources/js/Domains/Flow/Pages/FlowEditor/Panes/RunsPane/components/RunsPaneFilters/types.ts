export type MetaFilter = { key: string; operator: string; value: string };
export type MetaPredicate = 'and' | 'or';
export type MetaPresence = '' | 'any' | 'none';

export const emptyMetaFilter = (): MetaFilter => ({
    key: '',
    operator: 'contains',
    value: '',
});
