/* @help Cookies
 * @sig $saveCookies(jarName?)
 * @desc Save current page cookies to a JSON file. Default jar name: "cookies".
 * @nodal-param jarName: Name of the cookie jar to save. Use a simple label like "main" or leave empty for "cookies".
 */
const __internalSaveCookies = async function(jarName) {
  const cookies = (await $client.send('Network.getAllCookies')).cookies;
  const cookiePath = __resolveArtifactPath(paths.cookies, (jarName || 'cookies') + '.json', '$saveCookies path');
  fs.writeFileSync(cookiePath, JSON.stringify(cookies, null, 2), { mode: 0o600 });
};
const $saveCookies = async function(jarName) {
  __emitAction('cookies', jarName || 'cookies');
  console.debug('Saving cookies to:', jarName);
  await __internalSaveCookies(jarName);
};

/* @help Cookies
 * @sig $loadCookies(jarName?)
 * @desc Load cookies from a JSON file and set them on the page. Returns false on error, true on success.
 * @nodal-desc Restore previously saved cookies on the current page.
 * @nodal-output boolean
 * @nodal-param jarName: Name of the cookie jar to load. Use the same name used when saving cookies.
 */
const __internalLoadCookies = async function(jarName) {
  try {
    const cookiePath = __resolveArtifactPath(paths.cookies, (jarName || 'cookies') + '.json', '$loadCookies path');
    const cookiesString = await fs.promises.readFile(cookiePath, 'utf8');
    const cookies = JSON.parse(cookiesString);
    await $page.setCookie(...cookies);
  } catch (err) {
    console.error('Cannot load cookies from store:', jarName);
    return false;
  }
  console.debug('Successfully loaded cookies from store:', jarName);
  return true;
};
const $loadCookies = async function(jarName) {
  __emitAction('cookies', jarName || 'cookies');
  console.debug('Loading cookies from store:', jarName);
  const response = await __internalLoadCookies(jarName);
  if (!response) {
    console.error('Cannot load cookies from store:', jarName);
  } else {
    console.debug('Successfully loaded cookies from store:', jarName);
  }
  return response;
};

