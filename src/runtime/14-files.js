/* @help Files
 * @sig $createArtifact(artifactName, content, options?)
 * @desc Create an artifact in the run downloads directory.
 * @nodal-desc Create a file and attach it to the run artifacts.
 * @nodal-output string
 * @opt format: text, output: true, overwrite: true, structuredSpacing: 2
 * @nodal-param artifactName [string, required]: Filename or relative path for the artifact.
 * @nodal-param content [string, textarea, required]: Content to write to the artifact.
 * @nodal-param options [object]: Configure the content format, artifact output, replacement, and indentation.
 * @nodal-param options.format [string]: Content format: text, json, yaml, csv, toml, or xml.
 * @nodal-param options.output [boolean]: Include this artifact in the flow output.
 * @nodal-param options.overwrite [boolean]: Replace an existing artifact with the same name.
 * @nodal-param options.structuredSpacing [number]: Number of spaces used to indent structured content, from 0 to 10.
 */
const $createArtifact = async function(artifactName, content, options = {}) {
  if (typeof artifactName !== 'string' || !artifactName.trim()) {
    throw new TypeError('$createArtifact: artifactName must be a non-empty string.');
  }
  if (typeof content === 'undefined') {
    throw new TypeError('$createArtifact: content is required.');
  }

  const opts = { format: 'text', output: true, overwrite: true, structuredSpacing: 2, ...(options || {}) };
  const format = String(opts.format || 'text').trim().toLowerCase();
  if (!['text', 'json', 'yaml', 'csv', 'toml', 'xml'].includes(format)) {
    throw new TypeError('$createArtifact: format must be text, json, yaml, csv, toml, or xml.');
  }
  const structuredSpacing = Math.max(0, Math.min(10, Math.trunc(Number(opts.structuredSpacing) || 0)));
  let structuredContent = content;
  let parsedStringContent = false;
  if (typeof content === 'string' && format !== 'text') {
    try {
      structuredContent = JSON.parse(content);
      parsedStringContent = true;
    } catch (_) {
      if (format === 'json') {
        throw new TypeError('$createArtifact: content must contain valid JSON when format is json.');
      }
    }
  }

  let serializedContent;
  if (format === 'text') {
    if (typeof content === 'string') {
      serializedContent = content;
    } else {
      try {
        serializedContent = JSON.stringify(content, null, structuredSpacing);
      } catch (error) {
        throw new TypeError('$createArtifact: content cannot be serialized. ' + (error && error.message ? error.message : ''));
      }
    }
  } else if (!parsedStringContent && typeof content === 'string') {
    serializedContent = content;
  } else if (format === 'json') {
    try {
      serializedContent = JSON.stringify(structuredContent, null, structuredSpacing);
    } catch (error) {
      throw new TypeError('$createArtifact: content cannot be serialized as JSON. ' + (error && error.message ? error.message : ''));
    }
  } else if (format === 'yaml') {
    const YAML = __requireSandboxModule('yaml');
    serializedContent = YAML.stringify(structuredContent, null, { indent: Math.max(1, structuredSpacing) });
  } else if (format === 'toml') {
    if (!structuredContent || typeof structuredContent !== 'object' || Array.isArray(structuredContent)) {
      throw new TypeError('$createArtifact: TOML content must be an object.');
    }
    const TOML = __requireSandboxModule('@iarna/toml');
    serializedContent = TOML.stringify(structuredContent);
  } else if (format === 'xml') {
    const { XMLBuilder } = __requireSandboxModule('fast-xml-parser');
    let xmlContent;
    if (Array.isArray(structuredContent)) {
      xmlContent = { root: { item: structuredContent } };
    } else if (structuredContent && typeof structuredContent === 'object') {
      xmlContent = Object.keys(structuredContent).length === 1
        ? structuredContent
        : { root: structuredContent };
    } else {
      xmlContent = { root: structuredContent };
    }
    serializedContent = new XMLBuilder({
      format: structuredSpacing > 0,
      indentBy: ' '.repeat(Math.max(1, structuredSpacing)),
      ignoreAttributes: false,
    }).build(xmlContent);
  } else {
    const csvCell = value => {
      const rawValue = value == null
        ? ''
        : typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);
      return /[",\r\n]/.test(rawValue) ? '"' + rawValue.replace(/"/g, '""') + '"' : rawValue;
    };
    let rows;
    if (Array.isArray(structuredContent)) {
      const objectRows = structuredContent.every(value => value && typeof value === 'object' && !Array.isArray(value));
      if (objectRows) {
        const headers = [...new Set(structuredContent.flatMap(value => Object.keys(value)))];
        rows = [headers, ...structuredContent.map(value => headers.map(header => value[header]))];
      } else {
        rows = structuredContent.map(value => Array.isArray(value) ? value : [value]);
      }
    } else if (structuredContent && typeof structuredContent === 'object') {
      rows = [['key', 'value'], ...Object.entries(structuredContent)];
    } else {
      rows = [[structuredContent]];
    }
    serializedContent = rows.map(row => row.map(csvCell).join(',')).join('\n');
  }

  if (typeof serializedContent !== 'string') {
    throw new TypeError('$createArtifact: content could not be serialized.');
  }

  const targetPath = __resolveArtifactPath(paths.downloads, artifactName, '$createArtifact destination');
  const artifactRelativePath = path.relative(paths.downloads, targetPath).split(path.sep).join('/');
  if (!opts.overwrite && fs.existsSync(targetPath)) {
    throw new Error('$createArtifact: artifact already exists: ' + artifactName);
  }

  __emitAction('createArtifact', artifactRelativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, serializedContent, 'utf8');
  if (opts.output) {
    _artifactExcluded.downloads.delete(artifactRelativePath);
  } else {
    _artifactExcluded.downloads.add(artifactRelativePath);
  }
  console.debug('Created artifact:', artifactRelativePath);
  return targetPath;
};

