/* global __queryPuppetflowLocator, __keyboardSpeedValue:writable, $selectElement */

/* @help Interaction
 * @sig $keyboardSpeed(keyboardSpeedValue)
 * @desc Set the default typing speed for subsequent input actions.
 * @nodal-desc Set the typing speed used by subsequent input nodes.
 * @nodal-output number
 * @nodal-param keyboardSpeedValue [number, required]: Delay in milliseconds between keystrokes and low-level input actions.
 */
const $keyboardSpeed = function(keyboardSpeedValue) {
  const value = Number(keyboardSpeedValue);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Keyboard speed must be a non-negative number');
  }
  __keyboardSpeedValue = value;
  $json.$keyboardSpeed = value;
  console.debug('Keyboard speed set to:', value);
  return value;
};

/* @help Interaction
 * @sig $fillInput(inputSelectorOrHandle, inputValue, options?)
 * @aliases form, field, type
 * @desc Replace, append, or prepend text in an input. Handles detached nodes. Selector can be a CSS string or an ElementHandle.
 * @nodal-desc Find an input on the page, then replace, append, or prepend its value.
 * @opt mode: replace, tabCount: 1, sleep: 500, speed: 100, timeout: 30000, continueOnError: false, visibleOnly: false, index: 0
 * @nodal-param inputSelectorOrHandle [string, selector]: CSS selector or ElementHandle for the input to fill.
 * @nodal-param inputValue: Text value to type into the input.
 * @nodal-param options: Input selection and typing options.
 * @nodal-param options.mode [string]: How to apply the value: replace, append, or prepend.
 * @nodal-param options.tabCount [number]: Number of Tab key presses to send after filling the input.
 * @nodal-param options.sleep [number]: Pause duration between low-level browser actions, in milliseconds.
 * @nodal-param options.speed [number]: Typing speed, in milliseconds between keystrokes.
 * @nodal-param options.timeout [number]: Maximum time to wait for the input, in milliseconds.
 * @nodal-param options.continueOnError [boolean]: Continue the flow if the input cannot be found.
 * @nodal-param options.visibleOnly [boolean]: Only use elements visible on the page.
 * @nodal-param options.index [number]: Zero-based position to use when several inputs match.
 */
const $fillInput = async function(inputSelectorOrHandle, inputValue, options) {
  __emitAction('fill', typeof inputSelectorOrHandle === 'string' ? inputSelectorOrHandle : '(element)');
  const defaultOptions = {
    mode: 'replace',
    tabCount: 1,
    sleep: 500,
    speed: __keyboardSpeedValue,
  };
  const {
    mode,
    tabCount,
    sleep,
    speed,
    timeout = 30000,
    continueOnError = false,
    visibleOnly = false,
    index = 0,
  } = { ...defaultOptions, ...(options || {}) };
  if (!['replace', 'append', 'prepend'].includes(mode)) {
    throw new Error('Input mode must be replace, append, or prepend.');
  }
  const selectOptions = { timeout, continueOnError, visibleOnly, index };
  console.debug('Filling input:', inputSelectorOrHandle);

  const result = await __internalSelect(inputSelectorOrHandle, selectOptions);
  if (!result) return;

  let input = result.handle;
  const prepareInput = async function(handle) {
    await __retryOnContextDestroyed(() => handle.focus());
    if (mode === 'replace') {
      await handle.press('a', { commands: ['selectAll'] });
      await handle.press('Backspace');
      return;
    }
    await __retryOnContextDestroyed(() => handle.evaluate((element, valueMode) => {
      const atStart = valueMode === 'prepend';
      if (typeof element.setSelectionRange === 'function') {
        const position = atStart ? 0 : String(element.value || '').length;
        element.setSelectionRange(position, position);
        return;
      }
      const selection = window.getSelection();
      if (!selection) return;
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(atStart);
      selection.removeAllRanges();
      selection.addRange(range);
    }, mode));
  };
  try {
    await prepareInput(input);
  } catch (err) {
    if (err.message.includes('Node is detached') && typeof inputSelectorOrHandle === 'string') {
      const retry = await __internalSelect(inputSelectorOrHandle, selectOptions);
      if (!retry) return;
      input = retry.handle;
      await prepareInput(input);
    } else {
      throw err;
    }
  }
  await __internalSleep(sleep);
  await input.type(inputValue, { delay: speed });
  if (tabCount) {
    for (let i = 0; i < tabCount; i++) {
      await input.press('Tab');
      await __internalSleep(sleep);
    }
  }
  await __internalSleep(sleep);
};

