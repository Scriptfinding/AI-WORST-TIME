const __queryPuppetflowLocator = async function(selector) {
  const parts = selector.split(/\s*(>>>|>>iframe>>)\s*/).filter(Boolean);
  if (parts.length === 1) return $page.$$(selector);

  let scopes = [$page];
  for (let index = 0; index < parts.length; index += 2) {
    const cssSelector = parts[index];
    const boundary = parts[index + 1] || null;
    const matches = [];
    for (const scope of scopes) {
      matches.push(...await scope.$$(cssSelector));
    }
    if (!boundary) return matches;

    const nextScopes = [];
    for (const match of matches) {
      if (boundary === '>>iframe>>') {
        const frame = await match.contentFrame();
        if (frame) nextScopes.push(frame);
        continue;
      }

      const shadowRootHandle = await match.evaluateHandle(element => element.shadowRoot);
      const shadowRoot = shadowRootHandle.asElement();
      if (shadowRoot) nextScopes.push(shadowRoot);
      else await shadowRootHandle.dispose();
    }
    scopes = nextScopes;
    if (scopes.length === 0) return [];
  }
  return [];
};

const __waitForPuppetflowLocator = async function(selector, timeout) {
  const startedAt = Date.now();
  let candidates = [];
  while (Date.now() - startedAt <= timeout) {
    candidates = await __retryOnContextDestroyed(() => __queryPuppetflowLocator(selector));
    if (candidates.length > 0) return candidates;
    await __internalSleep(Math.min(100, Math.max(10, timeout)));
  }
  throw new Error('Waiting for selector `' + selector + '` failed: timeout ' + timeout + 'ms exceeded');
};

const __selectorTextOptions = function(options = {}) {
  const textMatch = options.textMatch ?? null;
  const textFilter = options.textFilter ?? 'contains';
  const supportedOperators = ['contains', 'exact', 'startsWith', 'endsWith'];
  if (!supportedOperators.includes(textFilter)) {
    throw new Error('Unsupported textFilter "' + textFilter + '". Expected contains, exact, startsWith, or endsWith.');
  }
  return {
    textMatch: textMatch == null ? null : String(textMatch).trim(),
    textFilter,
    textCaseSensitive: options.textCaseSensitive === true,
  };
};

const __selectorTextMatches = function(candidate, expected, operator) {
  if (operator === 'exact') return candidate === expected;
  if (operator === 'startsWith') return candidate.startsWith(expected);
  if (operator === 'endsWith') return candidate.endsWith(expected);
  return candidate.includes(expected);
};

const __selectorButtonType = function(value) {
  const buttonType = value ?? 'left';
  if (!['left', 'middle', 'right'].includes(buttonType)) {
    throw new TypeError('buttonType must be "left", "middle", or "right".');
  }
  return buttonType;
};

