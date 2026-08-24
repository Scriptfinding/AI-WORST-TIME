import { useEffect, useRef } from 'react';
import {
    createLoadScope,
    loadOptions,
} from './utils.pp';
import type { GenerationRef } from './utils.pp';

interface VaultOptionsStageInput<T> {
    enabled: boolean;
    key: string;
    url: string;
    parse: (response: Response) => Promise<T[]>;
    onLoading: (loading: boolean) => void;
    onSuccess: (options: T[]) => void;
    onReset: () => void;
    generationScope: GenerationRef[];
}

// Runs one cancellable stage of the dependent vault option-loading pipeline.
export function useVaultOptionsStage<T>({
    enabled,
    key,
    url,
    parse,
    onLoading,
    onSuccess,
    onReset,
    generationScope,
}: VaultOptionsStageInput<T>) {
    const stageRef = useRef({ url, parse, onLoading, onSuccess, onReset, generationScope });
    stageRef.current = { url, parse, onLoading, onSuccess, onReset, generationScope };

    useEffect(() => {
        const {
            url: currentUrl,
            parse: currentParse,
            onLoading: setLoading,
            onSuccess: setOptions,
            onReset: reset,
            generationScope: currentGenerationScope,
        } = stageRef.current;
        const scope = createLoadScope(currentGenerationScope);

        if (!enabled) {
            setLoading(false);
            scope.abort();
            return;
        }

        setLoading(true);
        reset();

        void loadOptions<T>({
            url: currentUrl,
            signal: scope.signal,
            isCurrent: () => scope.isCurrent(currentGenerationScope[0]),
            parse: currentParse,
            setOptions,
            setLoading,
        });

        return scope.abort;
    }, [enabled, key]);
}