/* @help Files
 * @sig $scanDirectory(directoryPath, filenameContains?)
 * @desc List files in a directory, optionally filtering by name substring. Excludes .crdownload temp files.
 * @nodal-desc List completed files in a folder, optionally filtered by filename.
 * @nodal-output array<string>
 * @nodal-param directoryPath: Directory path to scan.
 * @nodal-param filenameContains: Optional text that filenames must contain.
 */
const $scanDirectory = async function(directoryPath, filenameContains) {
  console.debug('Scanning directory:', directoryPath);
  const files = fs.readdirSync(directoryPath);
  const fileList = files.filter(f => {
    const isFile = fs.statSync(path.join(directoryPath, f)).isFile();
    const isNotCrDownload = !f.endsWith('.crdownload');
    const isLike = filenameContains ? f.normalize('NFC').includes(filenameContains.normalize('NFC')) : true;
    return isFile && isNotCrDownload && isLike;
  }).map(f => path.join(directoryPath, f));

  return fileList;
};

/* @help Files
 * @sig $scanDownloadsDirectory(downloadsSubPath, filenameContains?)
 * @desc List files in a directory, optionally filtering by name substring. Excludes .crdownload temp files.
 * @nodal-desc List completed files in the downloads folder, optionally filtered by filename.
 * @nodal-output array<string>
 * @nodal-param downloadsSubPath: Downloads subfolder to scan.
 * @nodal-param filenameContains: Optional text that filenames must contain.
 */
const $scanDownloadsDirectory = async function(downloadsSubPath, filenameContains) {
  return $scanDirectory($getDownloadsPathFile(downloadsSubPath), filenameContains);
};

/* @help Files
 * @sig $moveDownloadedFile(sourceFilename, destinationPath)
 * @desc Move a file from the downloads directory to a destination path.
 * @nodal-param sourceFilename: Filename currently in the downloads directory.
 * @nodal-param destinationPath: Destination filename or path.
 */
const $moveDownloadedFile = function(sourceFilename, destinationPath) {
  const sourceFile = __resolveArtifactPath(paths.downloads, sourceFilename, '$moveDownloadedFile source');
  const destinationFile = __resolveArtifactPath(paths.downloads, destinationPath, '$moveDownloadedFile destination');
  console.debug('Moving downloaded file:', sourceFile, 'to', destinationFile);
  fs.renameSync(sourceFile, destinationFile);
  return;
};

/* @help Files
 * @sig $waitForFile(destinationFilename?, options?)
 * @desc Wait for a file to appear in the downloading dir, then move it to downloads. Default timeout: 100s.
 * @nodal-desc Wait for a browser download to finish and save it in downloads.
 * @nodal-output boolean
 * @opt output: true - include this download in $artifacts output
 * @nodal-param destinationFilename: Final filename to use after the download completes. Leave empty to keep the detected filename.
 * @nodal-param options: Download wait options.
 * @nodal-param options.output [boolean]: Include this download in the flow output artifacts.
 * @nodal-param options.timeout [number]: Maximum time to wait for the file, in milliseconds.
 */