const __internalSelect = async function(selectorOrHandle, options = {}) {
  const { textMatch, textFilter, textCaseSensitive } = __selectorTextOptions(options);
  const isDeepSelector = typeof selectorOrHandle === 'string'
    && (selectorOrHandle.includes('>>>') || selectorOrHandle.includes('>>iframe>>'));
  const { visibleOnly = false, index = 0, timeout = isDeepSelector ? 5000 : 30000, continueOnError = false, timeoutLabel = null } = options;
  const many = index === -1;

  const __filterCandidates = async function(candidates) {
    if (textMatch) {
      const expected = textCaseSensitive ? textMatch : textMatch.toLocaleLowerCase();
      const filtered = [];
      for (const btn of candidates) {
        const btnText = await __retryOnContextDestroyed(() => btn.evaluate(el => (el.innerText || el.textContent || '').trim()));
        const candidate = textCaseSensitive ? btnText : btnText.toLocaleLowerCase();
        if (__selectorTextMatches(candidate, expected, textFilter)) filtered.push(btn);
      }
      candidates = filtered;
    }

    if (visibleOnly && candidates.length > 0) {
      const visibleCandidates = [];
      for (const el of candidates) {
        if (el && await el.isVisible()) {
          visibleCandidates.push(el);
        }
      }
      candidates = visibleCandidates;
    }

    return candidates;
  };

  const __pickFromCandidates = async function(candidates, label) {
    if (many) return candidates;

    if (candidates.length === 0) {
      if (continueOnError) return null;
      throw new StopRun('No elements ' + label + (textMatch ? ' with text ' + textFilter + ' "' + textMatch + '"' : '') + ' found');
    }

    if (index >= candidates.length) {
      if (continueOnError) return null;
      throw new StopRun('Index out of bounds: ' + index + ' (found ' + candidates.length + ' elements)');
    }

    const handle = candidates[index];
    const visible = handle ? await handle.isVisible() : false;
    if (visibleOnly && !visible) {
      if (continueOnError) return null;
      throw new StopRun('Element at index ' + index + ' is not visible');
    }

    return { handle, visible };
  };

  if (Array.isArray(selectorOrHandle)) {
    const candidates = await __filterCandidates(selectorOrHandle.slice());
    return __pickFromCandidates(candidates, '(handle array)');
  }

  if (typeof selectorOrHandle === 'object' && selectorOrHandle !== null) {
    const visible = await selectorOrHandle.isVisible().catch(() => true);
    return many ? [selectorOrHandle] : { handle: selectorOrHandle, visible };
  }

  const selector = selectorOrHandle;
  let rawCandidates = [];
  try {
    if (isDeepSelector) {
      rawCandidates = await __waitForPuppetflowLocator(selector, timeout);
    } else {
      await __retryOnContextDestroyed(() => $page.waitForSelector(selector, { timeout }));
      const collectionHandle = await __retryOnContextDestroyed(() => $page.evaluateHandle((selectionOptions) => {
        const {
          selector: cssSelector,
          textMatch: expectedText,
          textFilter: filter,
          textCaseSensitive: caseSensitive,
          visibleOnly: requireVisible,
        } = selectionOptions;
        const expected = expectedText
          ? (caseSensitive ? expectedText : expectedText.toLocaleLowerCase())
          : '';
        const textMatches = candidate => {
          if (!expectedText) return true;
          const text = String(candidate.innerText || candidate.textContent || '').trim();
          const value = caseSensitive ? text : text.toLocaleLowerCase();
          if (filter === 'exact') return value === expected;
          if (filter === 'startsWith') return value.startsWith(expected);
          if (filter === 'endsWith') return value.endsWith(expected);
          return value.includes(expected);
        };
        const isVisible = candidate => {
          if (!requireVisible) return true;
          const style = window.getComputedStyle(candidate);
          const rect = candidate.getBoundingClientRect();
          return style.visibility !== 'hidden'
            && style.visibility !== 'collapse'
            && rect.width > 0
            && rect.height > 0;
        };
        return Array.from(document.querySelectorAll(cssSelector))
          .filter(candidate => textMatches(candidate) && isVisible(candidate));
      }, {
        selector,
        textMatch,
        textFilter,
        textCaseSensitive,
        visibleOnly,
      }));
      const properties = await collectionHandle.getProperties();
      for (const property of properties.values()) {
        const element = property.asElement?.();
        if (element) rawCandidates.push(element);
        else await property.dispose();
      }
      await collectionHandle.dispose();
    }
  } catch (_e) {
    __emitAction('timeout', timeoutLabel !== null ? timeoutLabel : selector);
    if (many) return [];
    if (continueOnError) {
      console.debug('Selector not found (continueOnError):', selector);
      return null;
    }
    throw _e;
  }

  const candidates = isDeepSelector
    ? await __filterCandidates(rawCandidates)
    : rawCandidates;
  return __pickFromCandidates(candidates, '{' + selector + '}');
};

/* @help Selectors
 * @sig $selectElement(selectorOrHandle, options?)
 * @desc Get an ElementHandle matching a selector with optional text and visibility filtering. Accepts a CSS selector string or an ElementHandle. Returns ElementHandle or null.
 * @nodal-desc Find one element on the page, with optional text and visibility filters.
 * @nodal-output element
 * @opt textMatch: null, textFilter: contains, textCaseSensitive: false, visibleOnly: false, index: 0, timeout: 30000
 * @nodal-param selectorOrHandle [string, selector]: CSS selector or ElementHandle to search from.
 * @nodal-param options: Selection options.
 * @nodal-param options.textMatch [string]: Text to match against the element's visible text.
 * @nodal-param options.textFilter [string]: Text filter mode: contains, exact, startsWith, or endsWith.
 * @nodal-param options.textCaseSensitive [boolean]: Preserve letter casing when matching text.
 * @nodal-param options.visibleOnly [boolean]: Only use elements visible on the page.
 * @nodal-param options.index [number]: Zero-based position to use when several elements match.
 * @nodal-param options.timeout [number]: Maximum time to wait for the selector, in milliseconds.
 */
const $selectElement = async function(selectorOrHandle, options = {}) {
  const result = await __internalSelect(selectorOrHandle, { continueOnError: true, ...options });
  return result ? result.handle : null;
};

