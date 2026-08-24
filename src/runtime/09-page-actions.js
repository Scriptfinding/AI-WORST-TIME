/* @help Navigation
 * @sig $screenshot(screenshotName?, options?)
 * @desc Take a screenshot. If no name given, auto-increments (screenshot_00, screenshot_01...).
 * @nodal-desc Capture the current page as a screenshot artifact.
 * @opt output: true - include this screenshot in $artifacts output
 * @nodal-param screenshotName [string]: Screenshot filename or label. Leave empty to auto-generate a name.
 * @nodal-param options [object]: Screenshot options.
 * @nodal-param options.output [boolean]: Include this screenshot in the flow output artifacts.
 */
const $screenshot = async function(screenshotName, options = {}) {
  __emitAction('screenshot', typeof screenshotName === 'string' ? screenshotName : '');
  const defaultOptions = {
    output: true,
  };
  const opts = { ...defaultOptions, ...(options || {}) };
  let shotname = screenshotName;
  if (typeof screenshotName === 'object' && screenshotName !== null && !opts) {
    options = screenshotName;
    shotname = null;
  }
  if (!shotname) {
    shotname = 'screenshot_' + SCREENSHOT_CPT.toString().padStart(2, '0');
    SCREENSHOT_CPT++;
  }
  if (typeof shotname !== 'string') {
    throw new Error('$screenshot: screenshot name must be a string');
  }
  console.debug('Taking screenshot:', shotname);
  const _shotRelativePath = shotname + '.png';
  const _shotPath = __resolveArtifactPath(paths.screenshots, _shotRelativePath, '$screenshot path');
  const _shotDir = path.dirname(_shotPath);
  if (_shotDir !== paths.screenshots) {
    fs.mkdirSync(_shotDir, { recursive: true });
  }
  await __retryOnContextDestroyed(() => $page.screenshot({ path: _shotPath }));
  if (!opts.output) {
    _artifactExcluded.screenshots.add(_shotRelativePath);
  }
};

/* @help Utility
 * @sig $sleep(milliseconds)
 * @desc Async sleep for the given milliseconds.
 * @nodal-desc Pause the flow for a fixed duration.
 * @nodal-param milliseconds [integer]: Time to wait before continuing, in milliseconds.
 */
const __internalSleep = async function(ms) {
  await new Promise(resolve => setTimeout(resolve, ms));
};
const $sleep = async function(milliseconds) {
  __emitAction('sleep', ((milliseconds/1000).toFixed(1)+'s'));
  console.debug('Waiting', ((milliseconds/1000).toFixed(2)+'s') + '...');
  await __internalSleep(milliseconds);
};

/* @help Selectors
 * @sig $selectAtIndex(cssSelector, elementIndex)
 * @desc Get the nth element matching a CSS selector (0-indexed). Returns null if not enough elements.
 * @nodal-desc Pick one matching element by its position on the page.
 * @nodal-output element
 * @nodal-param cssSelector [string, selector]: CSS selector used to find elements on the page.
 * @nodal-param elementIndex [integer]: Zero-based element position to return. Use 0 for the first match.
 */
const $selectAtIndex = async function(cssSelector, elementIndex) {
  const elements = await __internalSelect(cssSelector, {
    continueOnError: true,
    index: -1,
  });
  return elements.length > elementIndex ? elements[elementIndex] : null;
};

/* @help Utility
 * @sig $matchSequence(sourceItems, sequencePatterns)
 * @desc Find the first consecutive sequence in items where each element matches the corresponding regex. With 1 pattern returns the matching string, with N patterns returns an array of N consecutive matches. Returns null if no match.
 * @nodal-desc Find a consecutive sequence of values that matches one or more patterns.
 * @nodal-output unknown
 * @nodal-param sourceItems [array]: Array of strings to search through.
 * @nodal-param sequencePatterns [array]: One or more regex patterns to match in sequence.
 */
const $matchSequence = function(sourceItems, sequencePatterns) {
  if (!sourceItems || !sequencePatterns || sequencePatterns.length === 0) return null;
  const regexes = sequencePatterns.map(p => (p instanceof RegExp) ? p : new RegExp(p));
  const len = regexes.length;
  for (let i = 0; i <= sourceItems.length - len; i++) {
    let ok = true;
    for (let j = 0; j < len; j++) {
      if (!regexes[j].test(sourceItems[i + j])) { ok = false; break; }
    }
    if (ok) {
      return len === 1 ? sourceItems[i] : sourceItems.slice(i, i + len);
    }
  }
  return null;
};

/* @help Utility
 * @sig $log(...messages)
 * @desc Log messages to the run console for output tracing.
 * @nodal-desc Add messages to the run logs.
 * @nodal-param messages: One or more values to write to the run logs.
 */
const $log = function(...messages) {
  __emitAction('log', __formatActionLabel(...messages).slice(0, 500));
  console.log(...messages);
};

/* @help Utility
 * @sig $legend(legendText)
 * @desc Set a legend/caption for this run. Displayed wherever the run appears.
 * @nodal-param legendText [string]: Human-readable caption shown on this run.
 */
const $legend = function(legendText) {
  __emitAction('legend', String(legendText));
  $json.$context.legend = String(legendText);
  console.debug('Legend set: ' + String(legendText));
};

/* @help Utility
 * @sig $meta(metadata)
 * @desc Put meta data to filter runs by. Markdown is supported.
 * @nodal-param metadata [custom-object, required]: Metadata keys to store on the run. Use Form for named metadata, or JSON for an object.
 */
const $meta = function(metadataKey, metadataValue) {
  if (metadataKey && typeof metadataKey === 'object' && !Array.isArray(metadataKey)) {
    __emitAction('meta', Object.entries(metadataKey).map(([k, v]) => k + ': ' + v).join(', '));
    console.debug('Setting meta:', Object.entries(metadataKey).map(([k, v]) => k + ': ' + v).join(', '));
  } else {
    __emitAction('meta', metadataValue !== undefined ? metadataKey + ': ' + metadataValue : String(metadataKey));
    console.debug('Setting meta:', metadataKey, 'with value:', metadataValue);
  }
  if (metadataKey && typeof metadataKey === 'object' && !Array.isArray(metadataKey)) {
    for (const k in metadataKey) {
      if (Object.prototype.hasOwnProperty.call(metadataKey, k)) {
        $json.$context.meta = { ...$json.$context.meta, [k]: metadataKey[k] };
      }
    }
    return;
  }
  $json.$context.meta = { ...$json.$context.meta, [metadataKey]: metadataValue };
};

/* @help Response
 * @sig $setOutput(outputKeyOrObject, outputValue?)
 * @desc Add data to the response output. Pass an object to merge multiple keys, or a key + value pair.
 * @nodal-desc Add one or more values to the final run output.
 * @nodal-param outputKeyOrObject: Output key to set, or an object containing several output keys.
 * @nodal-param outputValue: Value to store when the first input is a single key.
 */
const $setOutput = function(outputKeyOrObject, outputValue) {
  __emitAction('set', outputKeyOrObject && typeof outputKeyOrObject === 'object' && !Array.isArray(outputKeyOrObject) ? Object.keys(outputKeyOrObject).join(', ') : String(outputKeyOrObject));
  if (outputKeyOrObject && typeof outputKeyOrObject === 'object' && !Array.isArray(outputKeyOrObject)) {
    Object.assign(_outputData, outputKeyOrObject);
    return;
  }
  _outputData[outputKeyOrObject] = outputValue;
};

