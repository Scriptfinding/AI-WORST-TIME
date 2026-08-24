/* global __httpRequestAllowPrivate */

const __http = require('http');
const __https = require('https');
const __dns = require('dns');
const __net = require('net');

const __httpRequestDefaults = Object.freeze({
  timeout: 30000,
  maxRedirects: 5,
  maxResponseBytes: 50 * 1024 * 1024,
  maxRequestBytes: 50 * 1024 * 1024,
});

const __httpSafeUrl = function(value) {
  try {
    const url = value instanceof URL ? new URL(value.href) : new URL(String(value));
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';
    return url.href;
  } catch {
    return '[invalid URL]';
  }
};

const __httpBoundedInteger = function(value, fallback, minimum, maximum, label) {
  const number = value === undefined || value === null || value === '' ? fallback : Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) {
    throw new Error('$httpRequest: ' + label + ' must be between ' + minimum + ' and ' + maximum + '.');
  }
  return Math.floor(number);
};

const __httpIsBlockedIpv4 = function(address) {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some(octet => !Number.isInteger(octet) || octet < 0 || octet > 255)) return true;
  const [a, b] = octets;
  return a === 0
    || a === 10
    || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && (b === 0 || b === 168))
    || (a === 198 && (b === 18 || b === 19 || b === 51))
    || (a === 203 && b === 0)
    || a >= 224;
};

const __httpIsBlockedIp = function(address) {
  const normalized = String(address).toLowerCase().split('%')[0];
  const family = __net.isIP(normalized);
  if (family === 4) return __httpIsBlockedIpv4(normalized);
  if (family !== 6) return true;
  if (normalized === '::' || normalized === '::1') return true;
  if (normalized.startsWith('::') || normalized.startsWith('64:ff9b:') || normalized.startsWith('2001:0:') || normalized.startsWith('2002:')) return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb') || normalized.startsWith('ff')) return true;
  if (normalized.startsWith('2001:db8:')) return true;
  const mappedIpv4 = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (mappedIpv4) return __httpIsBlockedIpv4(mappedIpv4);
  const mappedHex = normalized.match(/::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (!mappedHex) return false;
  const high = parseInt(mappedHex[1], 16);
  const low = parseInt(mappedHex[2], 16);
  return __httpIsBlockedIpv4([high >> 8, high & 255, low >> 8, low & 255].join('.'));
};

const __httpResolveTarget = async function(url) {
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!__httpRequestAllowPrivate && (hostname === 'localhost' || hostname.endsWith('.localhost'))) {
    throw new Error('$httpRequest: private network destinations are disabled.');
  }
  const addresses = await __dns.promises.lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length) throw new Error('$httpRequest: the destination hostname did not resolve.');
  if (!__httpRequestAllowPrivate && addresses.some(result => __httpIsBlockedIp(result.address))) {
    throw new Error('$httpRequest: private network destinations are disabled.');
  }
  return addresses[0];
};

const __httpAppendQuery = function(url, query) {
  if (!query || typeof query !== 'object' || Array.isArray(query)) return;
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      url.searchParams.append(key, typeof item === 'object' ? JSON.stringify(item) : String(item));
    }
  }
};

const __httpNormalizeHeaders = function(headers) {
  if (headers === undefined || headers === null) return {};
  if (typeof headers !== 'object' || Array.isArray(headers)) {
    throw new Error('$httpRequest: headers must be an object.');
  }
  const normalized = {};
  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined || value === null) continue;
    normalized[String(name)] = Array.isArray(value) ? value.map(String) : String(value);
  }
  return normalized;
};

const __httpHasHeader = function(headers, name) {
  const expected = name.toLowerCase();
  return Object.keys(headers).some(header => header.toLowerCase() === expected);
};

const __httpDeleteHeader = function(headers, name) {
  const expected = name.toLowerCase();
  for (const header of Object.keys(headers)) {
    if (header.toLowerCase() === expected) delete headers[header];
  }
};

