import type React from 'react';
import type { Flow, FlowRun } from '@/Domains/Flow/types';
import type { NodalGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';

export interface CodePaneProps {
    run: FlowRun;
    flow?: Flow | FlowRun['flow'];
    visualGraph?: NodalGraph | null;
    resolvedTheme: string;
    consoleOpen: boolean;
    consoleHeight: number;
    copyToClipboard: (text: string) => void;
    onToggleConsole: (open: boolean) => void;
    onConsoleResizeStart: (event: React.MouseEvent) => void;
}
