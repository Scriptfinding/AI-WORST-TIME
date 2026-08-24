import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';

export interface NodeCategory {
    key: string;
    label: string;
    description: string;
    icon: string;
    color: string;
    match: (entry: HelpEntryDef) => boolean;
    priority?: string[];
}

export interface CanvasNode {
    id: string;
    entry: HelpEntryDef;
    kind?: 'stickyNote';
    deactivated?: boolean;
    label?: string;
    x: number;
    y: number;
    values: Record<string, NodeParameterValue>;
    system?: NodalSystemNode;
    callArguments?: string[];
    scopeId?: string;
    localFunctionId?: string;
    stickyNote?: StickyNoteData;
}

export interface StickyNoteData {
    content: string;
    color: StickyNoteColor;
    customColor?: string;
    width: number;
    height: number;
}

export type StickyNoteColor = 'yellow' | 'orange' | 'red' | 'green' | 'teal' | 'blue' | 'indigo' | 'purple' | 'pink' | 'gray' | 'custom';

export type NodeParameterMode = 'fixed' | 'expression';
export type NodalGraphContext = 'flow' | 'function';
export type NodalSystemNode = 'run' | 'terminate' | 'function';

export interface ScalarNodeParameterValue {
    mode: NodeParameterMode;
    value: string;
}

export interface ObjectNodeParameterField {
    id: string;
    key: string;
    valueType?: ObjectFieldValueType;
    value: NodeParameterValue;
}

export interface ObjectNodeParameterValue {
    mode: 'object';
    inputMode: 'json' | 'form';
    jsonMode?: NodeParameterMode;
    value: string;
    fields: ObjectNodeParameterField[];
}

export type IfConditionCategory = 'string' | 'number' | 'dateTime' | 'boolean' | 'array' | 'object';
export type ObjectFieldValueType = IfConditionCategory | 'code';

export interface IfConditionRule {
    id: string;
    category: IfConditionCategory;
    operator: string;
    left: ScalarNodeParameterValue;
    right?: ScalarNodeParameterValue;
}

export interface IfConditionParameterValue {
    mode: 'if-condition';
    combinator: 'and' | 'or';
    rules: IfConditionRule[];
}

export type NodeParameterValue = ScalarNodeParameterValue | ObjectNodeParameterValue | IfConditionParameterValue;
export type RawNodeParameterValue = string | NodeParameterValue;

export type NodePortSide = 'input' | 'output';
export type NodePortKind = string;

export type Point = { x: number; y: number };

export interface NodalGraph {
    nodes: { id: string; name: string; kind?: 'stickyNote'; deactivated?: boolean; label?: string; x: number; y: number; values?: Record<string, RawNodeParameterValue>; system?: NodalSystemNode; callArguments?: string[]; scopeId?: string; localFunctionId?: string; stickyNote?: StickyNoteData }[];
    edges: { id: string; sourceNodeId: string; targetNodeId: string; sourcePort?: string; targetPort?: string }[];
}

export interface CanvasEdge {
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    sourcePort?: string;
    targetPort?: string;
}

export interface PendingConnectionTarget {
    fromNodeId: string;
    fromPort: NodePortKind;
    fromSide: NodePortSide;
    x: number;
    y: number;
}

export interface PendingEdgeInsertion {
    edgeId: string;
    sourceNodeId: string;
    targetNodeId: string;
    sourcePort?: string;
    targetPort?: string;
    x: number;
    y: number;
}

export interface ConnectionDragState {
    pointerId: number;
    fromNodeId: string;
    fromPort: NodePortKind;
    fromSide: NodePortSide;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
}

export interface SelectionBox {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
}

export interface NodeDragState {
    pointerId: number;
    nodeId: string;
    startX: number;
    startY: number;
    nodeX: number;
    nodeY: number;
    viewportOffsetX: number;
    viewportOffsetY: number;
    nodePositions: PointNodePosition[];
    allNodePositions: PointNodePosition[];
}

export type KnifeDragState = {
    pointerId: number;
    points: Point[];
};

export type TransformMode =
    | {
        kind: 'move';
        origin: Point;
        nodePositions: PointNodePosition[];
        allNodePositions: PointNodePosition[];
    }
    | {
        kind: 'swap';
        origin: Point;
        nodePositions: [PointNodePosition, PointNodePosition];
        axis: Point;
        distance: number;
    };

export type PointNodePosition = {
    id: string;
    x: number;
    y: number;
    kind?: 'stickyNote';
    movementAxis?: 'free' | 'vertical';
};

export interface GraphSnapshot {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
}

export interface GraphHistory {
    past: GraphSnapshot[];
    future: GraphSnapshot[];
}