/* @help Selectors
 * @sig $selectManyElements(cssSelector, options?)
 * @desc Get all ElementHandles matching a selector with optional text and visibility filtering. Returns an array of ElementHandle (empty array if none found).
 * @nodal-desc Find all matching elements on the page, with optional text and visibility filters.
 * @nodal-output array<element>
 * @opt textMatch: null, textFilter: contains, textCaseSensitive: false, visibleOnly: false, timeout: 30000
 * @nodal-param cssSelector [string, selector]: CSS selector used to find elements on the page.
 * @nodal-param options: Selection options.
 * @nodal-param options.textMatch [string]: Text to match against the element's visible text.
 * @nodal-param options.textFilter [string]: Text filter mode: contains, exact, startsWith, or endsWith.
 * @nodal-param options.textCaseSensitive [boolean]: Preserve letter casing when matching text.
 * @nodal-param options.visibleOnly [boolean]: Only use elements visible on the page.
 * @nodal-param options.timeout [number]: Maximum time to wait for the selector, in milliseconds.
 */
const $selectManyElements = async function(cssSelector, options = {}) {
  return __internalSelect(cssSelector, { continueOnError: true, ...options, index: -1 });
};

const __validateElementGetters = function(getters) {
  if (!getters || typeof getters !== 'object' || Array.isArray(getters)) {
    throw new TypeError('getters must be an object mapping output keys to getter names.');
  }

  const blockedKeys = new Set(['__proto__', 'prototype', 'constructor']);
  for (const [outputKey, getter] of Object.entries(getters)) {
    if (!outputKey.trim() || blockedKeys.has(outputKey)) {
      throw new TypeError('Getter output keys must be non-empty and safe object keys.');
    }
    if (typeof getter !== 'string' || !getter.trim()) {
      throw new TypeError('Getter "' + outputKey + '" must be a non-empty string.');
    }
  }
  return getters;
};

const __mapElementHandle = async function(handle, getters) {
  if (!handle) return null;
  if (typeof handle.evaluate !== 'function') {
    throw new TypeError('Map Element expects an ElementHandle.');
  }

  return handle.evaluate((element, getterMap) => {
    const result = {};
    const readValue = getter => {
      if (getter.startsWith('attribute:')) {
        const attributeName = getter.slice('attribute:'.length).trim();
        return attributeName ? element.getAttribute(attributeName) : null;
      }

      switch (getter) {
        case 'textContent':
          return (element.textContent || '').trim();
        case 'innerText':
          return typeof element.innerText === 'string' ? element.innerText.trim() : null;
        case 'className':
          return typeof element.className === 'string' ? element.className : element.getAttribute('class');
        case 'id':
          return element.id || null;
        case 'tagName':
          return element.tagName ? element.tagName.toLowerCase() : null;
        case 'value':
          return 'value' in element ? element.value ?? null : null;
        case 'href':
          return 'href' in element ? element.href ?? null : null;
        case 'src':
          return 'src' in element ? element.src ?? null : null;
        case 'innerHTML':
          return typeof element.innerHTML === 'string' ? element.innerHTML : null;
        case 'outerHTML':
          return typeof element.outerHTML === 'string' ? element.outerHTML : null;
        default:
          throw new Error('Unsupported extract getter "' + getter + '".');
      }
    };

    for (const [outputKey, getter] of Object.entries(getterMap)) {
      result[outputKey] = readValue(getter);
    }
    return result;
  }, getters);
};

/* @help Selectors
 * @sig $mapElement(handle, getters)
 * @desc Map an ElementHandle to an object of named, JSON-compatible values.
 * @nodal-desc Build a structured object from one element selected earlier in the flow.
 * @nodal-output object
 * @nodal-param handle [object, required]: ElementHandle returned by Select or Select At Index.
 * @nodal-param getters [getter-map, required]: Output keys mapped to element getters.
 */
const $mapElement = async function(handle, getters) {
  return __mapElementHandle(handle, __validateElementGetters(getters));
};

/* @help Selectors
 * @sig $mapManyElements(handles, getters)
 * @desc Map an array of ElementHandle to objects of named, JSON-compatible values.
 * @nodal-desc Build one structured object per element returned by Select Many.
 * @nodal-output array<object>
 * @nodal-param handles [array, required]: ElementHandle array returned by Select Many.
 * @nodal-param getters [getter-map, required]: Output keys mapped to element getters.
 */
