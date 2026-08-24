// ================================
// PDF FUNCTIONS
// ================================

/* @help Files
 * @sig $pdfSearch(pdfFilePath, searchText)
 * @desc Search for a text occurrence in a PDF file. Returns an object with { found, count, pages } where pages lists page numbers containing the match.
 * @nodal-desc Search text inside a PDF and report where it appears.
 * @nodal-output object found:boolean, count:number, pages:array<number>, totalPages:number
 * @nodal-param pdfFilePath: PDF filename or absolute path.
 * @nodal-param searchText: Text to search inside the PDF.
 */
const $pdfSearch = async function(pdfFilePath, searchText) {
  __emitAction('pdfSearch', pdfFilePath);
  if (!pdfFilePath || typeof pdfFilePath !== 'string') {
    throw new Error('$pdfSearch: invalid filepath (got ' + JSON.stringify(pdfFilePath) + ')');
  }
  if (!searchText || typeof searchText !== 'string') {
    throw new Error('$pdfSearch: invalid occurrence (got ' + JSON.stringify(searchText) + ')');
  }
  const pdfParse = __requireSandboxModule('pdf-parse');
  const absolutePath = $getDownloadsPathFile(pdfFilePath);
  const dataBuffer = fs.readFileSync(absolutePath);
  const _origWarn = console.warn;
  console.warn = () => {};
  const data = await pdfParse(dataBuffer);
  console.warn = _origWarn;

  const lowerOccurrence = searchText.toLowerCase();
  const fullText = data.text || '';
  const fullLower = fullText.toLowerCase();

  // Count occurrences in full text
  let count = 0;
  let idx = 0;
  while ((idx = fullLower.indexOf(lowerOccurrence, idx)) !== -1) {
    count++;
    idx += lowerOccurrence.length;
  }

  // Find which pages contain the occurrence (pdf-parse splits pages with \f)
  const pages = [];
  const pageTexts = fullText.split('\f');
  pageTexts.forEach((pageText, i) => {
    if (pageText.toLowerCase().includes(lowerOccurrence)) {
      pages.push(i + 1);
    }
  });

  console.debug('$pdfSearch: "' + searchText + '" in ' + pdfFilePath + ' → found=' + (count > 0) + ', count=' + count + ', pages=' + JSON.stringify(pages));
  return { found: count > 0, count, pages, totalPages: data.numpages };
};

/* @help Files
 * @sig $pdfGetText(pdfFilePath)
 * @desc Extract all text content from a PDF file. Returns an object with { text, pages, totalPages } where pages is an array of per-page text strings.
 * @nodal-desc Extract readable text from a PDF file.
 * @nodal-output object text:string, pages:array<object>, totalPages:number
 * @nodal-param pdfFilePath: PDF filename or absolute path to extract text from.
 */
const $pdfGetText = async function(pdfFilePath) {
  __emitAction('pdfGetText', pdfFilePath);
  if (!pdfFilePath || typeof pdfFilePath !== 'string') {
    throw new Error('$pdfGetText: invalid filepath (got ' + JSON.stringify(pdfFilePath) + ')');
  }
  const pdfParse = __requireSandboxModule('pdf-parse');
  const absolutePath = $getDownloadsPathFile(pdfFilePath);
  const dataBuffer = fs.readFileSync(absolutePath);
  const _origWarn = console.warn;
  console.warn = () => {};
  const data = await pdfParse(dataBuffer);
  console.warn = _origWarn;

  const fullText = data.text || '';
  const pages = fullText.split('\f').map((t, i) => ({ page: i + 1, text: t.trim() })).filter(p => p.text.length > 0);

  console.debug('$pdfGetText: ' + pdfFilePath + ' → ' + data.numpages + ' pages, ' + fullText.length + ' chars');
  return { text: fullText, pages, totalPages: data.numpages };
};

