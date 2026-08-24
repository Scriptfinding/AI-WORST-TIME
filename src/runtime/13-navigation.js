const __normalizeBrowserTabName = function(tabName, helperName) {
  if (typeof tabName !== 'string' || !tabName.trim()) {
    throw new Error(helperName + ': tabName must be a non-empty string.');
  }
  const normalized = tabName.trim();
  const hasControlCharacter = Array.from(normalized)
    .some(character => character.charCodeAt(0) <= 31 || character.charCodeAt(0) === 127);
  if (normalized.length > 128 || hasControlCharacter) {
    throw new Error(helperName + ': tabName must be at most 128 characters and cannot contain control characters.');
  }
  return normalized;
};

/* @help Navigation
 * @sig $gotoUrl(url, tabName?, options?)
 * @desc Open a URL in a named browser tab with configurable wait strategy, headers and CSP bypass. Creates the tab when needed and returns the Puppeteer HTTPResponse from page.goto.
 * @nodal-desc Open a URL in a named browser tab and wait for the page to be ready.
 * @nodal-output httpResponse
 * @opt waitUntil: "networkidle0"|"domcontentloaded"|"networkidle2"|"load"|"commit", timeout: flow timeout, headers: {}, bypassCSP: true
 * @nodal-param url [string, required]: Web page URL to open.
 * @nodal-param tabName [tab-name]: Browser tab to create or reuse.
 * @nodal-param options: Navigation options.
 * @nodal-param options.waitUntil [string]: Browser loading state to wait for before continuing.
 * @nodal-param options.headers [custom-object]: Extra HTTP headers to send for this navigation.
 * @nodal-param options.bypassCSP [boolean]: Allow helper scripts to run even when the page has a strict Content Security Policy.
 * @site-url output: url
 */
const $gotoUrl = async function(url, tabName = 'Default', options = {}) {
  const defaultOptions = {};
  if (tabName && typeof tabName === 'object' && !Array.isArray(tabName)) {
    options = tabName;
    tabName = 'Default';
  }
  const opts = { ...defaultOptions, ...(options || {}) };

  if (!url || typeof url !== 'string') {
    throw new Error('$gotoUrl: invalid url (got ' + JSON.stringify(url) + '). Make sure the URL is defined and is a valid string.');
  }
  url = url.trim();
  tabName = __normalizeBrowserTabName(tabName, '$gotoUrl');
  if (!url) {
    throw new Error('$gotoUrl: invalid url (got an empty string). Make sure the URL is defined and is a valid string.');
  }
  if (url.startsWith('//')) {
    url = 'https:' + url;
  } else if (!/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(url)) {
    url = 'https://' + url;
  }

  const page = await __activateOrCreateNamedPage(tabName);
  __emitAction('goto', url);

  const defaultNavigationTimeout = parseInt(process.env.FLOW_NAVIGATION_TIMEOUT_MS || '30000', 10);

  const {
    waitUntil = 'networkidle0',
    timeout = Number.isFinite(defaultNavigationTimeout) && defaultNavigationTimeout > 0 ? defaultNavigationTimeout : 30000,
    headers = {},
    bypassCSP = true,
  } = opts;

  console.debug('Navigating tab "' + tabName + '" to:', url, 'timeout:', timeout);

  if (Object.keys(headers).length) {
    await page.setExtraHTTPHeaders(headers);
  }

  if (url !== 'about:blank' && page.url() !== 'about:blank') {
    await page.goto('about:blank', { waitUntil: 'load', timeout }).catch(() => {});
  }

  const beforeUrl = page.url();
  let response = null;
  try {
    response = await page.goto(url, { waitUntil, timeout });
  } catch (err) {
    const message = err && err.message ? err.message : '';
    const isNavigationTimeout = message.includes('Navigation timeout') && message.includes('exceeded');
    if (!isNavigationTimeout) {
      throw err;
    }

    const currentUrl = page.url();
    const readyState = await page.evaluate(() => document.readyState).catch(() => '');
    const targetUrlWithoutHash = url.split('#')[0].replace(/\/$/, '');
    const currentUrlWithoutHash = currentUrl.split('#')[0].replace(/\/$/, '');
    const reachedTarget = currentUrlWithoutHash === targetUrlWithoutHash || currentUrlWithoutHash !== beforeUrl.replace(/\/$/, '');
    const pageLooksLoaded = readyState === 'interactive' || readyState === 'complete';

    if (!reachedTarget || !pageLooksLoaded) {
      throw err;
    }

    console.debug('$gotoUrl timeout ignored because the page reached ' + currentUrl + ' with readyState=' + readyState);
  }

  if (bypassCSP) {
    await page.setBypassCSP(true);
  }

  await __internalSleep(2000);

  return response;
};

