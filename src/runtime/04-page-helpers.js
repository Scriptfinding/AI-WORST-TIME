/* global $viewportWidth:writable, $viewportHeight:writable */

const __retryOnContextDestroyed = async function(fn, retries = 2, delayMs = 300) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err && err.message || '';
      const isContextGone = msg.includes('Execution context was destroyed') ||
        msg.includes('Cannot find context with specified id');
      if (isContextGone && attempt < retries) {
        await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
};

/* @help Utility
 * @sig $setViewport(width?, height?)
 * @desc Set the viewport size. Defaults to the flow viewport settings if not provided.
 * @nodal-param width [integer]: Browser viewport width in pixels. Leave empty to use the flow default.
 * @nodal-param height [integer]: Browser viewport height in pixels. Leave empty to use the flow default.
 */
const $setViewport = async function(width, height) {
  const vWidth = width || $viewportWidth;
  const vHeight = height || $viewportHeight;
  console.debug('Setting viewport to:', vWidth, 'x', vHeight);
  await __setNamedPageViewport(vWidth, vHeight);
  $viewportWidth = vWidth;
  $viewportHeight = vHeight;
  $json.$viewportWidth = vWidth;
  $json.$viewportHeight = vHeight;
};
$setViewport();