const $mapManyElements = async function(handles, getters) {
  if (handles == null) return [];
  if (!Array.isArray(handles)) {
    throw new TypeError('Map Elements expects an array of ElementHandle.');
  }
  const getterMap = __validateElementGetters(getters);
  return Promise.all(handles.map(handle => __mapElementHandle(handle, getterMap)));
};

/* @help Interaction
 * @sig $clickElement(selectorOrHandle, options?)
 * @desc Click an element after an optional delay (ms). Accepts a CSS selector string or an ElementHandle. Throws StopRun if not found.
 * @nodal-desc Find and click an element after an optional delay.
 * @nodal-output boolean
 * @opt delay: 1000, buttonType: left, timeout: 30000, continueOnError: false, textMatch: null, textFilter: contains, textCaseSensitive: false, visibleOnly: false
 * @nodal-param selectorOrHandle [string, selector]: CSS selector or ElementHandle for the element to click.
 * @nodal-param options: Click and selection options.
 * @nodal-param options.delay [number]: Time to wait before and after clicking, in milliseconds.
 * @nodal-param options.buttonType [string]: Mouse button to use: left, middle, or right.
 * @nodal-param options.timeout [number]: Maximum time to wait for the element, in milliseconds.
 * @nodal-param options.continueOnError [boolean]: Continue the flow if the element cannot be clicked.
 * @nodal-param options.textMatch [string]: Text to match against the element's visible text.
 * @nodal-param options.textFilter [string]: Text filter mode: contains, exact, startsWith, or endsWith.
 * @nodal-param options.textCaseSensitive [boolean]: Preserve letter casing when matching text.
 * @nodal-param options.visibleOnly [boolean]: Only use elements visible on the page.
 */
const $clickElement = async function(selectorOrHandle, options = {}) {
  const isHandle = typeof selectorOrHandle === 'object' && selectorOrHandle !== null;
  const textOptions = __selectorTextOptions(options);
  const buttonType = __selectorButtonType(options.buttonType);
  const textLabel = textOptions.textMatch ? '[text:' + textOptions.textFilter + '="' + textOptions.textMatch + '"]' : '';
  __emitAction('click', (isHandle ? '(handle)' : selectorOrHandle + textLabel) + ' [' + buttonType + ']');
  const { delay = 1000, continueOnError = false, timeout = 30000, visibleOnly = false } = options;
  console.debug('Click on element', isHandle ? '(handle)' : selectorOrHandle, textLabel, 'with', buttonType, 'button after', ((delay/1000).toFixed(2)+'s'));
  await __internalSleep(delay);

  const result = await __internalSelect(selectorOrHandle, { ...textOptions, visibleOnly, index: 0, timeout, continueOnError, timeoutLabel: isHandle ? '(handle)' : selectorOrHandle });
  if (!result) return null;

  const { handle } = result;
  await __retryOnContextDestroyed(() => handle.click({ button: buttonType }));
  await __internalSleep(delay);
  return true;
};

/* @help Interaction
 * @sig $clickElementAtIndex(elementsSelector, elementIndex, options?)
 * @desc Click an element at a specific index after an optional delay (ms). Throws StopRun if not found or index out of bounds.
 * @nodal-desc Click one matching element by its position after an optional delay.
 * @nodal-output boolean
 * @opt delay: 1000, buttonType: left, timeout: 30000, continueOnError: false, textMatch: null, textFilter: contains, textCaseSensitive: false, visibleOnly: false
 * @nodal-param elementsSelector [string, selector]: CSS selector that matches the candidate elements.
 * @nodal-param elementIndex [integer]: Zero-based element position to click.
 * @nodal-param options: Click and selection options.
 * @nodal-param options.delay [number]: Time to wait before and after clicking, in milliseconds.
 * @nodal-param options.buttonType [string]: Mouse button to use: left, middle, or right.
 * @nodal-param options.timeout [number]: Maximum time to wait for the element, in milliseconds.
 * @nodal-param options.continueOnError [boolean]: Continue the flow if the element cannot be clicked.
 * @nodal-param options.textMatch [string]: Text to match against the element's visible text.
 * @nodal-param options.textFilter [string]: Text filter mode: contains, exact, startsWith, or endsWith.
 * @nodal-param options.textCaseSensitive [boolean]: Preserve letter casing when matching text.
 * @nodal-param options.visibleOnly [boolean]: Only use elements visible on the page.
 */
