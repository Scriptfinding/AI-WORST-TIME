/* @help Date
 * @sig $sortDates(dateFormat, dateValues, sortOrder?)
 * @desc Sort an array of date strings by chronological order. Uses the same format tokens as $parseDates (dd, mm, yyyy). Default order: "asc".
 * @nodal-output array<string>
 * @nodal-param dateFormat [string]: Date format used by every value, for example "dd/mm/yyyy".
 * @nodal-param dateValues [array]: Array of date strings to sort.
 * @nodal-param sortOrder: Sort direction. Use "asc" for oldest first or "desc" for newest first.
 */
const $sortDates = function(dateFormat, dateValues, sortOrder = 'asc') {
  const formatParts = dateFormat.toLowerCase().split(/[^a-z]+/);
  const separatorMatch = dateFormat.match(/[^a-zA-Z]+/);
  const separator = separatorMatch ? separatorMatch[0] : '/';

  const toTimestamp = (dateStr) => {
    const parts = dateStr.split(separator);
    const map = {};
    formatParts.forEach((key, i) => {
      map[key] = parseInt(parts[i], 10);
    });
    return new Date(map['yyyy'], (map['mm'] || 1) - 1, map['dd'] || 1).getTime();
  };

  return [...dateValues].sort((a, b) => {
    const diff = toTimestamp(a) - toTimestamp(b);
    return sortOrder === 'desc' ? -diff : diff;
  });
};

/* @help Date
 * @sig $parseDates(dateFormat, ...dateStrings)
 * @desc Parse date strings according to a format pattern (tokens: dd, mm, yyyy, yy). Returns an array of Date objects.
 * @nodal-desc Convert one or more text dates into sortable date values.
 * @nodal-output array<date>
 * @nodal-param dateFormat [string]: Date format to read, for example "dd/mm/yyyy".
 * @nodal-param dateStrings: One or more date strings to parse with this format.
 */
const $parseDates = function(dateFormat, ...dateStrings) {
  const tokens = dateFormat.match(/(dd|mm|yyyy|yy)/gi);
  if (!tokens) {
    throw new Error('Invalid date format: ' + dateFormat);
  }
  return dateStrings.map((dateStr) => {
    const parts = dateStr.split(/[^a-zA-Z0-9]/).filter(Boolean);
    if (parts.length !== tokens.length) {
      throw new Error('Invalid date for format ' + dateFormat + ': ' + dateStr);
    }
    let day = 1;
    let month = 1;
    let year = 1970;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i].toLowerCase();
      const value = Number(parts[i]);
      if (Number.isNaN(value)) {
        throw new Error('Invalid value in date: ' + dateStr);
      }
      if (token === 'dd') day = value;
      else if (token === 'mm') month = value;
      else if (token === 'yyyy') year = value;
      else if (token === 'yy') year = 2000 + value;
    }
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      throw new Error('Invalid date: ' + dateStr);
    }
    return date;
  });
};