const $waitForFile = async function(destinationFilename, options = {}) {
  __emitAction('waitFile', destinationFilename || '');
  const defaultOptions = {
    output: true,
    timeout: 100000,
    overrideExtension: false,
    noThrow: false,
  };
  const opts = { ...defaultOptions, ...(options || {}) };
  let remainingWaitSeconds = opts.timeout / 1000;
  console.debug('Waiting for any file download during', remainingWaitSeconds.toFixed(0) + 's...');
  const end = Date.now() + opts.timeout;
  while (Date.now() < end) {
    const files = fs.readdirSync(paths.downloading);
    const fileList = files.filter(f => {
      const isFile = fs.statSync(path.join(paths.downloading, f)).isFile();
      const isNotCrDownload = !f.endsWith('.crdownload');
      return isFile && isNotCrDownload;
    });

    if (fileList.length) {
      const file = fileList[0];
      const ext = path.extname(file);
      const finalName = destinationFilename && destinationFilename.trim() ? destinationFilename + (opts.overrideExtension ? ext : '') : file;
      console.debug('Downloaded file found:', file, 'with extension', ext, 'named', finalName);
      const oldFile = __resolveArtifactPath(paths.downloading, file, '$waitForFile source');
      const newFile = __resolveArtifactPath(paths.downloads, finalName, '$waitForFile destination');
      const _dlDir = path.dirname(newFile);
      if (_dlDir !== paths.downloads) {
        fs.mkdirSync(_dlDir, { recursive: true });
      }
      await __internalSleep(1000);
      fs.renameSync(oldFile, newFile);
      if (!opts.output) {
        _artifactExcluded.downloads.add(finalName);
      }
      return true;
    }
    remainingWaitSeconds = ((end - Date.now())/1000);
    console.debug('Waiting for any file download, remaining timeout: ' + remainingWaitSeconds.toFixed(0) + 's');
    await __internalSleep(1000);
  }
  if (opts.noThrow) return false;
  __emitAction('timeout', destinationFilename || 'file download');
  throw new Error('Timeout while waiting for file download');
};

function $_resolveFilename(url, filename) {
  const rawName = url ? url.split('/').pop().split('?')[0] || '' : '';
  let decodedName = '';
  try {
    decodedName = rawName ? decodeURIComponent(rawName) : '';
  } catch {
    decodedName = rawName;
  }
  const resolvedName = filename || decodedName || 'untitled-' + Math.random().toString(36).substr(2, 6);
  if (typeof resolvedName !== 'string') {
    throw new Error('Download filename must be a string');
  }
  return resolvedName;
}

async function $_nodeDownload(url, targetPath, timeout) {
  const cookies = (await $client.send('Network.getAllCookies')).cookies;
  const cookieHeader = cookies.map(c => c.name + '=' + c.value).join('; ');
  const userAgent = await __retryOnContextDestroyed(() => $page.evaluate(() => navigator.userAgent));

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Download timeout after ' + timeout + 'ms')), timeout);
    function doGet(reqUrl, redirects) {
      if (redirects > 10) { clearTimeout(timer); return reject(new Error('Too many redirects')); }
      const mod = reqUrl.startsWith('https') ? require('https') : require('http');
      mod.get(reqUrl, { headers: { 'Cookie': cookieHeader, 'User-Agent': userAgent, 'Accept': '*/*' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          const loc = res.headers.location;
          return doGet(loc.startsWith('http') ? loc : new URL(loc, reqUrl).href, redirects + 1);
        }
        if (res.statusCode !== 200) { clearTimeout(timer); return reject(new Error('Download failed: HTTP ' + res.statusCode)); }
        const ws = fs.createWriteStream(targetPath);
        res.pipe(ws);
        ws.on('finish', () => { clearTimeout(timer); ws.close(resolve); });
        ws.on('error', (err) => { clearTimeout(timer); reject(err); });
      }).on('error', (err) => { clearTimeout(timer); reject(err); });
    }
    doGet(url, 0);
  });
}

/* @help Files
 * @sig $getDownloadsPathFile(downloadsFile)
 * @desc Get the absolute path to a file in the downloads directory.
 * @nodal-desc Resolve a file stored in downloads so another node can use it.
 * @nodal-output string
 * @nodal-param downloadsFile: Filename or relative path inside the downloads directory.
 */
const $getDownloadsPathFile = function(downloadsFile) {
  return __resolveArtifactPath(__downloadsPath, downloadsFile, '$getDownloadsPathFile path');
};

