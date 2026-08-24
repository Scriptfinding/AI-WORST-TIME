import React, { useMemo } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { LibraryStoreItem } from '@/Domains/Library/Components/LibraryStoreModal/types';
import { itemColor, privateStoreLabel } from '@/Domains/Library/Components/LibraryStoreModal/utils';
import { safeLibraryIconUrl } from '@/Domains/Library/Components/LibraryStoreModal/libraryIcon';
import * as S from './styled';

interface Props {
    items: LibraryStoreItem[];
    page: number;
    perPage: number;
    loading: boolean;
    error: string | null;
    onExplore: (item: LibraryStoreItem) => void;
}

export default function LibraryStoreCards({
    items,
    page,
    perPage,
    loading,
    error,
    onExplore,
}: Props) {
    const pageItems = useMemo(
        () => items.slice((page - 1) * perPage, page * perPage),
        [items, page, perPage],
    );

    return (
        <S.Grid>
            {error && items.length > 0 && <S.InlineError>{error}</S.InlineError>}
            {error && items.length === 0 && <S.Empty>{error}</S.Empty>}
            {!error && loading && (
                <S.CenterLoader>
                    <S.Spinner />
                    <span>Loading blueprints...</span>
                </S.CenterLoader>
            )}
            {!loading && items.length === 0 && !error && <S.Empty>No matching blueprints.</S.Empty>}
            {!loading && pageItems.map((item) => {
                const iconUrl = safeLibraryIconUrl(item.icon_url, item.source_kind === 'private');

                return (
                <S.Card
                    key={item.key}
                    role="button"
                    tabIndex={0}
                    $color={itemColor(item)}
                    onClick={() => onExplore(item)}
                    onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onExplore(item);
                        }
                    }}
                >
                    <S.CardHeader>
                        <S.CardHeaderMain>
                            <S.IconBox>
                                {iconUrl
                                    ? <img src={iconUrl} alt="" referrerPolicy="no-referrer" />
                                    : <Icon icon="lucide:package" width={20} />}
                            </S.IconBox>
                            <S.CardText>
                                <S.CardTitle>{item.title || item.label}</S.CardTitle>
                                <S.CardMeta>{item.author_name || 'Unknown author'}</S.CardMeta>
                            </S.CardText>
                        </S.CardHeaderMain>
                    </S.CardHeader>
                    <S.Description>{item.description || 'No description provided.'}</S.Description>
                    <S.Actions>
                        {item.is_installed && (
                            <S.InstalledPill>
                                <Icon icon="lucide:check-circle-2" width={13} />
                                In use
                            </S.InstalledPill>
                        )}
                        <S.FooterStats>
                            {item.source_kind === 'private' ? (
                                <S.PrivateFooterStat>
                                    <Icon icon="lucide:lock" width={12} />
                                    Private
                                    <S.PrivateTooltip>
                                        <span>Private store</span>
                                        <strong>{privateStoreLabel(item)}</strong>
                                    </S.PrivateTooltip>
                                </S.PrivateFooterStat>
                            ) : (
                                <>
                                    <S.FooterStat title="Downloads">
                                        <Icon icon="lucide:download" width={12} />
                                        {item.stats.downloads_count}
                                    </S.FooterStat>
                                    <S.FooterStat title="Likes">
                                        <Icon icon="lucide:thumbs-up" width={12} />
                                        {item.stats.upvotes_count}
                                    </S.FooterStat>
                                </>
                            )}
                        </S.FooterStats>
                    </S.Actions>
                </S.Card>
                );
            })}
        </S.Grid>
    );
}