/* @help Utility
 * @sig $waitForSelectorCondition(cssSelector, readinessCondition, options?)
 * @desc Wait for a selector to match a condition.
 * @opt timeout: 10000
 * @nodal-param cssSelector [string, selector]: CSS selector to watch on the page.
 * @nodal-param readinessCondition [function]: JavaScript function or expression that receives each matched element and returns true when ready.
 * @nodal-param options: Wait options.
 * @nodal-param options.timeout [number]: Maximum time to wait before failing, in milliseconds.
 */
const $waitForSelectorCondition = async function(cssSelector, readinessCondition, options = {}) {
  __emitAction('waitSelector', cssSelector);
  const isDeepSelector = cssSelector.includes('>>>') || cssSelector.includes('>>iframe>>');
  const defaultOptions = {
    timeout: isDeepSelector ? 5000 : 10000,
  };
  const opts = { ...defaultOptions, ...(options || {}) };
  const { timeout } = opts;
  console.debug('Waiting for selector:', cssSelector, 'with condition:', readinessCondition);
  try {
    if (isDeepSelector) {
      const conditionSource = readinessCondition.toString();
      const startedAt = Date.now();
      while (Date.now() - startedAt <= timeout) {
        const candidates = await __retryOnContextDestroyed(() => __queryPuppetflowLocator(cssSelector));
        for (const candidate of candidates) {
          const ready = await candidate.evaluate((element, source) => {
            const condition = (0, eval)('(' + source + ')');
            return Boolean(condition(element));
          }, conditionSource);
          if (ready) return;
        }
        await __internalSleep(100);
      }
      throw new Error('Waiting for selector condition `' + cssSelector + '` failed: timeout ' + timeout + 'ms exceeded');
    }
    await __retryOnContextDestroyed(() => $page.waitForFunction(
      () => [...document.querySelectorAll(cssSelector)].some(selection => readinessCondition(selection)),
      { timeout }
    ));
  } catch (error) {
    __emitAction('timeout', cssSelector);
    console.error('Error waiting for selector:', cssSelector, 'with condition:', readinessCondition);
    throw error;
  }
};

/* @help Selectors
 * @sig $selectShadow(cssSelector, shadowRootSelector?, options?)
 * @desc Traverse open shadow DOM roots to find an element matching selector. Returns ElementHandle or null.
 * @nodal-desc Find an element inside open shadow DOM areas.
 * @nodal-output element
 * @opt timeout: 5000, continueOnError: true, textMatch: null, textFilter: contains, textCaseSensitive: false, visibleOnly: false, index: 0
 * @nodal-param cssSelector [string, selector]: CSS selector to find inside open shadow DOM roots.
 * @nodal-param shadowRootSelector [string]: Optional CSS selector that limits the search to a specific root.
 * @nodal-param options: Element selection options.
 * @nodal-param options.timeout [number]: Maximum time to wait for the element, in milliseconds.
 * @nodal-param options.continueOnError [boolean]: Return null instead of stopping the flow when no element matches.
 * @nodal-param options.textMatch [string]: Text to match against the element's visible text.
 * @nodal-param options.textFilter [string]: Text filter mode: contains, exact, startsWith, or endsWith.
 * @nodal-param options.textCaseSensitive [boolean]: Preserve letter casing when matching text.
 * @nodal-param options.visibleOnly [boolean]: Only use elements visible on the page.
 * @nodal-param options.index [number]: Zero-based position to use when several elements match.
 */