/* @help Files
 * @sig $download(fileUrl, destinationFilename?, options?)
 * @desc Download a file from a URL using Node.js (works with both local and remote browsers).
 * @nodal-desc Download a file from a URL into the run downloads.
 * @opt output: true - include this download in $artifacts output
 * @nodal-param fileUrl: File URL to download.
 * @nodal-param destinationFilename: Final filename to save in downloads. Leave empty to infer it from the URL.
 * @nodal-param options: Download options.
 * @nodal-param options.output [boolean]: Include this download in the flow output artifacts.
 * @nodal-param options.timeout [number]: Maximum time to wait for the download, in milliseconds.
 */
const $download = async function(fileUrl, destinationFilename, options = {}) {
  __emitAction('download', destinationFilename || fileUrl);
  if (!fileUrl || typeof fileUrl !== 'string') {
    throw new Error('$download: invalid url (got ' + JSON.stringify(fileUrl) + '). Make sure the URL variable is defined.');
  }
  const defaultOptions = {
    output: true,
    timeout: 100000,
  };
  const opts = { ...defaultOptions, ...(options || {}) };
  const definitiveFilename = $_resolveFilename(fileUrl, destinationFilename);
  console.debug('Downloading file:', fileUrl, 'with filename', definitiveFilename, 'and', ((opts.timeout/1000).toFixed(2)+'s') + ' timeout');

  const targetPath = __resolveArtifactPath(paths.downloads, definitiveFilename, '$download destination');
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  await $_nodeDownload(fileUrl, targetPath, opts.timeout);

  console.debug('Downloaded file:', definitiveFilename);
  if (!opts.output) {
    _artifactExcluded.downloads.add(definitiveFilename);
  }
};

/* @help Files
 * @sig $downloadFromBrowser(fileUrl, destinationFilename?, options?)
 * @desc Download via browser click (uses page cookies/session). Falls back to Node.js download if the file never appears locally (remote browser).
 * @nodal-desc Download a file using the active browser session, including its current cookies.
 * @nodal-output string
 * @opt output: true - include this download in $artifacts output
 * @nodal-param fileUrl: File URL to download using the active browser session.
 * @nodal-param destinationFilename: Final filename to save in downloads. Leave empty to infer it from the URL.
 * @nodal-param options: Browser download options.
 * @nodal-param options.output [boolean]: Include this download in the flow output artifacts.
 * @nodal-param options.timeout [number]: Maximum time to wait for the download, in milliseconds.
 */
