import { useEffect, useState, type MouseEvent } from 'react';
import { usePageProps } from '@/App/Hooks/usePageProps';
import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './styled';

const REPOSITORY_URL = 'https://github.com/puppetflow/puppetflow';
const STARGAZERS_URL = `${REPOSITORY_URL}/stargazers`;
const REPOSITORY_API_URL = 'https://api.github.com/repos/puppetflow/puppetflow';
const HIDDEN_STORAGE_KEY = 'puppetflow.hideGithubStarButton';
const STARS_CACHE_KEY = 'puppetflow.githubStars';
const STARS_CACHE_TTL = 60 * 60 * 1000;

interface StarsCache {
    count: number;
    cachedAt: number;
}

function formatStars(value: unknown): string {
    const count = Number(value);
    if (!Number.isFinite(count) || count < 0) return '0';

    return String(Math.trunc(count)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getCachedStars(): number | null {
    try {
        const cached = sessionStorage.getItem(STARS_CACHE_KEY);
        if (!cached) return null;

        const value = JSON.parse(cached) as StarsCache;
        return Number.isInteger(value.count) && Date.now() - value.cachedAt < STARS_CACHE_TTL
            ? value.count
            : null;
    } catch {
        return null;
    }
}

function isDismissed(): boolean {
    try {
        return localStorage.getItem(HIDDEN_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

export default function GitHubStarsWidget() {
    const { settings } = usePageProps();
    const enabled = settings.github_stargazers === true;
    const [dismissed, setDismissed] = useState(() => typeof window !== 'undefined' && isDismissed());
    const [stars, setStars] = useState(0);
    const [thanked, setThanked] = useState(false);

    useEffect(() => {
        if (!thanked) return;

        const timeout = window.setTimeout(() => setThanked(false), 10_000);
        return () => window.clearTimeout(timeout);
    }, [thanked]);

    useEffect(() => {
        if (!enabled || dismissed) return;

        const cachedStars = getCachedStars();
        if (cachedStars !== null) {
            setStars(cachedStars);
            return;
        }

        const controller = new AbortController();
        void fetch(REPOSITORY_API_URL, {
            headers: { Accept: 'application/vnd.github+json' },
            signal: controller.signal,
        })
            .then(response => {
                if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
                return response.json() as Promise<{ stargazers_count?: unknown }>;
            })
            .then(repository => {
                const parsedCount = Number(repository.stargazers_count);
                const count = Number.isFinite(parsedCount) && parsedCount >= 0
                    ? Math.trunc(parsedCount)
                    : 0;
                setStars(count);
                try {
                    sessionStorage.setItem(STARS_CACHE_KEY, JSON.stringify({
                        count,
                        cachedAt: Date.now(),
                    } satisfies StarsCache));
                } catch {
                    // Keep the fetched count when browser storage is unavailable.
                }
            })
            .catch(error => {
                if (!(error instanceof DOMException && error.name === 'AbortError')) {
                    setStars(0);
                }
            });

        return () => controller.abort();
    }, [dismissed, enabled]);

    if (!enabled || dismissed) return null;
    const dismiss = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        try {
            localStorage.setItem(HIDDEN_STORAGE_KEY, 'true');
        } catch {
            // The widget can still be dismissed for the current page.
        }
        setDismissed(true);
    };

    return (
        <S.DesktopWidget>
            <S.Divider aria-hidden="true" />
            <S.Widget>
                <S.StarLink
                    href={REPOSITORY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Puppetflow on GitHub"
                    onClick={() => setThanked(true)}
                >
                    <Icon icon="mdi:github" width={17} height={17} />
                    <span>{thanked ? 'Thanks!' : 'Star on Github'}</span>
                </S.StarLink>
                <S.CountLink
                    href={STARGAZERS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View Puppetflow stargazers"
                    hidden
                >
                    {formatStars(stars)}
                </S.CountLink>
                <S.DismissButton
                    type="button"
                    onClick={dismiss}
                    aria-label="Permanently hide GitHub link"
                    title="Permanently hide"
                >
                    <Icon icon="lucide:circle-x" width={14} height={14} />
                </S.DismissButton>
            </S.Widget>
        </S.DesktopWidget>
    );
}
