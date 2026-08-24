const fs = require('fs');
const crypto = require('crypto');
const os = require('os');
const { pathToFileURL } = require('url');
const util = require('util');
const vm = require('vm');

const logInspectDepth = Number.parseInt(process.env.RUNNER_LOG_DEPTH || '', 10);
const logInspectArrayLimit = Number.parseInt(process.env.RUNNER_LOG_ARRAY_LIMIT || '', 10);
delete process.env.RUNNER_LOG_DEPTH;
delete process.env.RUNNER_LOG_ARRAY_LIMIT;
util.inspect.defaultOptions.depth = Number.isInteger(logInspectDepth)
  ? Math.min(20, Math.max(0, logInspectDepth))
  : 8;
util.inspect.defaultOptions.maxArrayLength = Number.isInteger(logInspectArrayLimit)
  ? Math.min(1000, Math.max(1, logInspectArrayLimit))
  : 100;
util.inspect.defaultOptions.breakLength = 120;

// Name given to the assembled run script so stack traces are attributable.
const RUN_SCRIPT_FILENAME = 'run-definitive.js';

const PINOKIO_ENABLED = process.env.PINOKIO_ENABLED === 'true';
const PINOKIO_HOST = process.env.PINOKIO_HOST || 'localhost';
const PINOKIO_PORT = process.env.PINOKIO_PORT || '3888';
const PINOKIO_TOKEN = process.env.PINOKIO_TOKEN || '';
const PINOKIO_SECURE = process.env.PINOKIO_SECURE === 'true';
const RUNNER_PROXY_SERVER = process.env.RUNNER_PROXY_SERVER || '';
const RUNNER_PROXY_USERNAME = process.env.RUNNER_PROXY_USERNAME || '';
const RUNNER_PROXY_PASSWORD = process.env.RUNNER_PROXY_PASSWORD || '';
for (const key of ['PINOKIO_ENABLED', 'PINOKIO_HOST', 'PINOKIO_PORT', 'PINOKIO_TOKEN', 'PINOKIO_SECURE']) {
  delete process.env[key];
}
for (const key of ['RUNNER_PROXY_SERVER', 'RUNNER_PROXY_USERNAME', 'RUNNER_PROXY_PASSWORD']) {
  delete process.env[key];
}

