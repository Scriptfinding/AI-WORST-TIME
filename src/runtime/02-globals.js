/* @help Globals
 * @sig $input
 * @desc The input object passed to the flow. Contains all webhook and manual input data.
 * @nodal-desc Input data available to the flow, including manual or webhook values.
 * @availability none
 */
const __runInputPath = process.env.RUN_INPUT_PATH;
const __runOutputPath = process.env.RUN_OUTPUT_PATH || '';
const __runInternalOutputPath = process.env.RUN_INTERNAL_OUTPUT_PATH || '';
const __actionLogsPath = process.env.RUN_ACTION_LOGS_PATH || '';
const $json = JSON.parse(fs.readFileSync(__runInputPath, 'utf8'));
$json.$context.meta = {};

/* @help Globals
 * @sig $viewportWidth
 * @desc Effective browser viewport width in pixels.
 * @availability code
 */
const __configuredViewportWidth = Number($json.$viewportWidth);
let $viewportWidth = Number.isFinite(__configuredViewportWidth) && __configuredViewportWidth > 0
  ? __configuredViewportWidth
  : 1720;

/* @help Globals
 * @sig $viewportHeight
 * @desc Effective browser viewport height in pixels.
 * @availability code
 */
const __configuredViewportHeight = Number($json.$viewportHeight);
let $viewportHeight = Number.isFinite(__configuredViewportHeight) && __configuredViewportHeight > 0
  ? __configuredViewportHeight
  : 800;

const __configuredKeyboardSpeed = Number($json.$keyboardSpeed);
let __keyboardSpeedValue = Number.isFinite(__configuredKeyboardSpeed) && __configuredKeyboardSpeed >= 0
  ? __configuredKeyboardSpeed
  : 100;

// Run context: artifact paths and per-run inputs. Secrets and file paths are
// captured here then removed from process.env so user code cannot read them.
const __runId = $json.$context.run_id || 'default';
const __flowExecutionDir = './' + (process.env.FLOW_EXECUTION_DIR || 'data/execution');
const __flowArtifactsBasePath = process.env.PUPPETFLOW_ARTIFACTS_BASE_PATH || __flowExecutionDir + '/users/' + String(process.env.FLOW_OWNER_ID || 0).split('').join('/') + '/user/flows/' + String(process.env.FLOW_INTERNAL_ID || 0).split('').join('/') + '/flow';
const __flowRunArtifactsBasePath = process.env.PUPPETFLOW_RUN_ARTIFACTS_BASE_PATH || __flowArtifactsBasePath + '/runs/' + String(__runId).split('').join('/') + '/run';
const paths = {"downloads":"", "downloading": "", "screenshots":"", "tmp": "", "cookies": "", "recording": ""};

// The cookie workspace is run-scoped: it is hydrated from the per-user
// encrypted state before the run and persisted back after it.
['cookies'].forEach(d => {
  const p = path.join(__flowRunArtifactsBasePath, d);
  try {
    fs.existsSync(p) || fs.mkdirSync(p, { recursive: true });
    fs.chmodSync(p, 0o770);
  } catch {}
  paths[d] = p;
});

(process.env.ARTIFACTS_LIST || 'downloads,downloading,screenshots,recording,tmp').split(',').forEach(d => {
  const p = path.join(__flowRunArtifactsBasePath, d);
  try {
    fs.existsSync(p) || fs.mkdirSync(p, { recursive: true });
    // downloading dir needs 777 so the remote Chromium (different UID) can write to it
    fs.chmodSync(p, d === 'downloading' ? 0o777 : 0o755);
  } catch {}
  paths[d] = p;
});

const __resolveArtifactPath = function(rootPath, relativePath, label) {
  if (typeof relativePath !== 'string' || relativePath.length === 0 || relativePath.includes('\0')) {
    throw new Error((label || 'Artifact path') + ' must be a non-empty path');
  }

  const root = fs.realpathSync(rootPath);
  const resolved = path.isAbsolute(relativePath)
    ? path.resolve(relativePath)
    : path.resolve(root, relativePath);
  if (resolved === root || !resolved.startsWith(root + path.sep)) {
    throw new Error((label || 'Artifact path') + ' escapes its storage directory');
  }

  let current = root;
  for (const segment of path.relative(root, resolved).split(path.sep)) {
    current = path.join(current, segment);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) {
      throw new Error((label || 'Artifact path') + ' cannot traverse symbolic links');
    }
  }

  return resolved;
};

