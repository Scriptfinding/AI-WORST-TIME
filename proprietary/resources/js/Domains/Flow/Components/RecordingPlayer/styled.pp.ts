import styled from 'styled-components';

export const PlayerContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: #000;
    border-radius: 2px;
    outline: none;
`;

export const PlayerBody = styled.div`
    display: flex;
    flex: 1;
    min-height: 0;

    @media (max-width: 768px) {
        flex-direction: column;
    }
`;

export const VideoColumn = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;

    @media (max-width: 768px) {
        flex: none;
        height: 50%;
    }
`;

export const VideoWrapper = styled.div`
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    cursor: pointer;
    overflow: hidden;
`;

export const Video = styled.video`
    max-width: 100%;
    max-height: 100%;
    outline: none;
`;

export const PlayOverlay = styled.div`
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;

    ${VideoWrapper}:hover & {
        opacity: 1;
    }
`;

export const PlayOverlayCircle = styled.div`
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
`;