const $clickElementAtIndex = async function(elementsSelector, elementIndex, options = {}) {
  const textOptions = __selectorTextOptions(options);
  const buttonType = __selectorButtonType(options.buttonType);
  const textLabel = textOptions.textMatch ? '[text:' + textOptions.textFilter + '="' + textOptions.textMatch + '"]' : '';
  __emitAction('click', elementsSelector + '[' + elementIndex + ']' + textLabel + ' [' + buttonType + ']');
  const { delay = 1000, continueOnError = false, timeout = 30000, visibleOnly = false } = options;
  console.debug('Click on element', elementsSelector, textLabel, 'at index', elementIndex, 'with', buttonType, 'button after', ((delay/1000).toFixed(2)+'s'));
  await __internalSleep(delay);

  const result = await __internalSelect(elementsSelector, { ...textOptions, visibleOnly, index: elementIndex, timeout, continueOnError, timeoutLabel: elementsSelector + '[' + elementIndex + ']' });
  if (!result) return null;

  const { handle } = result;
  await __retryOnContextDestroyed(() => handle.click({ button: buttonType }));
  await __internalSleep(delay);
  return true;
};

/* @help Interaction
 * @sig $clickAtCoordinates(coordinateX, coordinateY, options?)
 * @desc Click a point on the page using viewport coordinates. Supports left, right, and middle mouse buttons.
 * @nodal-desc Click a point on the page using X and Y viewport coordinates.
 * @opt delay: 1000, buttonType: left
 * @nodal-param coordinateX [number, required]: Horizontal viewport coordinate in pixels.
 * @nodal-param coordinateY [number, required]: Vertical viewport coordinate in pixels.
 * @nodal-param options: Click options.
 * @nodal-param options.delay [number]: Time to wait before and after clicking, in milliseconds.
 * @nodal-param options.buttonType [string]: Mouse button to use: left, middle, or right.
 */
const $clickAtCoordinates = async function(coordinateX, coordinateY, options = {}) {
  if (!Number.isFinite(coordinateX) || !Number.isFinite(coordinateY)) {
    throw new TypeError('$clickAtCoordinates: coordinateX and coordinateY must be finite numbers.');
  }
  if (options == null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('$clickAtCoordinates: options must be an object.');
  }

  const { delay = 1000, buttonType = 'left' } = options;
  const supportedButtons = ['left', 'right', 'middle'];
  if (!supportedButtons.includes(buttonType)) {
    throw new TypeError('$clickAtCoordinates: buttonType must be "left", "right", or "middle".');
  }
  if (!Number.isFinite(delay) || delay < 0) {
    throw new TypeError('$clickAtCoordinates: delay must be a non-negative finite number.');
  }

  __emitAction('click', buttonType + ' (' + coordinateX + ', ' + coordinateY + ')');
  console.debug('Clicking point with', buttonType, 'button:', coordinateX, coordinateY);
  await __internalSleep(delay);
  await __retryOnContextDestroyed(() => $page.mouse.click(coordinateX, coordinateY, { button: buttonType }));
  await __internalSleep(delay);
};

/* @help Interaction
 * @sig $scroll(scrollPixels, selectorOrHandle?)
 * @desc Scroll an element by the given pixel amount (positive = down, negative = up). Defaults to document body. Accepts a CSS selector string or an ElementHandle as second argument.
 * @nodal-desc Scroll the page or a selected element up or down.
 * @nodal-param scrollPixels [number]: Pixels to scroll. Positive scrolls down, negative scrolls up.
 * @nodal-param selectorOrHandle [string, selector]: Optional CSS selector or ElementHandle to scroll. Leave empty to scroll the page.
 */
const $scroll = async function(scrollPixels, selectorOrHandle) {
  __emitAction('scroll', scrollPixels + 'px');
  const isHandle = selectorOrHandle && typeof selectorOrHandle === 'object';
  const isSelector = selectorOrHandle && typeof selectorOrHandle === 'string';

  if (isHandle) {
    await __retryOnContextDestroyed(() => selectorOrHandle.evaluate((el, px) => el.scrollBy(0, px), scrollPixels));
  } else if (isSelector) {
    const selection = await __internalSelect(selectorOrHandle, { timeout: 30000 });
    const el = selection?.handle;
    if (!el) throw new Error('$scroll: no element found for selector: ' + selectorOrHandle);
    await __retryOnContextDestroyed(() => el.evaluate((el, px) => el.scrollBy(0, px), scrollPixels));
  } else {
    await __retryOnContextDestroyed(() => $page.evaluate((px) => window.scrollBy(0, px), scrollPixels));
  }

  console.debug('Scrolled', scrollPixels + 'px', isHandle ? '(handle)' : (isSelector ? selectorOrHandle : 'body'));
};