const __channelsPath = process.env.RUN_CHANNELS_PATH;
let __channelsJson = '[]';
if (__channelsPath) {
  try { __channelsJson = fs.readFileSync(__channelsPath, 'utf8'); } catch {}
  try { fs.unlinkSync(__channelsPath); } catch {}
}
const __watchersPath = process.env.RUN_WATCHERS_PATH;
let __watchersJson = '{}';
if (__watchersPath) {
  try { __watchersJson = fs.readFileSync(__watchersPath, 'utf8'); } catch {}
}
const __varsJson = process.env.PUPPETFLOW_VARS_ENV || '{}';
const __runtimeSecretsPath = process.env.RUN_SECRETS_PATH || '';
const __httpRequestAllowPrivate = String(process.env.RUNNER_HTTP_REQUEST_ALLOW_PRIVATE || '').toLowerCase() === 'true';
const __runnerOperations = (() => {
  const baseUrl = process.env.RUNNER_API_URL || '';
  const token = process.env.RUNNER_API_TOKEN || '';
  const send = async function(url, body, timeoutMs) {
    const parsedUrl = new URL(url);
    const transport = parsedUrl.protocol === 'https:'
      ? require('https')
      : require('http');
    const payload = JSON.stringify(body);

    return await new Promise((resolve, reject) => {
      let settled = false;
      const settle = (callback, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(deadline);
        callback(value);
      };
      const request = transport.request(parsedUrl, {
        method: 'POST',
        agent: false,
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'Connection': 'close',
        },
      }, response => {
        const chunks = [];
        response.on('data', chunk => chunks.push(Buffer.from(chunk)));
        response.on('error', error => settle(reject, error));
        response.on('end', () => {
          const responseBody = Buffer.concat(chunks).toString('utf8');
          const status = Number(response.statusCode) || 0;
          settle(resolve, {
            status,
            ok: status >= 200 && status < 300,
            text: async () => responseBody,
            json: async () => JSON.parse(responseBody),
          });
        });
      });
      const deadline = setTimeout(() => {
        request.destroy(new Error('Runtime API request timed out after ' + timeoutMs + 'ms.'));
      }, timeoutMs);
      request.on('error', error => settle(reject, error));
      request.end(payload);
    });
  };
  const request = async function(endpoint, body, timeoutMs = 10000) {
    if (!baseUrl || !token) {
      throw new Error('Runtime API is not available for this run.');
    }
    const safeTimeout = Math.max(1000, Math.min(Number(timeoutMs) || 10000, 300000));
    return await send(baseUrl + endpoint, body, safeTimeout);
  };

  return Object.freeze({
    available: Boolean(baseUrl && token && send),
    aiExecute: (body, timeoutMs) => request('/ai/execute', body, timeoutMs),
    dataTableRead: body => request('/data-table/read', body, 30000),
    dataTableWrite: body => request('/data-table/write', body, 30000),
    dataTableSchema: body => request('/data-table/schema', body, 30000),
    mailboxClaim: body => request('/mailbox/claim', body),
    mailboxRenew: body => request('/mailbox/renew', body),
    waitingDeclare: body => request('/waiting/declare', body),
    waitingConsume: body => request('/waiting/consume', body),
    waitingClear: body => request('/waiting/clear', body),
  });
})();
delete process.env.PUPPETFLOW_VARS_ENV;
delete process.env.RUN_INPUT_PATH;
delete process.env.RUN_OUTPUT_PATH;
delete process.env.RUN_INTERNAL_OUTPUT_PATH;
delete process.env.RUN_ACTION_LOGS_PATH;
delete process.env.RUN_CHANNELS_PATH;
delete process.env.RUN_WATCHERS_PATH;
delete process.env.RUN_SECRETS_PATH;
delete process.env.RUNNER_API_URL;
delete process.env.RUNNER_API_TOKEN;
delete process.env.RUNNER_HTTP_REQUEST_ALLOW_PRIVATE;
delete process.env.FLOW_INTERNAL_ID;
const $_appUrl = process.env.APP_URL || '';

/* @help Globals
 * @sig $client
 * @desc CDP session for low-level Chrome DevTools Protocol access (Page.setDownloadBehavior, etc.).
 * @nodal-desc Low-level browser control object for advanced flows.
 */
const __downloadingPath = process.env.PINOKIO_DOWNLOADING_PATH || paths.downloading;
const __downloadsPath = process.env.PINOKIO_DOWNLOADS_PATH || paths.downloads;
const __pageClients = new WeakMap();
const __installPageRunProgressNoops = () => {
  window.__nopRunLine = window.__nopRunLine || (() => {});
  window.__nopRunNodeStart = window.__nopRunNodeStart || (() => {});
  window.__nopRunNodeEnd = window.__nopRunNodeEnd || (() => {});
  window.__nopRunEdge = window.__nopRunEdge || (() => {});
};
await __registerNamedPageInitializer(async page => {
  const client = await page.target().createCDPSession();
  __pageClients.set(page, client);
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: __downloadingPath,
  });
  try {
    await page.evaluateOnNewDocument(__installPageRunProgressNoops);
    await page.evaluate(__installPageRunProgressNoops);
  } catch (_) {}
});
const $client = new Proxy({}, {
  get(_target, property) {
    const client = __pageClients.get(__getActivePage());
    if (!client) throw new Error('CDP session is not ready for the active browser tab.');
    const value = Reflect.get(client, property, client);
    return typeof value === 'function'
      ? (...args) => {
          const activeClient = __pageClients.get(__getActivePage());
          if (!activeClient) throw new Error('CDP session is not ready for the active browser tab.');
          return Reflect.apply(Reflect.get(activeClient, property, activeClient), activeClient, args);
        }
      : value;
  },
});

class StopRun extends Error {
  constructor(message, response) {
    super(message);
    this.name = 'StopRun';
    this.response = response || null;
  }
}

