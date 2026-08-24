/* @help Navigation
 * @sig $loginRemember(options)
 * @desc Login remember function. Saves cookies to a JSON file and loads them back on the next run.
 * @nodal-desc Reuse saved login cookies, or run the login steps again when the session is expired.
 * @opt loginUrl: null, loginRecipe: null, loggedUrl: null, loggedMarkerCondition: null, loggedMarkerConditionRaw: null, loggedMarkerTimeout: 5000, password: $input.password
 * @nodal-param options: Login settings used when saved cookies are missing or expired.
 * @nodal-param options.loginUrl [string, required]: URL of the login page.
 * @nodal-param options.loginRecipe [flow, required]: Flow used to perform the login.
 * @nodal-param options.loggedUrl [string, required]: URL to visit when checking whether the session is already logged in.
 * @nodal-param options.loggedMarkerCondition [code]: Condition evaluated in the page context that returns true when the logged-in page is detected.
 * @nodal-placeholder options.loggedMarkerCondition: async () => {
 *   const spans = Array.from(document.querySelectorAll('a[href="/logout"]'));
 *   return spans.length > 0;
 * }
 * @nodal-param options.loggedMarkerConditionRaw [boolean]: Condition evaluated directly in the flow context to detect the logged-in page. Use this raw variant when the check needs Puppetflow variables or helpers unavailable in the page context.
 * @nodal-one-of options.loggedMarkerCondition, options.loggedMarkerConditionRaw
 * @nodal-param options.loggedMarkerTimeout [number]: Maximum time to wait for the logged-in marker, in milliseconds.
 * @nodal-param options.password [string]: Password or expression used by the login recipe.
 * @site-url options.loginRecipe: options.loginUrl, options.loggedUrl
 * @site-url output: options.loggedUrl, options.loginUrl
 */
const $loginRemember = async function(options = {}) {
  __emitAction('login', options?.loginUrl || '');
  const defaultOptions = {
    loginUrl: null,
    loginRecipe: null,
    loggedUrl: null,
    loggedMarkerCondition: null,
    loggedMarkerConditionRaw: null,
    loggedMarkerTimeout: 5000,
    gotoOptions: { waitUntil: 'domcontentloaded' }
  };
  const opts = { ...defaultOptions, ...(options || {}) };
  const gotoOpts = { ...defaultOptions.gotoOptions, ...(opts.gotoOptions || {}) };
  if (!opts.loginUrl) {
    throw new Error('Login remember requires a loginUrl');
  }
  if (!opts.loginRecipe) {
    throw new Error('Login remember requires a loginRecipe function');
  }
  if (!opts.loggedMarkerCondition && !opts.loggedMarkerConditionRaw) {
    throw new Error('Login remember requires a loggedMarkerCondition function returning a boolean');
  }
  if (!opts.loggedUrl) {
    opts.loggedUrl = opts.url;
    console.debug('Login remember does not know the loggedUrl, using url as loggedUrl');
  }
  await __internalLoadCookies('_loginRemember');
  await $gotoUrl(opts.loggedUrl, __getActiveTabName(), gotoOpts);
  const $waitForLoggedMarker = async function() {
    try {
      if (opts.loggedMarkerConditionRaw !== null && opts.loggedMarkerConditionRaw !== undefined) {
        console.debug('Waiting for logged marker using loggedMarkerConditionRaw');
        const loggedMarkerValidated = await __retryOnContextDestroyed(async () => {
          if (typeof opts.loggedMarkerConditionRaw === 'function') {
            return await opts.loggedMarkerConditionRaw();
          } else {
            return opts.loggedMarkerConditionRaw;
          }
        });
        if (!loggedMarkerValidated) { throw new Error(); }
      } else {
        console.debug('Waiting for logged marker during', ((opts.loggedMarkerTimeout / 1000).toFixed(0) + 's...'));
        await __retryOnContextDestroyed(() => $page.waitForFunction(
          opts.loggedMarkerCondition,
          { timeout: opts.loggedMarkerTimeout }
        ));
      }
    } catch (error) {
      __emitAction('timeout', 'loggedMarker');
      throw new Error('Logged marker not found');
    }
  };
  const runLoginRecipe = async () => {
    await $gotoUrl(opts.loginUrl, __getActiveTabName(), gotoOpts);
    await opts.loginRecipe();
    await $waitForLoggedMarker();
    await __internalSaveCookies('_loginRemember');
  };
  try {
    await $waitForLoggedMarker();
  } catch (error) {
    await runLoginRecipe();
  }
};

