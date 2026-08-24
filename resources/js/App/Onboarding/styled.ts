import styled from 'styled-components';
import type { OnboardingAccent, OnboardingLayout } from './pageOnboarding';

const ACCENTS: Record<OnboardingAccent, { main: string; soft: string; glow: string }> = {
    blue: { main: '#5b8cff', soft: '#5b8cff20', glow: '#5b8cff55' },
    cyan: { main: '#22d3c5', soft: '#22d3c520', glow: '#22d3c555' },
    amber: { main: '#f6b73c', soft: '#f6b73c20', glow: '#f6b73c55' },
    pink: { main: '#f472b6', soft: '#f472b620', glow: '#f472b655' },
    lime: { main: '#8acb45', soft: '#8acb4520', glow: '#8acb4555' },
    violet: { main: '#9b7cf8', soft: '#9b7cf820', glow: '#9b7cf855' },
};

export const Experience = styled.div<{ $layout: OnboardingLayout; $accent: OnboardingAccent }>`
    --onboarding-accent: ${({ $accent }) => ACCENTS[$accent].main};
    --onboarding-soft: ${({ $accent }) => ACCENTS[$accent].soft};
    --onboarding-glow: ${({ $accent }) => ACCENTS[$accent].glow};
    display: ${({ $layout }) => ($layout === 'split' || $layout === 'poster' ? 'grid' : 'flex')};
    grid-template-columns: ${({ $layout }) => ($layout === 'poster' ? '1fr 210px' : '210px 1fr')};
    grid-template-areas: ${({ $layout }) => ($layout === 'poster' ? '"copy media"' : '"media copy"')};
    flex-direction: column;
    gap: ${({ $layout }) => ($layout === 'hero' ? '20px' : '18px')};
    min-width: 0;

    @media (max-width: 680px) {
        display: flex;
        flex-direction: column;
    }
`;

export const Media = styled.div<{ $layout: OnboardingLayout }>`
    position: relative;
    grid-area: media;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: ${({ $layout }) => ($layout === 'hero' ? '150px' : '210px')};
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--onboarding-accent) 32%, transparent);
    border-radius: ${({ theme }) => theme.radius.lg};
    background:
        radial-gradient(circle at 28% 20%, var(--onboarding-glow), transparent 34%),
        radial-gradient(circle at 78% 80%, var(--onboarding-soft), transparent 38%),
        linear-gradient(145deg, ${({ theme }) => theme.colors.bg.primary}, ${({ theme }) => theme.colors.bg.secondary});
    isolation: isolate;

    &::before {
        content: '';
        position: absolute;
        width: 180px;
        height: 180px;
        border: 1px solid color-mix(in srgb, var(--onboarding-accent) 28%, transparent);
        border-radius: ${({ $layout }) => {
            if ($layout === 'hero') return '38% 62% 46% 54% / 55% 42% 58% 45%';
            if ($layout === 'split') return '58% 42% 63% 37% / 44% 57% 43% 56%';
            if ($layout === 'cards') return '47% 53% 35% 65% / 61% 39% 56% 44%';
            if ($layout === 'timeline') return '64% 36% 52% 48% / 40% 60% 37% 63%';
            return '42% 58% 65% 35% / 38% 45% 55% 62%';
        }};
        animation: media-orbit 12s linear infinite;
    }

    &::after {
        content: '';
        position: absolute;
        inset: 12px;
        border-radius: inherit;
        background-image: radial-gradient(var(--onboarding-accent) 0.8px, transparent 0.8px);
        background-size: 13px 13px;
        opacity: 0.18;
        z-index: -1;
    }

    @keyframes media-orbit {
        to { transform: rotate(360deg); }
    }

    @media (prefers-reduced-motion: reduce) {
        &::before { animation: none; }
    }
`;

export const MainIcon = styled.div`
    position: relative;
    z-index: 2;
    display: grid;
    place-items: center;
    width: 78px;
    height: 78px;
    border: 1px solid color-mix(in srgb, var(--onboarding-accent) 40%, transparent);
    border-radius: 24px;
    background: color-mix(in srgb, ${({ theme }) => theme.colors.bg.secondary} 86%, var(--onboarding-accent));
    color: var(--onboarding-accent);
    box-shadow: 0 18px 50px var(--onboarding-soft);
    transform: rotate(-5deg);
    animation: icon-arrive 500ms cubic-bezier(.2, .9, .3, 1.2) both;

    @keyframes icon-arrive {
        from { opacity: 0; transform: translateY(12px) rotate(-12deg) scale(.82); }
        to { opacity: 1; transform: translateY(0) rotate(-5deg) scale(1); }
    }

    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }
`;

export const Satellite = styled.div<{ $position: 'top' | 'bottom' }>`
    position: absolute;
    z-index: 3;
    ${({ $position }) => ($position === 'top' ? 'top: 22px; right: 24px;' : 'bottom: 20px; left: 24px;')}
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 13px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    color: var(--onboarding-accent);
    box-shadow: ${({ theme }) => theme.shadow.md};
`;