const __httpSetHeader = function(headers, name, value) {
  __httpDeleteHeader(headers, name);
  headers[name] = value;
};

const __httpApplyAuth = function(headers, auth) {
  if (!auth) return;
  if (typeof auth !== 'object' || Array.isArray(auth)) throw new Error('$httpRequest: auth must be an object.');
  const type = String(auth.type || 'none').toLowerCase();
  if (type === 'none') return;
  if (type === 'basic') {
    if (auth.username === undefined || auth.password === undefined) throw new Error('$httpRequest: basic auth requires username and password.');
    __httpSetHeader(headers, 'Authorization', 'Basic ' + Buffer.from(String(auth.username) + ':' + String(auth.password)).toString('base64'));
    return;
  }
  if (type === 'bearer') {
    if (!auth.token) throw new Error('$httpRequest: bearer auth requires a token.');
    __httpSetHeader(headers, 'Authorization', 'Bearer ' + String(auth.token));
    return;
  }
  throw new Error('$httpRequest: auth.type must be none, basic, or bearer.');
};

// File support: const __httpMultipartBody = function(body, files) {
const __httpMultipartBody = function(body) {
  const boundary = '----puppetflow-' + crypto.randomBytes(16).toString('hex');
  const chunks = [];
  const append = value => chunks.push(Buffer.isBuffer(value) ? value : Buffer.from(String(value)));
  for (const [name, value] of Object.entries(body || {})) {
    if (value === undefined || value === null) continue;
    append('--' + boundary + '\r\n');
    append('Content-Disposition: form-data; name="' + String(name).replace(/"/g, '%22') + '"\r\n\r\n');
    append(typeof value === 'object' ? JSON.stringify(value) : String(value));
    append('\r\n');
  }
  /*
  for (const [name, descriptor] of Object.entries(files || {})) {
    const file = typeof descriptor === 'string' ? { path: descriptor } : descriptor;
    if (!file || typeof file !== 'object' || typeof file.path !== 'string') {
      throw new Error('$httpRequest: multipart file "' + name + '" requires a downloads path.');
    }
    const filePath = __resolveArtifactPath(paths.downloads, file.path, '$httpRequest multipart file');
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      throw new Error('$httpRequest: multipart file not found: ' + file.path);
    }
    const filename = String(file.filename || path.basename(filePath)).replace(/"/g, '%22');
    append('--' + boundary + '\r\n');
    append('Content-Disposition: form-data; name="' + String(name).replace(/"/g, '%22') + '"; filename="' + filename + '"\r\n');
    append('Content-Type: ' + String(file.contentType || 'application/octet-stream') + '\r\n\r\n');
    append(fs.readFileSync(filePath));
    append('\r\n');
  }
  */
  append('--' + boundary + '--\r\n');
  return { buffer: Buffer.concat(chunks), contentType: 'multipart/form-data; boundary=' + boundary };
};

const __httpBuildBody = function(options, headers) {
  const body = options.body;
  const bodyType = String(options.bodyType || (body !== undefined && typeof body === 'object' && !Buffer.isBuffer(body) ? 'json' : 'raw')).toLowerCase();
  if (options.files !== undefined) {
    throw new Error('$httpRequest: file uploads are not supported.');
  }
  // File support: if (body === undefined && !options.files) return null;
  if (body === undefined) return null;
  let buffer;
  if (bodyType === 'json') {
    buffer = Buffer.from(JSON.stringify(body ?? {}));
    if (!__httpHasHeader(headers, 'content-type')) __httpSetHeader(headers, 'Content-Type', 'application/json');
  } else if (bodyType === 'form') {
    const form = new globalThis.URLSearchParams();
    for (const [key, value] of Object.entries(body || {})) {
      const values = Array.isArray(value) ? value : [value];
      for (const item of values) if (item !== undefined && item !== null) form.append(key, String(item));
    }
    buffer = Buffer.from(form.toString());
    if (!__httpHasHeader(headers, 'content-type')) __httpSetHeader(headers, 'Content-Type', 'application/x-www-form-urlencoded');
  } else if (bodyType === 'multipart') {
    // File support: const multipart = __httpMultipartBody(body, options.files);
    const multipart = __httpMultipartBody(body);
    buffer = multipart.buffer;
    if (!__httpHasHeader(headers, 'content-type')) __httpSetHeader(headers, 'Content-Type', multipart.contentType);
  } else if (bodyType === 'raw') {
    buffer = Buffer.isBuffer(body) ? body : Buffer.from(body === undefined || body === null ? '' : String(body));
    if (options.contentType && !__httpHasHeader(headers, 'content-type')) __httpSetHeader(headers, 'Content-Type', String(options.contentType));
  } else {
    throw new Error('$httpRequest: bodyType must be json, raw, form, or multipart.');
  }
  const maxRequestBytes = __httpBoundedInteger(options.maxRequestBytes, __httpRequestDefaults.maxRequestBytes, 1, 100 * 1024 * 1024, 'maxRequestBytes');
  if (buffer.length > maxRequestBytes) throw new Error('$httpRequest: request body exceeds maxRequestBytes.');
  __httpSetHeader(headers, 'Content-Length', String(buffer.length));
  return buffer;
};

const __httpBrowserHeaders = async function(url) {
  const cookies = (await $client.send('Network.getCookies', { urls: [url.href] })).cookies || [];
  const cookie = cookies.map(item => item.name + '=' + item.value).join('; ');
  const userAgent = await __retryOnContextDestroyed(() => $page.evaluate(() => navigator.userAgent));
  return { ...(cookie ? { Cookie: cookie } : {}), ...(userAgent ? { 'User-Agent': userAgent } : {}) };
};

const __httpRawRequest = async function(url, method, headers, body, options) {
  const target = await __httpResolveTarget(url);
  const timeout = __httpBoundedInteger(options.timeout, __httpRequestDefaults.timeout, 100, 300000, 'timeout');
  const maxResponseBytes = __httpBoundedInteger(options.maxResponseBytes, __httpRequestDefaults.maxResponseBytes, 1, 100 * 1024 * 1024, 'maxResponseBytes');
  const transport = url.protocol === 'https:' ? __https : __http;
  return new Promise((resolve, reject) => {
    const request = transport.request(url, {
      method,
      headers,
      rejectUnauthorized: options.allowUnauthorizedCerts !== true,
      lookup: (_hostname, _lookupOptions, callback) => callback(null, target.address, target.family),
    }, response => {
      const chunks = [];
      let bytes = 0;
      response.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > maxResponseBytes) {
          request.destroy(new Error('$httpRequest: response exceeds maxResponseBytes.'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => resolve({
        body: Buffer.concat(chunks),
        headers: response.headers,
        statusCode: response.statusCode || 0,
        statusMessage: response.statusMessage || '',
      }));
    });
    request.setTimeout(timeout, () => request.destroy(new Error('$httpRequest: request timed out after ' + timeout + 'ms.')));
    request.on('error', reject);
    if (body && body.length) request.write(body);
    request.end();
  });
};

const __httpShouldRedirect = function(response) {
  return response.statusCode >= 300 && response.statusCode < 400 && typeof response.headers.location === 'string';
};

const __httpSingleRequest = async function(initialUrl, options) {
  let url = new URL(initialUrl.href);
  let method = String(options.method || 'GET').toUpperCase();
  const allowedMethods = new Set(['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT']);
  if (!allowedMethods.has(method)) throw new Error('$httpRequest: unsupported HTTP method ' + method + '.');
  let headers = __httpNormalizeHeaders(options.headers);
  if (options.useBrowserSession === true) headers = { ...(await __httpBrowserHeaders(url)), ...headers };
  __httpApplyAuth(headers, options.auth);
  if (!__httpHasHeader(headers, 'accept')) headers.Accept = '*/*';
  if (!__httpHasHeader(headers, 'accept-encoding')) headers['Accept-Encoding'] = 'identity';
  let body = __httpBuildBody(options, headers);
  const followRedirects = options.followRedirects !== false;
  const maxRedirects = __httpBoundedInteger(options.maxRedirects, __httpRequestDefaults.maxRedirects, 0, 20, 'maxRedirects');
  let redirects = 0;
  while (true) {
    const response = await __httpRawRequest(url, method, headers, body, options);
    if (!followRedirects || !__httpShouldRedirect(response)) return { ...response, url: url.href };
    if (redirects++ >= maxRedirects) throw new Error('$httpRequest: too many redirects.');
    let nextUrl;
    try {
      nextUrl = new URL(response.headers.location, url);
    } catch {
      throw new Error('$httpRequest: received an invalid redirect URL.');
    }
    if (!['http:', 'https:'].includes(nextUrl.protocol)) throw new Error('$httpRequest: redirects must use HTTP or HTTPS.');
    if (nextUrl.origin !== url.origin && options.sendCredentialsOnCrossOriginRedirect !== true) {
      __httpDeleteHeader(headers, 'authorization');
      __httpDeleteHeader(headers, 'cookie');
    }
    if (response.statusCode === 303 || ((response.statusCode === 301 || response.statusCode === 302) && method === 'POST')) {
      method = 'GET';
      body = null;
      __httpDeleteHeader(headers, 'content-length');
      __httpDeleteHeader(headers, 'content-type');
    }
    url = nextUrl;
  }
};

const __httpParseResponse = function(response, options) {
  const contentType = String(response.headers['content-type'] || '').toLowerCase();
  let responseFormat = String(options.responseFormat || 'auto').toLowerCase();
  if (responseFormat === 'auto') {
    if (contentType.includes('json')) responseFormat = 'json';
    else if (contentType.startsWith('text/') || contentType.includes('xml') || contentType.includes('javascript') || contentType.includes('x-www-form-urlencoded')) responseFormat = 'text';
    // else responseFormat = 'file';
    else throw new Error('$httpRequest: binary and file responses are not supported.');
  }
  let parsed;
  if (responseFormat === 'json') {
    try {
      parsed = response.body.length ? JSON.parse(response.body.toString(options.encoding || 'utf8')) : null;
    } catch {
      throw new Error('$httpRequest: response body is not valid JSON.');
    }
  } else if (responseFormat === 'text') {
    parsed = response.body.toString(options.encoding || 'utf8');
  /*
  } else if (responseFormat === 'file') {
    const urlFilename = path.basename(new URL(response.url).pathname);
    const filename = String(options.filename || urlFilename || 'http-response.bin');
    const outputPath = __resolveArtifactPath(paths.downloads, filename, '$httpRequest response file');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, response.body);
    if (options.output === false) _artifactExcluded.downloads.add(path.relative(paths.downloads, outputPath));
    parsed = outputPath;
  */
  } else {
    throw new Error('$httpRequest: responseFormat must be auto, json, or text.');
  }
  if (options.fullResponse === true) {
    return {
      body: parsed,
      headers: response.headers,
      statusCode: response.statusCode,
      statusMessage: response.statusMessage,
      url: response.url,
    };
  }
  return parsed;
};

/* @help Advanced
 * @sig $httpRequest(url, options?)
 * @desc Send an HTTP request with query parameters, headers, authentication, multiple body formats, redirects, retries, and structured responses.
 * @nodal-desc Call an HTTP API and return its response.
 * @nodal-output any
 * @opt method: 'GET', bodyType: 'json', responseFormat: 'auto', timeout: 30000, followRedirects: true, maxRedirects: 5, fullResponse: false, neverError: false, retries: 0, retryDelay: 500, allowUnauthorizedCerts: false, useBrowserSession: false, sendCredentialsOnCrossOriginRedirect: false
 * @nodal-param url [string, required]: HTTP or HTTPS URL to request.
 * @nodal-param options: HTTP request options.
 * @nodal-param options.method: HTTP method.
 * @nodal-param options.query [custom-object]: Query parameters. Array values are repeated.
 * @nodal-param options.headers [custom-object]: Request headers.
 * @nodal-param options.auth [object]: Optional Basic or Bearer authentication.
 * @nodal-param options.auth.type: Authentication type.
 * @nodal-param options.auth.username: Username for Basic authentication.
 * @nodal-param options.auth.password: Password for Basic authentication. Use $vars for secrets.
 * @nodal-param options.auth.token: Token for Bearer authentication. Use $vars for secrets.
 * @nodal-param options.bodyType: Request body format.
 * @nodal-param options.body [custom-object]: Request body. JSON, form, and multipart modes accept an object.
 * File upload support is temporarily disabled:
 * nodal-param options.files [custom-object]: Multipart files keyed by field name. Values are download filenames or descriptors.
 * @nodal-param options.contentType: Content-Type used for a raw body.
 * @nodal-param options.responseFormat: Response format.
 * File response support is temporarily disabled:
 * nodal-param options.filename: Downloads filename used for file responses.
 * @nodal-param options.timeout [number]: Request timeout in milliseconds.
 * @nodal-param options.followRedirects [boolean]: Follow HTTP redirects.
 * @nodal-param options.maxRedirects [number]: Maximum number of redirects.
 * @nodal-param options.fullResponse [boolean]: Return body, headers, status, and final URL.
 * @nodal-param options.neverError [boolean]: Return non-2xx responses instead of throwing.
 * @nodal-param options.retries [number]: Number of retries for transient failures.
 * @nodal-param options.retryDelay [number]: Delay between retries in milliseconds.
 * @nodal-param options.allowUnauthorizedCerts [boolean]: Accept invalid TLS certificates.
 * @nodal-param options.useBrowserSession [boolean]: Include cookies and User-Agent from the current browser page.
 * @nodal-param options.sendCredentialsOnCrossOriginRedirect [boolean]: Keep credentials when a redirect changes origin.
 * nodal-param options.output [boolean]: Include file responses in run artifacts.
 */
const $httpRequest = async function(url, options = {}) {
  if (typeof url !== 'string' || !url.trim()) throw new Error('$httpRequest: url must be a non-empty string.');
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new Error('$httpRequest: options must be an object.');
  let requestUrl;
  try {
    requestUrl = new URL(url);
  } catch {
    throw new Error('$httpRequest: url is invalid.');
  }
  if (!['http:', 'https:'].includes(requestUrl.protocol)) throw new Error('$httpRequest: url must use HTTP or HTTPS.');
  __httpAppendQuery(requestUrl, options.query);
  const method = String(options.method || 'GET').toUpperCase();
  __emitAction('httpRequest', method + ' ' + __httpSafeUrl(requestUrl));
  const retries = __httpBoundedInteger(options.retries, 0, 0, 5, 'retries');
  const retryDelay = __httpBoundedInteger(options.retryDelay, 500, 0, 30000, 'retryDelay');
  const retryStatuses = Array.isArray(options.retryStatusCodes)
    ? new Set(options.retryStatusCodes.map(Number))
    : new Set([408, 425, 429, 500, 502, 503, 504]);
  let lastError;
  let response;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      response = undefined;
      response = await __httpSingleRequest(requestUrl, options);
      if (retryStatuses.has(response.statusCode) && attempt < retries) {
        await __internalSleep(retryDelay * (attempt + 1));
        continue;
      }
      break;
    } catch (error) {
      lastError = error;
      if (attempt >= retries || String(error?.message || '').includes('private network destinations are disabled')) break;
      await __internalSleep(retryDelay * (attempt + 1));
    }
  }
  if (!response) throw lastError;
  if ((response.statusCode < 200 || response.statusCode >= 300) && options.neverError !== true) {
    throw new Error('$httpRequest: HTTP ' + response.statusCode + ' for ' + method + ' ' + __httpSafeUrl(response.url));
  }
  return __httpParseResponse(response, options);
};