const $downloadFromBrowser = async function(fileUrl, destinationFilename, options = {}) {
  __emitAction('download', destinationFilename || fileUrl);
  if (!fileUrl || typeof fileUrl !== 'string') {
    throw new Error('$downloadFromBrowser: invalid url (got ' + JSON.stringify(fileUrl) + '). Make sure the URL variable is defined.');
  }
  const defaultOptions = {
    output: true,
    timeout: 100000,
  };
  const opts = { ...defaultOptions, ...(options || {}) };
  const definitiveFilename = $_resolveFilename(fileUrl, destinationFilename);
  console.debug('Browser-downloading file:', fileUrl, 'with filename', definitiveFilename, 'and', ((opts.timeout/1000).toFixed(2)+'s') + ' timeout');
  let downloadTriggeredByNavigation = false;
  try {
    await $gotoUrl(fileUrl, __getActiveTabName(), { waitUntil: 'domcontentloaded' });
  } catch (err) {
    if (!err.message.includes('net::ERR_ABORTED')) {
      throw err;
    }
    downloadTriggeredByNavigation = true;
    console.debug('Navigation triggered download (ERR_ABORTED), skipping anchor click');
  }

  if (!downloadTriggeredByNavigation) {
    try {
      await __retryOnContextDestroyed(() => $page.evaluate((u, fn) => {
        const a = document.createElement('a');
        a.href = u;
        a.download = fn;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, fileUrl, definitiveFilename));
    } catch (err) {
      if (!err.message.includes('net::ERR_ABORTED')) {
        throw err;
      }
    }
  }

  const found = await $waitForFile(definitiveFilename, { ...opts, noThrow: true });

  if (!found) {
    console.debug('No file appeared locally after ' + ((opts.timeout/1000).toFixed(2)+'s') + ' timeout, falling back to Node.js download');
    const targetPath = __resolveArtifactPath(paths.downloads, definitiveFilename, '$downloadFromBrowser destination');
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    await $_nodeDownload(fileUrl, targetPath, opts.timeout);
    console.debug('Fallback downloaded file:', definitiveFilename);
    if (!opts.output) { _artifactExcluded.downloads.add(definitiveFilename); }
  }

  return $getDownloadsPathFile(definitiveFilename);
};

/* @help Interaction
 * @sig $upload(fileInputSelectorOrHandle, uploadFilename, options?)
 * @desc Upload a file from the downloads directory to a file input element. Accepts a CSS selector string or an ElementHandle.
 * @nodal-desc Upload a downloaded file into a file input on the page.
 * @opt timeout: 30000, continueOnError: false, visibleOnly: false, index: 0
 * @nodal-param fileInputSelectorOrHandle [string, selector]: CSS selector or ElementHandle for the file input.
 * @nodal-param uploadFilename: File path or downloads filename to upload.
 * @nodal-param options: File input selection options.
 * @nodal-param options.timeout [number]: Maximum time to wait for the file input, in milliseconds.
 * @nodal-param options.continueOnError [boolean]: Continue the flow if the file input cannot be found.
 * @nodal-param options.visibleOnly [boolean]: Only use elements visible on the page.
 * @nodal-param options.index [number]: Zero-based position to use when several file inputs match.
 */
const $upload = async function(fileInputSelectorOrHandle, uploadFilename, options = {}) {
  if (!uploadFilename || typeof uploadFilename !== 'string') {
    throw new Error('$upload: filename is required (got ' + typeof uploadFilename + ')');
  }
  __emitAction('upload', uploadFilename);
  const filePath = $getDownloadsPathFile(uploadFilename);
  if (!fs.existsSync(filePath)) {
    throw new Error('$upload: file not found: ' + filePath);
  }
  const isHandle = typeof fileInputSelectorOrHandle === 'object' && fileInputSelectorOrHandle !== null;
  const {
    timeout = 30000,
    continueOnError = false,
    visibleOnly = false,
    index = 0,
  } = options || {};
  const selection = await __internalSelect(fileInputSelectorOrHandle, {
    timeout,
    continueOnError,
    visibleOnly,
    index,
  });
  const input = selection?.handle;
  if (!input) {
    return null;
  }
  await __retryOnContextDestroyed(() => input.uploadFile(filePath));
  console.debug('Uploaded', uploadFilename, 'to', isHandle ? '(handle)' : fileInputSelectorOrHandle);
  return true;
};

/* @help Files
 * @sig $unzipFile(zipFilename, extractDirectory, options?)
 * @desc Unzip a file from downloads into a subdirectory. Removes the zip afterwards. Returns list of extracted filenames.
 * @nodal-desc Extract a zip file from downloads into a folder.
 * @nodal-output array<string>
 * @opt store: true - keep extracted files after run (set false to auto-delete)
 * @opt keepArchive: false - keep the zip file after extraction
 * @nodal-param zipFilename: Zip filename in downloads.
 * @nodal-param extractDirectory: Folder name where files should be extracted.
 * @nodal-param options: Extraction options.
 * @nodal-param options.store [boolean]: Keep extracted files after the run.
 * @nodal-param options.keepArchive [boolean]: Keep the zip file after extraction.
 */
const $unzipFile = async function(zipFilename, extractDirectory, options) {
  const opts = { store: true, keepArchive: false, ...(options || {}) };
  console.debug('Unzipping file:', zipFilename, 'to', extractDirectory);
  const zipPathFile = __resolveArtifactPath(paths.downloads, zipFilename, '$unzipFile archive');
  const extractPathFile = __resolveArtifactPath(paths.downloads, extractDirectory, '$unzipFile destination');

  if (fs.existsSync(extractPathFile)) {
    console.debug('Removing existing directory:', extractPathFile);
    fs.rmSync(extractPathFile, { recursive: true, force: true });
  }
  console.debug('Creating directory:', extractPathFile);
  fs.mkdirSync(extractPathFile, { recursive: true });

  console.debug('Unzipping:', zipPathFile, 'to', extractPathFile);

  await new Promise((resolve, reject) => {
    const proc = spawn('unzip', ['-o', zipPathFile, '-d', extractPathFile]);
    proc.on('error', (err) => reject(err));
    proc.on('close', (code) => {
      if (code !== 0) reject(new Error('unzip exited with code ' + code));
      else resolve();
    });
  });

  if (!opts.keepArchive) {
    fs.rmSync(zipPathFile, { recursive: true, force: true });
  }
  console.debug('Unzip complete:', extractPathFile);
  const unzipedFiles = fs.readdirSync(extractPathFile);
  for (const file of unzipedFiles) {
    const filePath = path.join(extractPathFile, file);
    console.debug('File path:', filePath);
  }

  if (!opts.store) {
    _pendingCleanup.push(extractPathFile);
  }

  return unzipedFiles;
};