export const BrandIcons = styled.div`
    position: absolute;
    inset: 0;
    z-index: 4;
    pointer-events: none;
`;

export const BrandIcon = styled.span`
    --brand-rotation: 0deg;
    --brand-scale: 1;
    position: absolute;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: 10px;
    background: ${({ theme }) => theme.colors.bg.primary};
    box-shadow: ${({ theme }) => theme.shadow.md};
    animation: brand-float 3.6s ease-in-out infinite;

    &:nth-child(1) {
        --brand-rotation: -14deg;
        --brand-scale: .86;
        top: 17%;
        left: 16%;
    }

    &:nth-child(2) {
        --brand-rotation: 11deg;
        --brand-scale: 1.18;
        top: 34%;
        right: 14%;
        animation-delay: -1.2s;
    }

    &:nth-child(3) {
        --brand-rotation: -7deg;
        --brand-scale: .74;
        bottom: 10%;
        left: 31%;
        animation-delay: -2.4s;
    }

    @keyframes brand-float {
        0%, 100% {
            transform: translateY(0) rotate(var(--brand-rotation)) scale(var(--brand-scale));
        }
        50% {
            transform: translateY(-7px) rotate(var(--brand-rotation)) scale(var(--brand-scale));
        }
    }

    @media (prefers-reduced-motion: reduce) {
        animation: none;
        transform: rotate(var(--brand-rotation)) scale(var(--brand-scale));
    }
`;

export const Confetti = styled.i<{ $index: number }>`
    position: absolute;
    top: ${({ $index }) => 18 + (($index * 29) % 70)}%;
    left: ${({ $index }) => 8 + (($index * 37) % 84)}%;
    width: ${({ $index }) => ($index % 2 === 0 ? '5px' : '8px')};
    height: ${({ $index }) => ($index % 3 === 0 ? '12px' : '5px')};
    border-radius: 999px;
    background: ${({ $index }) => ($index % 2 === 0 ? 'var(--onboarding-accent)' : 'currentColor')};
    color: ${({ theme }) => theme.colors.text.tertiary};
    opacity: 0.48;
    transform: rotate(${({ $index }) => $index * 31}deg);
`;

export const Copy = styled.div`
    grid-area: copy;
    min-width: 0;
`;

export const MarketingLine = styled.h2`
    position: relative;
    margin: 0 auto 18px;
    padding-bottom: 13px;
    max-width: 560px;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: clamp(20px, 2.4vw, 26px);
    font-weight: 700;
    letter-spacing: -0.035em;
    line-height: 1.16;
    text-align: center;
    text-wrap: balance;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 42px;
        height: 3px;
        border-radius: 999px;
        background: var(--onboarding-accent);
        box-shadow: 0 0 16px var(--onboarding-glow);
        transform: translateX(-50%);
    }
`;

export const Intro = styled.p`
    margin: 0;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 14px;
    line-height: 1.6;
`;

export const Highlights = styled.ol<{ $layout: OnboardingLayout }>`
    display: grid;
    grid-template-columns: ${({ $layout }) => ($layout === 'cards' ? 'repeat(3, minmax(0, 1fr))' : '1fr')};
    gap: ${({ $layout }) => ($layout === 'cards' ? '8px' : '9px')};
    margin: 18px 0;
    padding: 0;
    list-style: none;

    @media (max-width: 680px) {
        grid-template-columns: 1fr;
    }
`;

export const Highlight = styled.li<{ $layout: OnboardingLayout }>`
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: ${({ $layout }) => ($layout === 'cards' ? '11px' : '2px 0')};
    border: ${({ $layout, theme }) => ($layout === 'cards' ? `1px solid ${theme.colors.border.default}` : '0')};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ $layout, theme }) => ($layout === 'cards' ? theme.colors.bg.primary : 'transparent')};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    line-height: 1.5;

    > span:first-child {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 20px;
        height: 20px;
        border-radius: 7px;
        background: var(--onboarding-soft);
        color: var(--onboarding-accent);
        font-size: 10px;
        font-weight: 700;
    }

    > svg {
        flex: 0 0 auto;
        margin-top: 2px;
        color: var(--onboarding-accent);
    }
`;

export const NextStep = styled.div`
    padding: 12px 14px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: linear-gradient(90deg, var(--onboarding-soft), transparent 70%);
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 13px;
    line-height: 1.5;

    strong {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const Footer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
`;

export const DisableButton = styled.button`
    padding: 6px 0;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
    text-decoration: underline;
    text-decoration-color: transparent;
    text-underline-offset: 3px;
    transition: color 150ms ease, text-decoration-color 150ms ease;

    &:hover {
        color: ${({ theme }) => theme.colors.text.secondary};
        text-decoration-color: currentColor;
    }
`;