/* @help Navigation
 * @sig $gotoTab(tabName?)
 * @desc Switch to an existing named browser tab. Defaults to Default and throws when the tab does not exist or has been closed.
 * @nodal-desc Switch to an existing named browser tab.
 * @nodal-output page
 * @nodal-param tabName [tab-name]: Existing browser tab to activate. Leave empty to use Default.
 */
const $gotoTab = async function(tabName = 'Default') {
  const normalizedTabName = __normalizeBrowserTabName(tabName, '$gotoTab');
  const page = await __activateNamedPage(normalizedTabName);
  __emitAction('goto-tab', normalizedTabName);
  return page;
};

/* @help Page Eval
 * @sig $injectScriptLibrary(libraryUrl)
 * @desc Load an external JavaScript library into the current page from a URL.
 * @nodal-desc Inject a JavaScript library into the page from its URL.
 * @nodal-output boolean
 * @nodal-param libraryUrl [string, required]: URL of the JavaScript library to inject.
 */
const $injectScriptLibrary = async function(libraryUrl) {
  if (typeof libraryUrl !== 'string' || !libraryUrl.trim()) {
    throw new TypeError('$injectScriptLibrary: libraryUrl must be a non-empty string.');
  }
  const normalizedUrl = libraryUrl.trim();
  __emitAction('evaluate', normalizedUrl);
  console.debug('Injecting script library:', normalizedUrl);
  return __retryOnContextDestroyed(() =>
    $page.evaluate(url => new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to inject script library: ' + url));
      (document.head || document.documentElement).appendChild(script);
    }), normalizedUrl)
  );
};

const __internalBridgeEvaluate = async function(evaluationCode, bridgeValues = {}, bridgeFunctions = {}) {
  const hydratableBridgeFunctions = {};
  const bridgeFunctionNames = Object.keys(bridgeFunctions);
  for (let ef = 0; ef < bridgeFunctionNames.length; ef++) {
    hydratableBridgeFunctions[bridgeFunctionNames[ef]] = bridgeFunctions[bridgeFunctionNames[ef]].toString();
  }
  return await __retryOnContextDestroyed(() => $page.evaluate(async (fnStr, inputData, bridgeValues, hydratableBridgeFunctions) => {
    const bridgeFunctions = {};
    const bridgeFunctionNames = Object.keys(hydratableBridgeFunctions);
    for (let ef = 0; ef < bridgeFunctionNames.length; ef++) {
      bridgeFunctions[bridgeFunctionNames[ef]] = new Function('return ' + hydratableBridgeFunctions[bridgeFunctionNames[ef]])();
    }

    const fn = new Function('$input', 'bridgeValues', 'bridgeFunctions', 'return ('+fnStr+')($input, bridgeValues, bridgeFunctions);');
    const fnResult = fn(inputData, bridgeValues, bridgeFunctions);
    return fnResult && typeof fnResult.then === 'function' ? await fnResult : fnResult;
  }, evaluationCode.toString(), $json, bridgeValues, hydratableBridgeFunctions));
};

/* @help Page Eval
 * @sig $bridgeEvaluate(evaluationCode, bridgeValues?, bridgeFunctions?)
 * @desc Evaluate a function in the page context while bridging flow input, serializable values and functions.
 * @nodal-desc Run page-context logic with access to flow input, bridged values and bridged functions.
 * @nodal-output unknown
 * @nodal-param evaluationCode [function]: JavaScript function to run inside the page. It receives ($input, bridgeValues, bridgeFunctions), which can be destructured as ($input, { valueName }, { functionName }).
 * @nodal-param bridgeValues [custom-object]: Serializable values passed to the page function.
 * @nodal-param bridgeFunctions [function-map]: Named JavaScript functions reconstructed and passed to the page function.
 */
const $bridgeEvaluate = async function(evaluationCode, bridgeValues = {}, bridgeFunctions = {}) {
  __emitAction('evaluate', '');
  console.debug('Executing bridgeEvaluate:', evaluationCode);
  return __internalBridgeEvaluate(evaluationCode, bridgeValues, bridgeFunctions);
};

