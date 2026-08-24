import SnippetsView from './SnippetsView';
import { type SnippetsProps, useSnippetsController } from './useSnippetsController';

export default function Snippets(props: SnippetsProps) {
    return <SnippetsView controller={useSnippetsController(props)} />;
}
