import { useMemo, useState } from 'react';
import { useToast } from '@/App/Hooks/useToast';
import InspectorSchemaTree from './components/InspectorSchemaTree/InspectorSchemaTree';
import InspectorToolbar, { type InspectorTab } from './components/InspectorToolbar/InspectorToolbar';
import InspectorTreeNode from './components/InspectorTreeNode/InspectorTreeNode';
import { useReferenceDisplays } from './referenceDisplays';
import { buildTreeRows, stringifyJson } from './utils';
import * as S from './styled';

interface DataInspectorProps {
    title: string;
    value: unknown;
    copyValue?: unknown;
    rootPath: string;
    emptyText: string;
    tabStorageKey?: string;
    flowId?: Id;
}

export default function DataInspector({
    title,
    value,
    copyValue,
    rootPath,
    emptyText,
    tabStorageKey,
    flowId,
}: DataInspectorProps) {
    const { toast } = useToast();
    const [tab, setTab] = useState<InspectorTab>(() => {
        if (!tabStorageKey || typeof window === 'undefined') return 'json';
        return window.localStorage.getItem(tabStorageKey) === 'schema' ? 'schema' : 'json';
    });
    const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(() => new Set());
    const references = useReferenceDisplays(flowId);
    const rows = useMemo(() => buildTreeRows(value, rootPath), [rootPath, value]);
    const hasValue = value !== null && value !== undefined;
    const clipboardValue = copyValue ?? value;
    const changeTab = (nextTab: InspectorTab) => {
        setTab(nextTab);
        if (tabStorageKey && typeof window !== 'undefined') {
            window.localStorage.setItem(tabStorageKey, nextTab);
        }
    };
    const toggleCollapsedPath = (path: string) => {
        setCollapsedPaths(current => {
            const next = new Set(current);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };
    const copyJson = () => {
        if (!hasValue) return;
        if (!navigator.clipboard) {
            toast('Clipboard is not available');
            return;
        }

        let serialized: string | undefined;
        try {
            serialized = stringifyJson(clipboardValue);
        } catch {
            toast('Unable to copy JSON');
            return;
        }
        if (serialized === undefined) {
            toast('Unable to copy JSON');
            return;
        }

        navigator.clipboard.writeText(serialized)
            .then(() => toast(`${title} JSON copied to clipboard`))
            .catch(() => toast('Unable to copy JSON'));
    };

    return (
        <S.InspectorPanel>
            <InspectorToolbar
                title={title}
                tab={tab}
                hasValue={hasValue}
                onTabChange={changeTab}
                onCopy={copyJson}
            />
            <S.InspectorBody>
                {!hasValue ? (
                    <S.InspectorEmpty>{emptyText}</S.InspectorEmpty>
                ) : tab === 'json' ? (
                    <S.InspectorJsonTree>
                        <InspectorTreeNode
                            value={value}
                            path={rootPath}
                            references={references}
                            collapsedPaths={collapsedPaths}
                            onToggleCollapse={toggleCollapsedPath}
                        />
                    </S.InspectorJsonTree>
                ) : (
                    <InspectorSchemaTree rows={rows} references={references} />
                )}
            </S.InspectorBody>
        </S.InspectorPanel>
    );
}