module.exports = async function(appDir, flowId, quiet) {
  const _origDebug = console.debug;
  console.debug = (...args) => {
    const formatted = util.format(...args);
    for (const line of formatted.split('\n')) {
      _origDebug('[DEBUG] ' + line);
    }
  };

  console.debug('========================================');
  console.debug('Starting flow:', flowId);

  // The header reads the run input itself; default to the CLI location.
  process.env.RUN_INPUT_PATH = process.env.RUN_INPUT_PATH || `${appDir}/data/run-input.json`;
  const runErrorPath = process.env.RUN_ERROR_PATH || '';
  const chromeUserDataDir = PINOKIO_ENABLED
    ? null
    : `/tmp/cr-${process.pid}-${Date.now().toString(36)}`;
  if (chromeUserDataDir) {
    process.env.SANDBOX_CHROME_PROFILE_PATH = chromeUserDataDir;
  }
  const removeRuntimeDirectory = fs.rmSync.bind(fs);
  const cleanupChromeUserDataDir = () => {
    if (!chromeUserDataDir) return;
    try { removeRuntimeDirectory(chromeUserDataDir, { recursive: true, force: true }); } catch (_) {}
  };

  // Companion files live next to run.js, both in the repo (src/sandbox/)
  // and in the per-run sandbox copy ({sandboxDir}/src/).
  const runHeader = fs.readFileSync(`${__dirname}/run-header.js`, 'utf8');

  const headlessMode = !!quiet;

  const browserConnect = PINOKIO_ENABLED ? `
    const $browser = await (async () => {
      const _qp = { launch: JSON.stringify(launchOptions), stealth: 'true' };
      ${PINOKIO_TOKEN ? `_qp.token = ${JSON.stringify(PINOKIO_TOKEN)};` : ''}
      if (process.env.FLOW_TIMEOUT_MS) { _qp.timeout = process.env.FLOW_TIMEOUT_MS; }
      const queryParams = new URLSearchParams(_qp);
      const browserWSEndpoint = ${JSON.stringify(`${PINOKIO_SECURE ? 'wss' : 'ws'}://${PINOKIO_HOST}:${PINOKIO_PORT}`)} + '?' + queryParams.toString();
      const _maxRetries = 10;
      for (let _attempt = 1; _attempt <= _maxRetries; _attempt++) {
        try {
          const browser = await $puppeteer.connect({
            browserWSEndpoint: browserWSEndpoint
          });
          console.debug('Connected to remote browser' + (_attempt > 1 ? ' (attempt ' + _attempt + ')' : ''));
          return browser;
        } catch (_connErr) {
          if (_attempt < _maxRetries) {
            const _delay = Math.min(1000 * Math.pow(2, _attempt - 1), 15000);
            console.debug('Remote browser connection failed, retrying in ' + (_delay/1000).toFixed(2) + 's (attempt ' + _attempt + '/' + _maxRetries + ')');
            await new Promise(r => setTimeout(r, _delay));
            continue;
          }
          throw new Error('Remote browser connection failed after ' + _maxRetries + ' attempts');
        }
      }
      throw new Error('Remote browser connection failed');
    })();
  ` : `
    // Chromium uses Unix domain sockets under TMPDIR and userDataDir; sun_path is capped at 108
    // bytes on Linux, so deep sandbox run-dir paths silently break launch. Force short locations.
    require('fs').mkdirSync(_chromeUserDataDir, { recursive: true });
    launchOptions.userDataDir = _chromeUserDataDir;
    launchOptions.env = Object.assign({}, process.env, { TMPDIR: '/tmp', TMP: '/tmp', TEMP: '/tmp' });
    const $browser = await $puppeteer.launch(launchOptions);
    console.debug('Connected to Native Browser');
  `;

  const runPayloadPath = process.env.RUN_PAYLOAD_PATH;
  const nodeBody = runPayloadPath
    ? fs.readFileSync(runPayloadPath, 'utf8')
    : fs.readFileSync(`${appDir}/${process.env.FLOW_CLI_FLOWS_DIR || 'src/flows'}/${flowId}/nodeBody.js`, 'utf8');
  delete process.env.RUN_PAYLOAD_PATH;
  delete process.env.RUN_ERROR_PATH;
  delete process.env.FLOW_CLI_FLOWS_DIR;

  let runGuardCode = '';
  try { runGuardCode = fs.readFileSync(`${__dirname}/run-guard.js`, 'utf8'); } catch (_) {}

  let snippetsCode = '';
  const runSnippetsPath = process.env.RUN_SNIPPETS_PATH;
  if (runSnippetsPath) {
    try { snippetsCode = fs.readFileSync(runSnippetsPath, 'utf8'); } catch (_) {}
  }
  delete process.env.RUN_SNIPPETS_PATH;

  let userCodeSyntaxError = null;
  try {
    new Function(snippetsCode + '\n' + nodeBody);
  } catch (e) {
    userCodeSyntaxError = e;
  }

  let browserProxyServer = RUNNER_PROXY_SERVER;
  let runnerProxy = null;
  let runnerProxyCredentials = null;
  if (RUNNER_PROXY_SERVER && RUNNER_PROXY_USERNAME) {
    const proxyChainUrl = pathToFileURL(require.resolve('proxy-chain')).href;
    const { Server: ProxyChainServer } = await import(proxyChainUrl);
    const authenticatedProxyUrl = new URL(RUNNER_PROXY_SERVER);
    authenticatedProxyUrl.username = RUNNER_PROXY_USERNAME;
    authenticatedProxyUrl.password = RUNNER_PROXY_PASSWORD;
    runnerProxyCredentials = {
      username: 'runner',
      password: crypto.randomBytes(24).toString('base64url'),
    };
    runnerProxy = new ProxyChainServer({
      host: '0.0.0.0',
      port: 0,
      prepareRequestFunction: ({ request, username, password }) => {
        const authenticated = username === runnerProxyCredentials.username
          && password === runnerProxyCredentials.password;

        return {
          requestAuthentication: !authenticated,
          upstreamProxyUrl: authenticatedProxyUrl.toString(),
          customResponseFunction: request.url === 'http://proxy-auth.puppetflow.invalid/'
            ? () => ({ statusCode: 200, body: '' })
            : undefined,
        };
      },
    });
    await runnerProxy.listen();
    let proxyHost = '127.0.0.1';
    if (PINOKIO_ENABLED) {
      proxyHost = Object.values(os.networkInterfaces())
        .flat()
        .find(address => address && address.family === 'IPv4' && !address.internal)?.address || os.hostname();
    }
    browserProxyServer = `http://${proxyHost}:${runnerProxy.port}`;
  }
  const closeRunnerProxy = async () => {
    if (!runnerProxy) return;
    try {
      await runnerProxy.close(true);
    } catch (_) {}
    runnerProxy = null;
  };

  const wrappedCode = `
  (async () => {
    const $puppeteer = require('puppeteer');
    const _vpW = parseInt(process.env.VIEWPORT_WIDTH) || 1280;
    const _vpH = parseInt(process.env.VIEWPORT_HEIGHT) || 720;
    const _chromeUserDataDir = ${JSON.stringify(chromeUserDataDir)};
    const _disableWebSecurity = process.env.BROWSER_DISABLE_WEB_SECURITY === 'true';
    const _browserArgs = [
      '--window-size=' + _vpW + ',' + _vpH,
      ${browserProxyServer ? JSON.stringify(`--proxy-server=${browserProxyServer}`) + ',' : ''}
      ${browserProxyServer ? "'--proxy-bypass-list=<-loopback>'," : ''}
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ];
    if (_disableWebSecurity) {
      _browserArgs.push('--disable-web-security');
    }
    const launchOptions = {
      headless: ${headlessMode},
      defaultViewport: { width: _vpW, height: _vpH },
      args: _browserArgs
    };
    ${browserConnect}
    let __runnerProxyCredentials = ${JSON.stringify(runnerProxyCredentials)};
    const _fakeUserAgent = process.env.BROWSER_USER_AGENT
      || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36';
    const __namedPages = new Map();
    const __namedPageCreations = new Map();
    const __namedPageInitializers = [];
    const __maxNamedPages = 64;
    let __activePage = await $browser.newPage();
    if (__runnerProxyCredentials) {
      await __activePage.authenticate(__runnerProxyCredentials);
      await __activePage.goto('http://proxy-auth.puppetflow.invalid/');
      await __activePage.authenticate(null);
      __runnerProxyCredentials = null;
      await __activePage.goto('about:blank');
    }
    let __activeTabName = 'Default';
    let __onActivePageChanged = async () => {};
    let __onNamedPagesChanged = async () => {};
    let __namedPageViewport = { width: _vpW, height: _vpH };
    let __streamOperationQueue = Promise.resolve();
    const __runStreamOperation = operation => {
      const result = __streamOperationQueue
        .catch(() => {})
        .then(operation);
      __streamOperationQueue = result.catch(() => {});
      return result;
    };

    const __getActivePage = () => {
      if (!__activePage || __activePage.isClosed()) {
        throw new Error('The active browser tab is closed.');
      }
      return __activePage;
    };
    const __getActiveTabName = () => __activeTabName;
    const $page = new Proxy({}, {
      get(_target, property) {
        const page = __getActivePage();
        const value = Reflect.get(page, property, page);
        return typeof value === 'function'
          ? (...args) => Reflect.apply(value, __getActivePage(), args)
          : value;
      },
      set(_target, property, value) {
        return Reflect.set(__getActivePage(), property, value, __getActivePage());
      },
      getPrototypeOf() {
        return Reflect.getPrototypeOf(__getActivePage());
      },
    });
    const __registerNamedPage = (tabName, page) => {
      __namedPages.set(tabName, page);
      Promise.resolve(__onNamedPagesChanged()).catch(() => {});
      page.once('close', () => {
        if (__namedPages.get(tabName) === page) __namedPages.delete(tabName);
        if (__activePage !== page) {
          Promise.resolve(__onNamedPagesChanged()).catch(() => {});
          return;
        }
        const fallback = __namedPages.get('Default')
          || Array.from(__namedPages.values()).find(candidate => !candidate.isClosed())
          || null;
        if (fallback) {
          __activePage = fallback;
          __activeTabName = Array.from(__namedPages.entries())
            .find(([, candidate]) => candidate === fallback)?.[0] || 'Default';
        }
        Promise.resolve((async () => {
          if (fallback) await __onActivePageChanged(fallback, __activeTabName);
          await __onNamedPagesChanged();
        })()).catch(() => {});
      });
    };
    const __applyNamedPageViewport = async page => {
      await page.setViewport({ ...__namedPageViewport });
    };
    const __setNamedPageViewport = async (width, height) => {
      __namedPageViewport = { width, height };
      await Promise.all(Array.from(__namedPages.values())
        .filter(page => !page.isClosed())
        .map(page => __applyNamedPageViewport(page)));
    };
    const __prepareNamedPage = async page => {
      try {
        await page.setUserAgent(_fakeUserAgent);
      } catch (_uaErr) {
        console.debug('setUserAgent failed: ' + _uaErr.message);
      }
      await __applyNamedPageViewport(page);
      for (const initializer of __namedPageInitializers) {
        await initializer(page);
      }
      await __applyNamedPageViewport(page);
    };
    const __registerNamedPageInitializer = async initializer => {
      __namedPageInitializers.push(initializer);
      for (const page of __namedPages.values()) {
        if (!page.isClosed()) await initializer(page);
      }
    };
    const __getOrCreateNamedPage = async tabName => {
      const existing = __namedPages.get(tabName);
      if (existing && !existing.isClosed()) return existing;
      if (__namedPageCreations.has(tabName)) return await __namedPageCreations.get(tabName);
      if (__namedPages.size + __namedPageCreations.size >= __maxNamedPages) {
        throw new Error('$gotoUrl: cannot create more than ' + __maxNamedPages + ' browser tabs.');
      }

      const creation = (async () => {
        const page = await $browser.newPage();
        await __prepareNamedPage(page);
        __registerNamedPage(tabName, page);
        return page;
      })();
      __namedPageCreations.set(tabName, creation);
      try {
        return await creation;
      } finally {
        __namedPageCreations.delete(tabName);
      }
    };
    const __activateNamedPageNow = async tabName => {
      const page = __namedPages.get(tabName);
      if (!page || page.isClosed()) {
        throw new Error('$gotoTab: browser tab "' + tabName + '" does not exist or is closed.');
      }
      if (__activePage === page) return page;
      __activePage = page;
      __activeTabName = tabName;
      try { await page.bringToFront(); } catch (_) {}
      await __onActivePageChanged(page, tabName);
      return page;
    };
    const __activateNamedPage = (tabName, streamOperationLocked = false) => (
      streamOperationLocked
        ? __activateNamedPageNow(tabName)
        : __runStreamOperation(() => __activateNamedPageNow(tabName))
    );
    const __activateOrCreateNamedPage = tabName => __runStreamOperation(async () => {
      const page = await __getOrCreateNamedPage(tabName);
      if (__activePage !== page) {
        __activePage = page;
        __activeTabName = tabName;
        try { await page.bringToFront(); } catch (_) {}
        await __onActivePageChanged(page, tabName);
      }
      return page;
    });

    await __prepareNamedPage(__activePage);
    __registerNamedPage('Default', __activePage);

    // ── Video recording (paid feature, module under Puppetflow Proprietary License) ──
    const _recordingEnabled = process.env.RECORDING_ENABLED === 'true'
      || (typeof process.env.RECORDING_ENABLED === 'undefined' && !!process.env.RECORDING_PATH);
    const _recordingPath = _recordingEnabled ? process.env.RECORDING_PATH : null;
    const _recordingCompletionMarkerPath = _recordingPath
      ? process.env.RECORDING_COMPLETION_MARKER_PATH
      : null;
    const _recordingLastshotPath = _recordingPath ? _recordingPath.replace(/[^/]+$/, 'lastshot.jpg') : null;
    let _recorder = null;
    if (_recordingPath) {
      try {
        const { startRecording: _startRecording } = require('${__dirname}/recording.pp.js');
        _recorder = _startRecording({
          recordingPath: _recordingPath,
          completionMarkerPath: _recordingCompletionMarkerPath,
          width: _vpW,
          height: _vpH,
        });
      } catch (_recErr) {
        console.debug('Recording skipped: ' + _recErr.message);
        _recorder = null;
      }
    }

    // ── CDP screencast (streaming + recording) ──
    const _streamUrl = process.env.STREAM_SERVER_URL;
    const _streamRunId = process.env.STREAM_RUN_ID;
    const _streamToken = process.env.STREAM_TOKEN;
    const _streamTokenExpiresAt = process.env.STREAM_TOKEN_EXPIRES_AT;
    const _needScreencast = !!(_recorder && _recorder.active()) || (_streamUrl && _streamRunId);
    let _streamWs = null;
    let _streamClient = null;
    let _lastScreencastFrame = null;
    let _screencastStartedTs = null;
    let _streamReconnectTimer = null;
    let _streamReconnectAttempt = 0;
    let _streamConnectInFlight = false;
    let _streamRunEnded = false;
    let _streamLastErrorLogAt = 0;
    let _streamRebindQueue = Promise.resolve();

    if (_needScreencast) {
      try {
        const _streamMaxBufferedBytes = 2 * 1024 * 1024;
        const _sendStream = (data, binary = false) => {
          const socket = _streamWs;
          if (!socket || socket.readyState !== 1) return false;
          const payloadBytes = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);
          if (socket.bufferedAmount + payloadBytes > _streamMaxBufferedBytes) {
            if (!binary) {
              try { socket.close(1013, 'Producer backpressure'); } catch (_) {}
            }
            return false;
          }
          try {
            socket.send(data, { binary });
            return true;
          } catch (_) {
            return false;
          }
        };
        const _sendTabSnapshot = async () => {
          if (!_streamWs || _streamWs.readyState !== 1) return;
          const tabs = Array.from(__namedPages.entries())
            .filter(([, page]) => !page.isClosed())
            .map(([tabName]) => tabName);
          const activeTabName = tabs.includes(__activeTabName) ? __activeTabName : null;
          // Transient state (active page closed, not yet reactivated): relay and
          // frontend only accept a null activeTabName with an empty tab list, so
          // wait for the next activation to broadcast a consistent snapshot.
          if (tabs.length > 0 && !activeTabName) return;
          _sendStream(JSON.stringify({
            type: 'tabs',
            tabs,
            activeTabName,
          }));
          if (!activeTabName) return;
          try {
            _sendStream(JSON.stringify({
              type: 'url',
              url: __getActivePage().url(),
              tabName: activeTabName,
            }));
          } catch (_) {}
        };
        __onNamedPagesChanged = _sendTabSnapshot;

        if (_streamUrl && _streamRunId && _streamToken && _streamTokenExpiresAt) {
          // Relay input events from frontend
          const _handleStreamMessage = async (raw) => {
            try {
              if (_streamRunEnded) return;
              const msg = JSON.parse(raw.toString());
              if (msg.type !== 'switchTab') {
                await _streamRebindQueue.catch(() => {});
              }
              switch (msg.type) {
                case 'mousemove':
                  await _streamClient.send('Input.dispatchMouseEvent', {
                    type: 'mouseMoved', x: msg.x, y: msg.y,
                    modifiers: msg.modifiers || 0,
                  });
                  break;
                case 'mousedown':
                  await _streamClient.send('Input.dispatchMouseEvent', {
                    type: 'mousePressed', x: msg.x, y: msg.y,
                    button: msg.button || 'left', buttons: msg.buttons || 1,
                    clickCount: msg.clickCount || 1, modifiers: msg.modifiers || 0,
                  });
                  break;
                case 'mouseup':
                  await _streamClient.send('Input.dispatchMouseEvent', {
                    type: 'mouseReleased', x: msg.x, y: msg.y,
                    button: msg.button || 'left', buttons: 0,
                    clickCount: msg.clickCount || 1, modifiers: msg.modifiers || 0,
                  });
                  break;
                case 'wheel':
                  await _streamClient.send('Input.dispatchMouseEvent', {
                    type: 'mouseWheel', x: msg.x, y: msg.y,
                    deltaX: msg.deltaX || 0, deltaY: msg.deltaY || 0,
                    modifiers: msg.modifiers || 0,
                  });
                  break;
                case 'keydown': {
                  await _streamClient.send('Input.dispatchKeyEvent', {
                    type: 'rawKeyDown',
                    key: msg.key, code: msg.code,
                    windowsVirtualKeyCode: msg.keyCode || 0,
                    nativeVirtualKeyCode: msg.keyCode || 0,
                    modifiers: msg.modifiers || 0,
                  });
                  if (msg.text && msg.text.length === 1) {
                    await _streamClient.send('Input.dispatchKeyEvent', {
                      type: 'char', text: msg.text,
                      key: msg.key, code: msg.code,
                      modifiers: msg.modifiers || 0,
                    });
                  }
                  break;
                }
                case 'keyup':
                  await _streamClient.send('Input.dispatchKeyEvent', {
                    type: 'keyUp', key: msg.key, code: msg.code,
                    windowsVirtualKeyCode: msg.keyCode || 0,
                    nativeVirtualKeyCode: msg.keyCode || 0,
                    modifiers: msg.modifiers || 0,
                  });
                  break;
                case 'copy':
                case 'cut': {
                  const _clipboardText = await $page.evaluate((mode) => {
                    const active = document.activeElement;
                    const selection = window.getSelection();
                    const nonTextInputTypes = new Set([
                      'button', 'checkbox', 'color', 'date', 'datetime-local', 'file',
                      'hidden', 'image', 'month', 'radio', 'range', 'reset', 'submit',
                      'number', 'time', 'week',
                    ]);
                    const tagName = active?.tagName?.toLowerCase();
                    const inputType = active?.getAttribute?.('type')?.toLowerCase() || 'text';
                    const isTextInput = active && (
                      tagName === 'textarea' ||
                      (tagName === 'input' && !nonTextInputTypes.has(inputType))
                    );

                    if (isTextInput && typeof active.selectionStart === 'number' && typeof active.selectionEnd === 'number') {
                      const start = active.selectionStart;
                      const end = active.selectionEnd;
                      const text = active.value.slice(start, end);

                      if (mode === 'cut' && text) {
                        active.setRangeText('', start, end, 'start');
                        active.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteByCut' }));
                        active.dispatchEvent(new Event('change', { bubbles: true }));
                      }

                      return text;
                    }

                    const text = selection?.toString() || '';

                    if (mode === 'cut' && text && selection && selection.rangeCount > 0) {
                      const anchorElement = selection.anchorNode?.nodeType === Node.ELEMENT_NODE
                        ? selection.anchorNode
                        : selection.anchorNode?.parentElement;
                      const editableRoot = active?.isContentEditable
                        ? active
                        : anchorElement?.closest?.('[contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]');

                      if (editableRoot) {
                        selection.deleteFromDocument();
                        editableRoot.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteByCut' }));
                      }
                    }

                    return text;
                  }, msg.type);

                  if (typeof _clipboardText === 'string') {
                    // The relay drops messages over 64 KiB; truncate huge copies
                    // so the clipboard payload always fits within its budget.
                    const _clipboardMaxBytes = 63 * 1024;
                    let _clipboardPayloadText = _clipboardText;
                    let _clipboardPayload = JSON.stringify({
                      type: 'clipboard',
                      text: _clipboardPayloadText,
                      action: msg.type,
                    });
                    while (Buffer.byteLength(_clipboardPayload) > _clipboardMaxBytes && _clipboardPayloadText) {
                      const ratio = _clipboardMaxBytes / Buffer.byteLength(_clipboardPayload);
                      _clipboardPayloadText = _clipboardPayloadText.slice(
                        0,
                        Math.floor(_clipboardPayloadText.length * ratio),
                      );
                      _clipboardPayload = JSON.stringify({
                        type: 'clipboard',
                        text: _clipboardPayloadText,
                        action: msg.type,
                      });
                    }
                    _sendStream(_clipboardPayload);
                  }
                  break;
                }
                case 'paste':
                  if (typeof msg.text === 'string' && msg.text.length > 0) {
                    await _streamClient.send('Input.insertText', { text: msg.text });
                  }
                  break;
                case 'navigate':
                  if (msg.url) {
                    await _streamClient.send('Page.navigate', { url: msg.url });
                  }
                  break;
                case 'goBack': {
                  const _histBack = await _streamClient.send('Page.getNavigationHistory');
                  if (_histBack.currentIndex > 0) {
                    await _streamClient.send('Page.navigateToHistoryEntry', {
                      entryId: _histBack.entries[_histBack.currentIndex - 1].id,
                    });
                  }
                  break;
                }
                case 'goForward': {
                  const _histFwd = await _streamClient.send('Page.getNavigationHistory');
                  if (_histFwd.currentIndex < _histFwd.entries.length - 1) {
                    await _streamClient.send('Page.navigateToHistoryEntry', {
                      entryId: _histFwd.entries[_histFwd.currentIndex + 1].id,
                    });
                  }
                  break;
                }
                case 'requestFrame': {
                  await _sendTabSnapshot();
                  _sendStream(JSON.stringify({
                    type: 'status',
                    status: 'streaming',
                  }));
                  try {
                    const _curUrl = await $page.url();
                    if (_curUrl) {
                      _sendStream(JSON.stringify({ type: 'url', url: _curUrl }));
                    }
                  } catch (_) {}
                  const _snap = await _streamClient.send('Page.captureScreenshot', {
                    format: 'jpeg', quality: 60,
                  });
                  const _snapBuf = Buffer.from(_snap.data, 'base64');
                  _lastScreencastFrame = _snapBuf;
                  _sendStream(JSON.stringify({
                    type: 'frame-meta',
                    metadata: { deviceWidth: _vpW, deviceHeight: _vpH },
                    tabName: __activeTabName,
                  }));
                  _sendStream(_snapBuf, true);
                  break;
                }
                case 'switchTab':
                  if (typeof msg.tabName === 'string') {
                    await __activateNamedPage(msg.tabName, true);
                    await _sendTabSnapshot();
                  }
                  break;
              }
            } catch (_) {}
          };

          const _scheduleStreamReconnect = () => {
            if (_streamRunEnded || _streamReconnectTimer
              || Date.now() >= Number(_streamTokenExpiresAt) * 1000) return;
            const baseDelay = Math.min(250 * Math.pow(2, Math.min(_streamReconnectAttempt, 6)), 10000);
            const delay = baseDelay + Math.floor(Math.random() * Math.min(500, baseDelay));
            _streamReconnectAttempt += 1;
            _streamReconnectTimer = setTimeout(() => {
              _streamReconnectTimer = null;
              _connectStream();
            }, delay);
          };

          const _connectStream = async () => {
            if (_streamRunEnded || _streamConnectInFlight
              || Date.now() >= Number(_streamTokenExpiresAt) * 1000) return;
            _streamConnectInFlight = true;
            try {
              const _WS = require('ws');
              const _wsUrl = _streamUrl.replace(/^http/, 'ws')
                + '/puppetflow/' + encodeURIComponent(_streamRunId);
              const _streamProtocol = 'puppetflow-v1.'
                + String(_streamTokenExpiresAt)
                + '.'
                + String(_streamToken);
              const socket = new _WS(_wsUrl, _streamProtocol);
              let failureReason = 'connection timed out';
              const opened = await new Promise((resolve) => {
                let settled = false;
                const settle = (value) => {
                  if (settled) return;
                  settled = true;
                  clearTimeout(timeout);
                  resolve(value);
                };
                const timeout = setTimeout(() => settle(false), 5000);
                socket.once('open', () => settle(true));
                socket.once('error', (error) => {
                  failureReason = error instanceof Error ? error.message : String(error);
                  settle(false);
                });
                socket.once('close', (code, reason) => {
                  failureReason = 'closed with code ' + code
                    + (reason?.length ? ': ' + reason.toString().slice(0, 200) : '');
                  settle(false);
                });
              });
              if (!opened || _streamRunEnded) {
                try { socket.terminate(); } catch (_) {}
                const now = Date.now();
                if (!_streamRunEnded && now - _streamLastErrorLogAt >= 10000) {
                  _streamLastErrorLogAt = now;
                  console.debug('Browser stream producer connection failed, retrying: ' + failureReason);
                }
                _scheduleStreamReconnect();
                return;
              }
              _streamWs = socket;
              _streamReconnectAttempt = 0;
              socket.on('message', (raw) => {
                __runStreamOperation(() => _handleStreamMessage(raw)).catch(() => {});
              });
              socket.on('error', () => {});
              socket.on('close', () => {
                if (_streamWs === socket) {
                  _streamWs = null;
                  _scheduleStreamReconnect();
                }
              });
              await _sendTabSnapshot();
            } catch (error) {
              const now = Date.now();
              if (now - _streamLastErrorLogAt >= 10000) {
                _streamLastErrorLogAt = now;
                const detail = error instanceof Error ? error.message : String(error);
                console.debug('Browser stream producer setup failed, retrying: ' + detail);
              }
              _scheduleStreamReconnect();
            } finally {
              _streamConnectInFlight = false;
            }
          };

          await _connectStream();
        }

        const _attachScreencastToPage = async (page, tabName) => {
          if (_streamRunEnded) return;
          const previousClient = _streamClient;
          _streamClient = null;
          if (previousClient) {
            try { await previousClient.send('Page.stopScreencast'); } catch (_) {}
            try { await previousClient.detach(); } catch (_) {}
          }

          const client = await page.target().createCDPSession();
          if (_streamRunEnded) {
            try { await client.detach(); } catch (_) {}
            return;
          }
          await client.send('Page.enable');
          client.on('Page.screencastFrame', (params) => {
            const _frameBuffer = Buffer.from(params.data, 'base64');
            _lastScreencastFrame = _frameBuffer;
            if (_recorder) _recorder.write(_frameBuffer);
            if (_streamWs && _streamWs.readyState === 1) {
              _sendStream(JSON.stringify({
                type: 'frame-meta',
                metadata: params.metadata,
                sessionId: params.sessionId,
                tabName,
              }));
              _sendStream(_frameBuffer, true);
            }
            client.send('Page.screencastFrameAck', { sessionId: params.sessionId }).catch(() => {});
          });
          if (_streamUrl && _streamRunId && _streamToken && _streamTokenExpiresAt) {
            client.on('Page.frameNavigated', (params) => {
              if (params.frame && !params.frame.parentId && _streamWs && _streamWs.readyState === 1) {
                _sendStream(JSON.stringify({ type: 'url', url: params.frame.url, tabName }));
              }
            });
          }
          const _scQuality = parseInt(process.env.FLOW_RUN_SCREENCAST_QUALITY || '60', 10);
          const _scNthFrame = parseInt(process.env.FLOW_RUN_SCREENCAST_NTH_FRAME || '1', 10);
          await client.send('Page.startScreencast', {
            format: 'jpeg', quality: _scQuality,
            maxWidth: _vpW, maxHeight: _vpH,
            everyNthFrame: _scNthFrame,
          });
          _streamClient = client;
          _screencastStartedTs = Date.now();
          if (_streamWs && _streamWs.readyState === 1) {
            await _sendTabSnapshot();
          }
        };
        await _attachScreencastToPage(__getActivePage(), __activeTabName);
        __onActivePageChanged = (page, tabName) => {
          _streamRebindQueue = _streamRebindQueue
            .catch(() => {})
            .then(async () => {
              if (__getActivePage() !== page) return;
              await _attachScreencastToPage(page, tabName);
            })
            // Streaming is best-effort: a failed screencast rebind must not fail
            // $gotoUrl/$gotoTab. The next tab activation retries the attach.
            .catch((error) => {
              const detail = error instanceof Error ? error.message : String(error);
              console.debug('Screencast rebind failed: ' + detail);
            });
          return _streamRebindQueue;
        };

        console.debug('Screencast started' + (_streamWs ? ' (streaming + recording)' : ' (recording only)'));
      } catch(_e) {
        console.debug('Screencast setup skipped: ' + _e.message);
        _streamRunEnded = true;
        if (_streamReconnectTimer) {
          clearTimeout(_streamReconnectTimer);
          _streamReconnectTimer = null;
        }
        if (_streamWs) {
          try { _streamWs.close(); } catch (_) {}
        }
        _streamWs = null;
        _streamClient = null;
      }
    }

    const _recordingStartTs = _screencastStartedTs || Date.now();

    // Graceful shutdown on SIGTERM: abort browser so pending operations throw,
    // letting the finally block run (recording teardown, output writing).
    process.on('SIGTERM', () => {
      console.debug('SIGTERM received, aborting browser…');
      try { $browser.close().catch(() => {}); } catch (_) {}
    });

    let _result = {};
    let _runError = null;
    let _stopReceived = false;
    let _internalOutput = null;
    const _stripInternalOutputFields = (value) => {
      if (!value || typeof value !== 'object') return value;
      if (Array.isArray(value)) return value.map(_stripInternalOutputFields);
      const _clean = {};
      for (const [_key, _item] of Object.entries(value)) {
        if (_key === '__nodal_preview') {
          _internalOutput = _internalOutput && typeof _internalOutput === 'object' ? _internalOutput : {};
          _internalOutput.nodal_preview = _stripInternalOutputFields(_item);
          continue;
        }
        _clean[_key] = _stripInternalOutputFields(_item);
      }
      return _clean;
    };

    process.on('unhandledRejection', (_reason) => {
      if (_reason && _reason.name === 'StopRun') {
        _result = _reason.response || null;
        _stopReceived = true;
        try { $browser.close().catch(() => {}); } catch (_) {}
      }
    });

    ${runGuardCode}

    ${runHeader}
    for (const _internalEnvKey of [
      'RUN_PAYLOAD_PATH',
      'RUN_ERROR_PATH',
      'RUN_SNIPPETS_PATH',
      'RUN_MAILBOX_CLAIMS_PATH',
      'STREAM_SERVER_URL',
      'STREAM_RUN_ID',
      'STREAM_TOKEN',
      'STREAM_TOKEN_EXPIRES_AT',
      'RUNNER_API_URL',
      'RUNNER_API_TOKEN',
      'HTTP_PROXY',
      'HTTPS_PROXY',
      'NO_PROXY',
      'http_proxy',
      'https_proxy',
      'no_proxy',
      'NODE_PATH',
      'SANDBOX_USER_ROOT',
      'SANDBOX_NODE_MODULES_PATH',
      'SANDBOX_APP_DIR',
      'SANDBOX_CHROME_PROFILE_PATH',
      'PUPPETFLOW_ARTIFACTS_BASE_PATH',
      'PUPPETFLOW_RUN_ARTIFACTS_BASE_PATH',
      'FLOW_OWNER_ID',
      'FLOW_EXECUTION_DIR',
      'FLOW_CLI_FLOWS_DIR',
      'PINOKIO_DOWNLOADING_PATH',
      'PINOKIO_DOWNLOADS_PATH',
      'RECORDING_PATH',
      'RECORDING_COMPLETION_MARKER_PATH',
      'APP_URL',
    ]) {
      delete process.env[_internalEnvKey];
    }
    if (launchOptions.env) {
      for (const _proxyEnvKey of ['HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY', 'http_proxy', 'https_proxy', 'no_proxy']) {
        delete launchOptions.env[_proxyEnvKey];
      }
    }
    let _terminationSignalHandled = false;
    const _handleTerminationSignal = () => {
      if (_terminationSignalHandled) return;
      _terminationSignalHandled = true;
      try { __flushActionLogs(true); } catch (_) {}
      const _forceExitTimer = setTimeout(() => {
        try {
          if (_chromeUserDataDir) fs.rmSync(_chromeUserDataDir, { recursive: true, force: true });
        } catch (_) {}
        process.exit(143);
      }, 5000);
      if (typeof _forceExitTimer.unref === 'function') _forceExitTimer.unref();
      Promise.resolve($browser.close())
        .catch(() => {})
        .finally(() => {
          clearTimeout(_forceExitTimer);
          try {
            if (_chromeUserDataDir) fs.rmSync(_chromeUserDataDir, { recursive: true, force: true });
          } catch (_) {}
          process.exit(143);
        });
    };
    process.once('SIGTERM', _handleTerminationSignal);
    try {
      await (async (
        launchOptions,
        _streamUrl,
        _streamRunId,
        _streamToken,
        _streamTokenExpiresAt,
        _streamWs,
        _streamClient,
        _chromeUserDataDir,
        _recordingPath,
      ) => {
        ${userCodeSyntaxError ? '' : snippetsCode}
        ${userCodeSyntaxError ? '' : nodeBody}

        ${userCodeSyntaxError ? `_runError = new SyntaxError(${JSON.stringify(userCodeSyntaxError.message)});` : ''}

        if (!_runError && typeof run === 'function') {
          console.debug('========================================');
          _result = await run($page, $json);
        }
      })(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined);
    } catch (_e) {
      if (_e && _e.name === 'StopRun') {
        _result = _e.response || $generateResponseError(_e.message);
      } else if (_stopReceived) {
        // run() threw because browser was closed by $stopFail/$stopSuccess in a detached promise
      } else {
        _runError = _e;
      }
    } finally {
      if (typeof terminate === 'function') {
        try {
          const _terminateStatus = _runError
            ? 'error'
            : (_result && typeof _result === 'object' && typeof _result.status === 'string' ? _result.status : 'success');
          if (!_result || typeof _result !== 'object') _result = {};
          Object.assign(_result, _outputData);
          if (typeof _result.status === 'undefined') _result.status = _terminateStatus;
          _result = _stripInternalOutputFields(_result);
          await terminate($page, $json, _result);
          _result = _stripInternalOutputFields(_result);
        } catch (_tErr) {
          if (!_runError && (!_tErr || _tErr.name !== 'StopRun')) _runError = _tErr;
        }
      }

      if (typeof _pendingCleanup !== 'undefined' && Array.isArray(_pendingCleanup)) {
        for (const _cleanPath of _pendingCleanup) {
          try { fs.rmSync(_cleanPath, { recursive: true, force: true }); } catch (_) {}
        }
      }

      try { __flushActionLogs(true); } catch (_) {}
      try { clearInterval(__actionLogsFlushTimer); } catch (_) {}

      // Finalize recording BEFORE building artifacts so we can check the file
      _streamRunEnded = true;
      await __streamOperationQueue.catch(() => {});
      await _streamRebindQueue.catch(() => {});
      if (_recorder && _recorder.active()) {
        _lastScreencastFrame = await _recorder.captureFallback($page, _lastScreencastFrame);
      }
      if (_streamClient) {
        try { await _streamClient.send('Page.stopScreencast'); } catch(_e) {}
        try { await _streamClient.detach(); } catch(_e) {}
      }
      if (_recordingLastshotPath && _lastScreencastFrame) {
        try { fs.writeFileSync(_recordingLastshotPath, _lastScreencastFrame); } catch (_) {}
      }
      if (_streamReconnectTimer) {
        clearTimeout(_streamReconnectTimer);
        _streamReconnectTimer = null;
      }
      if (_streamWs) {
        try {
          const socket = _streamWs;
          if (socket.readyState === 1) {
            await new Promise((resolve) => {
              const timeout = setTimeout(() => {
                try { socket.close(); } catch (_) {}
                resolve();
              }, 250);
              socket.send(JSON.stringify({ type: 'status', status: 'ended' }), () => {
                clearTimeout(timeout);
                try { socket.close(); } catch (_) {}
                resolve();
              });
            });
          } else {
            socket.close();
          }
        } catch(_e) {}
      }
      let _recordingFinalized = false;
      if (_recorder) {
        _recordingFinalized = await _recorder.stop();
      }
      if (!_recordingFinalized && _recordingLastshotPath) {
        try { fs.rmSync(_recordingLastshotPath, { force: true }); } catch (_) {}
      }

      // Build $artifacts
      const _envTrue = (v) => v === '1' || v === 'true';
      const _artifactFlags = {
        screenshots: _envTrue(process.env.EXPORT_ARTIFACTS_SCREENSHOTS),
        downloads: _envTrue(process.env.EXPORT_ARTIFACTS_DOWNLOADS),
        recording: _envTrue(process.env.EXPORT_ARTIFACTS_RECORDING) && _recordingEnabled,
      };
      let _builtArtifacts = null;

      if (_artifactFlags.screenshots || _artifactFlags.downloads || _artifactFlags.recording) {
        const _artifacts = { screenshots: {}, downloads: {}, recording: null };
        const _artifactBase = __flowRunArtifactsBasePath;
        const _artifactUrlBase = $_appUrl + '/flows/' + ($json.$context.flow_id || '') + '/runs/' + ($json.$context.run_id || '') + '/artifacts';
        const _excluded = typeof _artifactExcluded !== 'undefined' ? _artifactExcluded : { screenshots: new Set(), downloads: new Set() };

        function _scanArtifacts(_dir, _prefix, _type) {
          for (const _entry of fs.readdirSync(_dir)) {
            const _full = _dir + '/' + _entry;
            const _rel = _prefix ? _prefix + '/' + _entry : _entry;
            if (fs.statSync(_full).isDirectory()) {
              _scanArtifacts(_full, _rel, _type);
            } else if (!_excluded[_type].has(_rel)) {
              _artifacts[_type][_rel] = _artifactUrlBase + '/' + _type + '/' + _rel.split('/').map(encodeURIComponent).join('/');
            }
          }
        }

        for (const _aType of (process.env.ARTIFACTS_EXPORTABLE_LIST || 'screenshots,downloads,recording').split(',')) {
          if (!_artifactFlags[_aType]) continue;
          if (_aType === 'recording') continue;
          try {
            const _aDir = _artifactBase + '/' + _aType;
            if (fs.existsSync(_aDir)) {
              _scanArtifacts(_aDir, '', _aType);
            }
          } catch (_) {}
        }

        if (_artifactFlags.recording) {
          const _recUrlBase = $_appUrl + '/flows/' + ($json.$context.flow_id || '') + '/runs/' + ($json.$context.run_id || '') + '/recording';
          const _recFileExists = _recordingFinalized
            && _recordingPath
            && _recordingCompletionMarkerPath
            && fs.existsSync(_recordingCompletionMarkerPath)
            && fs.existsSync(_recordingPath)
            && fs.statSync(_recordingPath).size > 1024;
          const _lastshotExists = _recFileExists
            && _recordingLastshotPath
            && fs.existsSync(_recordingLastshotPath)
            && fs.statSync(_recordingLastshotPath).size > 0;
          _artifacts.recording = {
            file: _recFileExists ? _recUrlBase : null,
            player: _recUrlBase + '/player',
            lastshot: _lastshotExists ? _recUrlBase + '/lastshot' : null,
          };
        }

        if (!_artifactFlags.screenshots) delete _artifacts.screenshots;
        if (!_artifactFlags.downloads) delete _artifacts.downloads;
        if (!_artifactFlags.recording || !_artifacts.recording) delete _artifacts.recording;

        if (Object.keys(_artifacts).length > 0) {
          _builtArtifacts = _artifacts;
        }
      }

      if (_runError) {
        const _outputPath = __runOutputPath;
        if (_outputPath) {
          try {
            const _errResult = _stripInternalOutputFields({ status: 'error', message: _runError.message, $context: $json.$context, ..._outputData });
            if (_builtArtifacts) { _errResult.$artifacts = _builtArtifacts; }
            require('fs').writeFileSync(_outputPath, JSON.stringify(_errResult, null, 2));
          } catch (_) {}
        }
      }

      if (!_runError && _result !== undefined) {
        if (typeof _result === 'object' && _result !== null) {
          Object.assign(_result, _outputData);
          _result = _stripInternalOutputFields(_result);
          if (_builtArtifacts) _result.$artifacts = _builtArtifacts;
        }

        const _outputPath = __runOutputPath;
        if (_outputPath) {
          require('fs').writeFileSync(_outputPath, JSON.stringify(_result, null, 2));
        } else {
          console.debug(JSON.stringify(_result));
        }
      }

      if (_internalOutput && typeof _internalOutput === 'object' && Object.keys(_internalOutput).length > 0 && __runInternalOutputPath) {
        try {
          require('fs').writeFileSync(__runInternalOutputPath, JSON.stringify(_internalOutput, null, 2));
        } catch (_) {}
      }

      process.removeListener('SIGTERM', _handleTerminationSignal);
      try { await $browser.close(); } catch (_) {}
      try {
        if (_chromeUserDataDir) fs.rmSync(_chromeUserDataDir, { recursive: true, force: true });
      } catch (_) {}
    }

    if (_runError) throw _runError;
})();
  `;
  const bodyIndex = wrappedCode.indexOf(nodeBody);
  const headerLineCount = bodyIndex >= 0
    ? wrappedCode.substring(0, bodyIndex).split('\n').length - 1
    : 0;

  const evalGlobals = { require, module, exports, __filename, __dirname };
  const previousGlobals = {};
  for (const [name, value] of Object.entries(evalGlobals)) {
    previousGlobals[name] = {
      present: Object.prototype.hasOwnProperty.call(global, name),
      value: global[name],
    };
    global[name] = value;
  }

  try {
    const script = new vm.Script(wrappedCode, { filename: RUN_SCRIPT_FILENAME });
    await script.runInThisContext();
    if (!quiet) {
      console.debug("\n>> END OF FLOW");
    }
    cleanupChromeUserDataDir();
    await closeRunnerProxy();
    process.exit(0);
  } catch (error) {
    if (runErrorPath) {
      const simplified = simplifyError(error, headerLineCount);
      const fullstack = error.stack || String(error);
      try { fs.writeFileSync(runErrorPath, JSON.stringify({ fullstack, simplified })); } catch (_) {}
    } else {
      console.error("Error executing flow:", error);
    }

    cleanupChromeUserDataDir();
    await closeRunnerProxy();
    process.exit(1);
  } finally {
    for (const [name, previous] of Object.entries(previousGlobals)) {
      if (previous.present) {
        global[name] = previous.value;
      } else {
        delete global[name];
      }
    }
  }
};

function simplifyError(error, headerLineCount) {
  const message = error.message || String(error);
  const stack = error.stack || '';

  const userFrames = [];
  const frameRe = new RegExp('(?:<anonymous>|' + RUN_SCRIPT_FILENAME.replace('.', '\\.') + '):(\\d+):(\\d+)');
  for (const line of stack.split('\n')) {
    const match = line.match(frameRe);
    if (!match) continue;

    const fnMatch = line.match(/at\s+(?:async\s+)?(\S+)\s+\(/);
    const fnName = fnMatch ? fnMatch[1] : null;

    const userLine = parseInt(match[1]) - headerLineCount;

    if (userLine >= 1) {
      if (fnName && fnName !== 'eval') {
        userFrames.push(`    at ${fnName} (line ${userLine})`);
      } else {
        userFrames.push(`    at line ${userLine}`);
      }
    } else if (fnName && fnName !== 'eval') {
      userFrames.push(`    at ${fnName}`);
    }
  }

  let simplified = message;
  if (userFrames.length > 0) {
    simplified += '\n' + userFrames.join('\n');
  }
  return simplified;
}