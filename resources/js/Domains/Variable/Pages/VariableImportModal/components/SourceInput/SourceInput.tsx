import TextFileImportInput from '@/Shared/UI/TextFileImportInput/TextFileImportInput';

interface SourceInputProps {
    raw: string;
    fileName: string | null;
    showEditor: boolean;
    hasDropError: boolean;
    hasParseError: boolean;
    onSourceChange: (raw: string, fileName: string | null) => void;
    onEditorToggle: (showEditor: boolean) => void;
}

export default function SourceInput({
    raw,
    fileName,
    showEditor,
    hasDropError,
    hasParseError,
    onSourceChange,
    onEditorToggle,
}: SourceInputProps) {
    return (
        <TextFileImportInput
            raw={raw}
            fileName={fileName}
            showEditor={showEditor}
            accept=".json,.env,.txt,.config,text/plain,application/json"
            title="Drop a JSON, .env or config file here"
            hint="or click to choose a file. JSON objects and KEY=value files are detected automatically."
            placeholder={'API_KEY=123\n!STRIPE_SECRET=sk_live_...\n\nor\n\n{\n  "API_URL": "https://example.com",\n  "!TOKEN": "secret"\n}'}
            hasFileError={hasDropError}
            hasContentError={hasParseError}
            onSourceChange={onSourceChange}
            onEditorToggle={onEditorToggle}
        />
    );
}
