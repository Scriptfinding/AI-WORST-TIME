import { useCallback, useEffect, useState } from 'react';
import type { ArtifactFile, FlowRun } from '@/Domains/Flow/types';

// Fetches and refreshes the screenshot and download artifacts for the active run.
export function useRunArtifacts(run: FlowRun | null, flowId: Id, artifactsTabActive: boolean) {
    const [screenshotFiles, setScreenshotFiles] = useState<ArtifactFile[]>([]);
    const [downloadFiles, setDownloadFiles] = useState<ArtifactFile[]>([]);
    const [screenshotsLoading, setScreenshotsLoading] = useState(false);
    const [downloadsLoading, setDownloadsLoading] = useState(false);
    const runId = run?.id;

    useEffect(() => {
        if (runId === undefined) return;
        setScreenshotFiles([]);
        setDownloadFiles([]);
        setScreenshotsLoading(false);
        setDownloadsLoading(false);
    }, [runId]);

    const fetchBothArtifacts = useCallback((runId: number) => {
        setScreenshotsLoading(true);
        setDownloadsLoading(true);
        setScreenshotFiles([]);
        setDownloadFiles([]);
        fetch(`/flows/${flowId}/runs/${runId}/artifacts/screenshots`)
            .then(response => response.json())
            .then((files: ArtifactFile[]) => setScreenshotFiles(files))
            .catch(() => setScreenshotFiles([]))
            .finally(() => setScreenshotsLoading(false));
        fetch(`/flows/${flowId}/runs/${runId}/artifacts/downloads`)
            .then(response => response.json())
            .then((files: ArtifactFile[]) => setDownloadFiles(files))
            .catch(() => setDownloadFiles([]))
            .finally(() => setDownloadsLoading(false));
    }, [flowId]);

    useEffect(() => {
        if (runId !== undefined && artifactsTabActive) {
            fetchBothArtifacts(runId);
        }
    }, [runId, artifactsTabActive, fetchBothArtifacts]);

    return {
        screenshotFiles,
        downloadFiles,
        screenshotsLoading,
        downloadsLoading,
    };
}
