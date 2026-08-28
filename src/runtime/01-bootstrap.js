const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const util = require('util');
const { exec, spawn } = require('child_process');
const __requireSandboxModule = function(moduleName) {
  const candidates = [
    process.env.SANDBOX_NODE_MODULES_PATH ? path.join(process.env.SANDBOX_NODE_MODULES_PATH, moduleName) : null,
    path.join(process.cwd(), 'node_modules', moduleName),
    path.join(path.resolve(__dirname, '..', 'node_modules'), moduleName),
    moduleName,
  ].filter(Boolean);
  let lastError = null;
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};
const { DateTime, Duration, Interval } = __requireSandboxModule('luxon');
let SCREENSHOT_CPT = 0;
const _artifactExcluded = { screenshots: new Set(), downloads: new Set() };
const _pendingCleanup = [];
const _outputData = {};

const __nodeStartTs = Date.now();
const __actionLogs = [];
let __actionLogsDirty = false;
let __lastActionLogsFlush = 0;
const __flushActionLogs = (force = false) => {
  if (!__actionLogsPath || !__actionLogsDirty) return;
  const now = Date.now();
  if (!force && now - __lastActionLogsFlush < 1000) return;
  try {
    fs.writeFileSync(__actionLogsPath, JSON.stringify(__actionLogs));
    __actionLogsDirty = false;
    __lastActionLogsFlush = now;
  } catch (_) {}
};
const __actionLogsFlushTimer = setInterval(() => __flushActionLogs(), 1000);
if (typeof __actionLogsFlushTimer.unref === 'function') __actionLogsFlushTimer.unref();
let __nopCurrentLine = null;
const __nopCurrentNodeStack = [];
let __actionLogSuppressionDepth = 0;
const __emitRunProgress = (event) => {
  try {
    fs.writeSync(1, '__NOP_RUN_EVENT__' + JSON.stringify({
      ...event,
      offset_ms: Date.now() - (typeof _recordingStartTs !== 'undefined' ? _recordingStartTs : __nodeStartTs),
    }) + '\n');
  } catch (_) {}
};
const __nopRunLine = (line) => {
  __nopCurrentLine = line;
  __emitRunProgress({ kind: 'line', line, phase: 'start' });
};
const __nopRunNodeStart = (nodeId) => {
  __nopCurrentNodeStack.push(String(nodeId));
  __emitRunProgress({ kind: 'node', nodeId, phase: 'start' });
};
const __nopRunNodeEnd = (nodeId) => {
  const normalizedNodeId = String(nodeId);
  const stackIndex = __nopCurrentNodeStack.lastIndexOf(normalizedNodeId);
  if (stackIndex !== -1) __nopCurrentNodeStack.splice(stackIndex, 1);
  __emitRunProgress({ kind: 'node', nodeId, phase: 'end' });
};
const __nopRunEdge = (edgeId) => {
  __emitRunProgress({ kind: 'edge', edgeId });
};
const __formatActionValue = (value) => {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.stack || value.message;
  if (typeof value === 'function') return value.toString();
  try {
    const json = JSON.stringify(value, null, 2);
    if (json !== undefined) return json;
  } catch (_) {}
  return util.inspect(value);
};
const __formatActionLabel = (...values) => values.map(__formatActionValue).join(' ');
const __emitAction = (action, label, metadata = {}) => {
  if (__actionLogSuppressionDepth > 0) return null;
  if (__nopCurrentLine) __emitRunProgress({ kind: 'line', line: __nopCurrentLine, phase: 'start' });
  const entry = {
    action,
    label: __formatActionValue(label ?? ''),
    offset_ms: Date.now() - (typeof _recordingStartTs !== 'undefined' ? _recordingStartTs : __nodeStartTs),
    ...(__nopCurrentNodeStack.length > 0 ? { node_id: __nopCurrentNodeStack[__nopCurrentNodeStack.length - 1] } : {}),
    ...metadata,
  };
  __actionLogs.push(entry);
  __actionLogsDirty = true;
  __flushActionLogs();
  return entry;
};

