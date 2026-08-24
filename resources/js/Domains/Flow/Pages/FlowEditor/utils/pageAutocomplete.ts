export type PageAutocompleteEntry = {
    key: string;
    type: 'method' | 'property';
    detail: string;
    documentation: string;
    children?: PageAutocompleteEntry[];
};

const method = (key: string, detail: string, documentation: string): PageAutocompleteEntry => ({
    key,
    type: 'method',
    detail,
    documentation,
});

const property = (key: string, detail: string, documentation: string, children?: PageAutocompleteEntry[]): PageAutocompleteEntry => ({
    key,
    type: 'property',
    detail,
    documentation,
    children,
});

export const PAGE_AUTOCOMPLETE_ENTRIES: PageAutocompleteEntry[] = [
    property('accessibility', 'Accessibility', 'Inspect the browser accessibility tree.'),
    property('bluetooth', 'BluetoothEmulation', 'Control Bluetooth emulation.'),
    property('coverage', 'Coverage', 'Collect JavaScript and CSS coverage.'),
    property('keyboard', 'Keyboard', 'Virtual keyboard input.', [
        method('down', 'keyboard.down(key)', 'Dispatch a keydown event.'),
        method('press', 'keyboard.press(key)', 'Press a key.'),
        method('sendCharacter', 'keyboard.sendCharacter(char)', 'Send a character.'),
        method('type', 'keyboard.type(text)', 'Type text with the keyboard.'),
        method('up', 'keyboard.up(key)', 'Dispatch a keyup event.'),
    ]),
    property('mouse', 'Mouse', 'Virtual mouse input.', [
        method('click', 'mouse.click(x, y)', 'Click at page coordinates.'),
        method('down', 'mouse.down()', 'Press a mouse button.'),
        method('drag', 'mouse.drag(start, target)', 'Drag between two points.'),
        method('dragAndDrop', 'mouse.dragAndDrop(start, target)', 'Drag and drop between two points.'),
        method('move', 'mouse.move(x, y)', 'Move the mouse.'),
        method('reset', 'mouse.reset()', 'Reset mouse state.'),
        method('up', 'mouse.up()', 'Release a mouse button.'),
        method('wheel', 'mouse.wheel(options)', 'Dispatch a wheel event.'),
    ]),
    property('touchscreen', 'Touchscreen', 'Virtual touchscreen input.', [
        method('tap', 'touchscreen.tap(x, y)', 'Tap at page coordinates.'),
    ]),
    property('tracing', 'Tracing', 'Tracing audit interface.'),
    property('webmcp', 'WebMCP', 'WebMCP interface.'),
    method('$', '$(selector)', 'Find the first element matching a selector.'),
    method('$$', '$$(selector)', 'Find all elements matching a selector.'),
    method('$eval', '$eval(selector, pageFunction)', 'Run a function on the first matching element.'),
    method('$$eval', '$$eval(selector, pageFunction)', 'Run a function on all matching elements.'),
    method('addScriptTag', 'addScriptTag(options)', 'Add a script tag to the page.'),
    method('addStyleTag', 'addStyleTag(options)', 'Add a style tag to the page.'),
    method('authenticate', 'authenticate(credentials)', 'Provide HTTP authentication credentials.'),
    method('bringToFront', 'bringToFront()', 'Bring the page to the front.'),
    method('browser', 'browser()', 'Get the browser this page belongs to.'),
    method('browserContext', 'browserContext()', 'Get the browser context.'),
    method('click', 'click(selector, options)', 'Click an element matching a selector.'),
    method('close', 'close(options)', 'Close the page.'),
    method('content', 'content()', 'Get the full HTML contents of the page.'),
    method('cookies', 'cookies(...urls)', 'Get cookies.'),
    method('createCDPSession', 'createCDPSession()', 'Create a Chrome DevTools Protocol session.'),
    method('deleteCookie', 'deleteCookie(...cookies)', 'Delete cookies.'),
    method('emulate', 'emulate(device)', 'Emulate a device.'),
    method('emulateCPUThrottling', 'emulateCPUThrottling(factor)', 'Emulate CPU throttling.'),
    method('emulateMediaFeatures', 'emulateMediaFeatures(features)', 'Emulate CSS media features.'),
    method('emulateMediaType', 'emulateMediaType(type)', 'Emulate CSS media type.'),
    method('emulateNetworkConditions', 'emulateNetworkConditions(networkConditions)', 'Emulate network conditions.'),
    method('evaluate', 'evaluate(pageFunction, ...args)', 'Run JavaScript in the page.'),
    method('evaluateHandle', 'evaluateHandle(pageFunction, ...args)', 'Run JavaScript and return a handle.'),
    method('exposeFunction', 'exposeFunction(name, pptrFunction)', 'Expose a Node function to the page.'),
    method('focus', 'focus(selector)', 'Focus an element matching a selector.'),
    method('frames', 'frames()', 'Get all frames.'),
    method('goBack', 'goBack(options)', 'Navigate to the previous page in history.'),
    method('goForward', 'goForward(options)', 'Navigate to the next page in history.'),
    method('goto', 'goto(url, options)', 'Navigate the page to a URL.'),
    method('hover', 'hover(selector)', 'Hover over an element matching a selector.'),
    method('isClosed', 'isClosed()', 'Check whether the page is closed.'),
    method('locator', 'locator(selector)', 'Create a locator for a selector.'),
    method('mainFrame', 'mainFrame()', 'Get the main frame.'),
    method('metrics', 'metrics()', 'Get runtime metrics.'),
    method('pdf', 'pdf(options)', 'Generate a PDF.'),
    method('queryObjects', 'queryObjects(prototypeHandle)', 'Find objects with the given prototype.'),
    method('reload', 'reload(options)', 'Reload the page.'),
    method('screenshot', 'screenshot(options)', 'Capture a page screenshot.'),
    method('select', 'select(selector, ...values)', 'Select options in a select element.'),
    method('setBypassCSP', 'setBypassCSP(enabled)', 'Bypass page Content Security Policy.'),
    method('setCacheEnabled', 'setCacheEnabled(enabled)', 'Toggle cache usage.'),
    method('setContent', 'setContent(html, options)', 'Set page HTML content.'),
    method('setCookie', 'setCookie(...cookies)', 'Set cookies.'),
    method('setDefaultNavigationTimeout', 'setDefaultNavigationTimeout(timeout)', 'Set default navigation timeout.'),
    method('setDefaultTimeout', 'setDefaultTimeout(timeout)', 'Set default timeout.'),
    method('setExtraHTTPHeaders', 'setExtraHTTPHeaders(headers)', 'Set extra HTTP headers.'),
    method('setGeolocation', 'setGeolocation(options)', 'Set geolocation.'),
    method('setJavaScriptEnabled', 'setJavaScriptEnabled(enabled)', 'Enable or disable JavaScript.'),
    method('setRequestInterception', 'setRequestInterception(value)', 'Enable or disable request interception.'),
    method('setUserAgent', 'setUserAgent(userAgent)', 'Set the user agent.'),
    method('setViewport', 'setViewport(viewport)', 'Set the viewport.'),
    method('tap', 'tap(selector)', 'Tap an element matching a selector.'),
    method('target', 'target()', 'Get the target this page was created from.'),
    method('title', 'title()', 'Get the page title.'),
    method('type', 'type(selector, text, options)', 'Type text into an element.'),
    method('url', 'url()', 'Get the page URL.'),
    method('viewport', 'viewport()', 'Get the current viewport.'),
    method('waitForDevicePrompt', 'waitForDevicePrompt(options)', 'Wait for a device prompt.'),
    method('waitForFileChooser', 'waitForFileChooser(options)', 'Wait for a file chooser.'),
    method('waitForFrame', 'waitForFrame(urlOrPredicate, options)', 'Wait for a frame.'),
    method('waitForFunction', 'waitForFunction(pageFunction, options, ...args)', 'Wait for a function to return a truthy value.'),
    method('waitForNavigation', 'waitForNavigation(options)', 'Wait for navigation.'),
    method('waitForNetworkIdle', 'waitForNetworkIdle(options)', 'Wait until the network is idle.'),
    method('waitForRequest', 'waitForRequest(urlOrPredicate, options)', 'Wait for a request.'),
    method('waitForResponse', 'waitForResponse(urlOrPredicate, options)', 'Wait for a response.'),
    method('waitForSelector', 'waitForSelector(selector, options)', 'Wait for an element matching a selector.'),
    method('waitForXPath', 'waitForXPath(xpath, options)', 'Wait for an XPath selector.'),
];

const createPlaceholderMethod = (path: string) => () => `[Needs run: ${path}()]`;

const materializeEntry = (entry: PageAutocompleteEntry, path = '$page'): unknown => {
    const nextPath = `${path}.${entry.key}`;
    if (entry.type === 'method') return createPlaceholderMethod(nextPath);

    return Object.fromEntries(
        (entry.children ?? []).map(child => [child.key, materializeEntry(child, nextPath)]),
    );
};

export const createPagePreviewData = (): Record<string, unknown> => {
    return Object.fromEntries(PAGE_AUTOCOMPLETE_ENTRIES.map(entry => [entry.key, materializeEntry(entry)]));
};
