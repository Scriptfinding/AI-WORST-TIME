export interface CodeSnapshotEditorProps {
    runId?: number;
    code: string;
    resolvedTheme: string;
    activeLine: number | null;
    passedLines: number[];
    errorLine?: number | null;
    flatBottom?: boolean;
}