const $selectShadow = async function(cssSelector, shadowRootSelector, options = {}) {
  console.debug('Shadow selecting:', cssSelector, 'with shadowRootSelector:', shadowRootSelector);
  if (cssSelector.includes('>>>') || cssSelector.includes('>>iframe>>')) {
    return $selectElement(cssSelector, options);
  }

  const { timeout = 5000, continueOnError = true, ...selectionOptions } = options || {};
  const startedAt = Date.now();
  let firstAttempt = true;
  while (firstAttempt || Date.now() - startedAt <= timeout) {
    firstAttempt = false;
    const collectionHandle = await __retryOnContextDestroyed(() => $page.evaluateHandle((sel, rootSel) => {
      const matches = [];
      const visitedRoots = new Set();
      const collect = root => {
        if (!root || visitedRoots.has(root)) return;
        visitedRoots.add(root);
        matches.push(...(root.querySelectorAll?.(sel) || []));

        if (root.shadowRoot) collect(root.shadowRoot);
        for (const element of root.querySelectorAll?.('*') || []) {
          if (element.shadowRoot) collect(element.shadowRoot);
        }
      };

      collect(rootSel ? (document.querySelector(rootSel) || document) : document);
      return matches;
    }, cssSelector, shadowRootSelector));
    const properties = await collectionHandle.getProperties();
    const candidates = [];
    for (const property of properties.values()) {
      const element = property.asElement?.();
      if (element) candidates.push(element);
      else await property.dispose();
    }
    await collectionHandle.dispose();

    const result = await __internalSelect(candidates, {
      ...selectionOptions,
      continueOnError: true,
    });
    if (result) return result.handle;
    if (Date.now() - startedAt >= timeout) break;
    await __internalSleep(Math.min(100, Math.max(10, timeout)));
  }

  if (!continueOnError) {
    await __internalSelect([], {
      ...selectionOptions,
      continueOnError: false,
    });
  }
  return null;
};

/* @help Interaction
 * @sig $shadowInputFill(inputSelector, inputValue, options?)
 * @aliases form, field, type
 * @desc Fill an input located inside shadow DOM. Options extend $fillInput options + rootSelector.
 * @nodal-desc Fill an input located inside a shadow DOM area.
 * @opt rootSelector: null, mode: replace, tabCount: 1, sleep: 500, speed: 100, timeout: 5000, continueOnError: false, visibleOnly: false, index: 0
 * @nodal-param inputSelector [string, selector]: CSS selector for the input inside a shadow DOM.
 * @nodal-param inputValue: Text value to type into the input.
 * @nodal-param options: Shadow DOM and typing options.
 * @nodal-param options.rootSelector [string]: Optional CSS selector for the shadow root container.
 * @nodal-param options.mode [string]: How to apply the value: replace, append, or prepend.
 * @nodal-param options.tabCount [number]: Number of Tab key presses to send after filling the input.
 * @nodal-param options.sleep [number]: Pause duration between low-level browser actions, in milliseconds.
 * @nodal-param options.speed [number]: Typing speed, in milliseconds between keystrokes.
 * @nodal-param options.timeout [number]: Maximum time to wait for the input, in milliseconds.
 * @nodal-param options.continueOnError [boolean]: Continue the flow if the input cannot be found.
 * @nodal-param options.visibleOnly [boolean]: Only use elements visible on the page.
 * @nodal-param options.index [number]: Zero-based position to use when several inputs match.
 */
const $shadowInputFill = async function(inputSelector, inputValue, options = {}) {
  __emitAction('fill', inputSelector);
  console.debug('Shadow filling input:', inputSelector);
  const {
    rootSelector,
    mode = 'replace',
    tabCount = 1,
    sleep = 500,
    speed = __keyboardSpeedValue,
    timeout = 5000,
    continueOnError = false,
    visibleOnly = false,
    index = 0,
  } = options || {};
  const input = await $selectShadow(inputSelector, rootSelector, {
    timeout,
    continueOnError,
    visibleOnly,
    index,
  });
  if (!input) {
    return null;
  }
  await $fillInput(input, inputValue, { mode, tabCount, sleep, speed });
  return true;
};

