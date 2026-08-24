import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import type { LibraryCollection, LibraryStoreItem } from '@/Domains/Library/Components/LibraryStoreModal/types';
import { formatCategory, itemColor, privateStoreLabel } from '@/Domains/Library/Components/LibraryStoreModal/utils';
import { safeLibraryIconUrl } from '@/Domains/Library/Components/LibraryStoreModal/libraryIcon';
import * as S from './styled';

interface Props {
    item: LibraryStoreItem;
    busyKey: string | null;
    error: string | null;
    onBack: () => void;
    onUpvote: (item: LibraryStoreItem) => void;
    onUseItem: (item: LibraryStoreItem, collection: LibraryCollection, reference: string) => void;
}

export default function LibraryBlueprintDetail({
    item,
    busyKey,
    error,
    onBack,
    onUpvote,
    onUseItem,
}: Props) {
    const iconUrl = safeLibraryIconUrl(item.icon_url, item.source_kind === 'private');

    return (
        <S.DetailView>
            <S.BackButton type="button" onClick={onBack}>
                <Icon icon="lucide:arrow-left" width={16} />
                Back to blueprints
            </S.BackButton>

            {error && <S.InlineError>{error}</S.InlineError>}

            <S.DetailHeader $color={itemColor(item)}>
                <S.DetailIcon>
                    {iconUrl
                        ? <img src={iconUrl} alt="" referrerPolicy="no-referrer" />
                        : <Icon icon="lucide:package" width={28} />}
                </S.DetailIcon>
                <div>
                    <S.DetailTitle>{item.title || item.label}</S.DetailTitle>
                    <S.DetailMeta>
                        {item.author_name || 'Unknown author'}
                        {item.category ? ` / ${formatCategory(item.category)}` : ''}
                    </S.DetailMeta>
                    <S.Description>{item.description || 'No description provided.'}</S.Description>
                </div>
                {item.source_kind === 'private' ? (
                    <S.DetailStats>
                        <S.PrivateStat>
                            <Icon icon="lucide:lock" width={12} />
                            Private
                            <S.PrivateTooltip>
                                <span>Private store</span>
                                <strong>{privateStoreLabel(item)}</strong>
                            </S.PrivateTooltip>
                        </S.PrivateStat>
                    </S.DetailStats>
                ) : (
                    <S.DetailStats>
                        <S.Stat title="Downloads"><Icon icon="lucide:download" width={12} />{item.stats.downloads_count}</S.Stat>
                        <S.LikeStat
                            type="button"
                            title="Likes"
                            $liked={Boolean(item.stats.upvoted)}
                            disabled={busyKey === item.key}
                            onClick={() => onUpvote(item)}
                        >
                            <Icon icon="lucide:thumbs-up" width={12} />
                            {item.stats.upvotes_count}
                        </S.LikeStat>
                    </S.DetailStats>
                )}
            </S.DetailHeader>

            <S.DetailContent>
                {item.flows.length > 0 && (
                    <S.DetailGroup>
                        <S.DetailGroupHeader>
                            <span>Flows</span>
                            <small>{item.flows.length} available</small>
                        </S.DetailGroupHeader>
                        <S.DetailGroupBody>
                            {item.flows.map(flow => (
                                <S.DetailItem key={flow.key}>
                                    <div>
                                        <strong>{flow.label}</strong>
                                        <small>{flow.description || 'No description provided.'}</small>
                                    </div>
                                    <S.ItemActions>
                                        {!flow.is_installed && Boolean(flow.used_count) && <S.UsagePill>{flow.used_count} used</S.UsagePill>}
                                        {flow.is_installed && (
                                            <S.InstalledPill
                                                href={flow.installed_url || '#'}
                                                target="_blank"
                                                rel="noreferrer"
                                                title="Open installed flow"
                                                onClick={(event) => {
                                                    if (!flow.installed_url) event.preventDefault();
                                                }}
                                            >
                                                <Icon icon="lucide:check" width={12} />
                                                In use
                                            </S.InstalledPill>
                                        )}
                                        {!flow.is_installed && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => onUseItem(item, 'flows', flow.reference)}
                                                loading={busyKey === `${item.key}:flows:${flow.reference}`}
                                            >
                                                <Icon icon="lucide:download" width={14} />
                                                Use
                                            </Button>
                                        )}
                                    </S.ItemActions>
                                </S.DetailItem>
                            ))}
                        </S.DetailGroupBody>
                    </S.DetailGroup>
                )}

                {item.snippets.length > 0 && (
                    <S.DetailGroup>
                        <S.DetailGroupHeader>
                            <span>Snippets</span>
                            <small>{item.snippets.length} available</small>
                        </S.DetailGroupHeader>
                        <S.DetailGroupBody>
                            {item.snippets.map(snippet => (
                                <S.DetailItem key={snippet.key}>
                                    <div>
                                        <strong>{snippet.label}</strong>
                                        <small>{snippet.description || 'No description provided.'}</small>
                                    </div>
                                    <S.ItemActions>
                                        {!snippet.is_installed && Boolean(snippet.used_count) && <S.UsagePill>{snippet.used_count} used</S.UsagePill>}
                                        {snippet.is_installed && (
                                            <S.InstalledPill
                                                href={snippet.installed_url || '#'}
                                                target="_blank"
                                                rel="noreferrer"
                                                title="Open installed snippet"
                                                onClick={(event) => {
                                                    if (!snippet.installed_url) event.preventDefault();
                                                }}
                                            >
                                                <Icon icon="lucide:check" width={12} />
                                                In use
                                            </S.InstalledPill>
                                        )}
                                        {!snippet.is_installed && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => onUseItem(item, 'snippets', snippet.reference)}
                                                loading={busyKey === `${item.key}:snippets:${snippet.reference}`}
                                            >
                                                <Icon icon="lucide:download" width={14} />
                                                Use
                                            </Button>
                                        )}
                                    </S.ItemActions>
                                </S.DetailItem>
                            ))}
                        </S.DetailGroupBody>
                    </S.DetailGroup>
                )}
            </S.DetailContent>

        </S.DetailView>
    );
}
