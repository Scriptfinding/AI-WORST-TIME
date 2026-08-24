import { formatCategory } from '@/Domains/Library/Components/LibraryStoreModal/utils';
import * as S from './styled';

interface Props {
    categories: string[];
    categoryCounts: Record<string, number>;
    totalCount: number;
    category: string;
    onCategoryChange: (value: string) => void;
}

export default function LibraryStoreCategories({
    categories,
    categoryCounts,
    totalCount,
    category,
    onCategoryChange,
}: Props) {
    return (
        <S.Categories>
            <S.CategoryButton type="button" $active={!category} onClick={() => onCategoryChange('')}>
                All categories <span>{totalCount}</span>
            </S.CategoryButton>
            {categories.map((itemCategory) => (
                <S.CategoryButton
                    key={itemCategory}
                    type="button"
                    $active={category === itemCategory}
                    onClick={() => onCategoryChange(itemCategory)}
                >
                    {formatCategory(itemCategory)} <span>{categoryCounts[itemCategory] || 0}</span>
                </S.CategoryButton>
            ))}
        </S.Categories>
    );
}
