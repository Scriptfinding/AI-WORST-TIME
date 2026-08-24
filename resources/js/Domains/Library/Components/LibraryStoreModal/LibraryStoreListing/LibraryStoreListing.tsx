import type { LibraryStoreItem, SortKey } from '@/Domains/Library/Components/LibraryStoreModal/types';
import LibraryStoreCards from './components/LibraryStoreCards/LibraryStoreCards';
import LibraryStoreCategories from './components/LibraryStoreCategories/LibraryStoreCategories';
import LibraryStorePagination from './components/LibraryStorePagination/LibraryStorePagination';
import LibraryStoreToolbar from './components/LibraryStoreToolbar/LibraryStoreToolbar';
import * as S from './styled';

interface Props {
    items: LibraryStoreItem[];
    categories: string[];
    categoryCounts: Record<string, number>;
    totalCount: number;
    search: string;
    category: string;
    sort: SortKey;
    page: number;
    perPage: number;
    loading: boolean;
    error: string | null;
    refreshing: boolean;
    onSearchChange: (value: string) => void;
    onCategoryChange: (value: string) => void;
    onSortChange: (value: SortKey) => void;
    onPageChange: (value: number) => void;
    onPerPageChange: (value: number) => void;
    onRefresh: () => void;
    onExplore: (item: LibraryStoreItem) => void;
}

export default function LibraryStoreListing({
    items,
    categories,
    categoryCounts,
    totalCount,
    search,
    category,
    sort,
    page,
    perPage,
    loading,
    error,
    refreshing,
    onSearchChange,
    onCategoryChange,
    onSortChange,
    onPageChange,
    onPerPageChange,
    onRefresh,
    onExplore,
}: Props) {
    const pageCount = Math.max(1, Math.ceil(items.length / perPage));

    return (
        <S.ListingView>
            <LibraryStoreToolbar
                search={search}
                sort={sort}
                loading={loading}
                refreshing={refreshing}
                onSearchChange={onSearchChange}
                onSortChange={onSortChange}
                onRefresh={onRefresh}
            />

            <S.ListingBody>
                <S.Layout>
                    <LibraryStoreCategories
                        categories={categories}
                        categoryCounts={categoryCounts}
                        totalCount={totalCount}
                        category={category}
                        onCategoryChange={onCategoryChange}
                    />
                    <LibraryStoreCards
                        items={items}
                        page={page}
                        perPage={perPage}
                        loading={loading}
                        error={error}
                        onExplore={onExplore}
                    />
                </S.Layout>
            </S.ListingBody>

            {!loading && items.length > 0 && (
                <LibraryStorePagination
                    page={page}
                    pageCount={pageCount}
                    perPage={perPage}
                    onPageChange={onPageChange}
                    onPerPageChange={onPerPageChange}
                />
            )}
        </S.ListingView>
    );
}
