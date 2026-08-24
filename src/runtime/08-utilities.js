/* @help Utility
 * @sig $if(condition, valueIfTrue, valueIfFalse)
 * @desc Return one of two values depending on a condition.
 * @availability code
 * @output unknown
 * @param condition [boolean]: Condition to evaluate.
 * @param valueIfTrue: Value returned when the condition is true.
 * @param valueIfFalse: Value returned when the condition is false.
 */
const $if = function(condition, valueIfTrue, valueIfFalse) {
  return condition ? valueIfTrue : valueIfFalse;
};

/* @help Utility
 * @sig $ifEmpty(value, valueIfEmpty)
 * @desc Return a fallback value when the first value is empty. Empty means undefined, null, empty string, empty array or empty object.
 * @availability code
 * @output unknown
 * @param value: Value to check.
 * @param valueIfEmpty: Value returned when the first value is empty.
 */
const $ifEmpty = function(value, valueIfEmpty) {
  if (value === undefined || value === null || value === '') return valueIfEmpty;
  if (Array.isArray(value) && value.length === 0) return valueIfEmpty;
  if (value && typeof value === 'object' && !DateTime.isDateTime(value) && !Array.isArray(value) && Object.keys(value).length === 0) return valueIfEmpty;
  return value;
};

/* @help Utility
 * @sig $max(...numbers)
 * @desc Return the highest number.
 * @availability code
 * @output number
 * @param numbers [number]: One or more numbers to compare.
 */
const $max = function(...numbers) {
  return Math.max(...numbers);
};

/* @help Utility
 * @sig $min(...numbers)
 * @desc Return the lowest number.
 * @availability code
 * @output number
 * @param numbers [number]: One or more numbers to compare.
 */
const $min = function(...numbers) {
  return Math.min(...numbers);
};

/* @help Date
 * @sig $currentDate(timestamp?)
 * @desc Get the current date from a timestamp. Defaults to current date.
 * @eval $currentDate($now)
 * @nodal-output object day:string, month:string, year:number
 * @nodal-param timestamp [number]: Optional timestamp in milliseconds. Leave empty to use the current date.
 */
const $currentDate = function(timestamp) {
  const d = timestamp === undefined || timestamp === null || timestamp === ''
    ? DateTime.now().toJSDate()
    : (timestamp && typeof timestamp.toJSDate === 'function' ? timestamp.toJSDate() : new Date(timestamp));
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: String(d.getMonth() + 1).padStart(2, '0'),
    year: d.getFullYear()
  };
};

/* @help Date
 * @sig $currentDateMinusOneMonth(timestamp?)
 * @desc Get the latest month and year from a timestamp. Defaults to current date.
 * @eval $currentDateMinusOneMonth($now)
 * @nodal-output object day:string, month:string, year:number
 * @nodal-param timestamp [number]: Optional timestamp in milliseconds. Leave empty to use the current date.
 */
const $currentDateMinusOneMonth = function(timestamp) {
  const d = timestamp === undefined || timestamp === null || timestamp === ''
    ? DateTime.now().toJSDate()
    : (timestamp && typeof timestamp.toJSDate === 'function' ? timestamp.toJSDate() : new Date(timestamp));
  d.setMonth(d.getMonth() - 1);
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: String(d.getMonth() + 1).padStart(2, '0'),
    year: d.getFullYear()
  };
};

/* @help Date
 * @sig $currentDatePlusOneMonth(timestamp?)
 * @desc Get the current date plus one month from a timestamp. Defaults to current date.
 * @eval $currentDatePlusOneMonth($now)
 * @nodal-output object day:string, month:string, year:number
 * @nodal-param timestamp [number]: Optional timestamp in milliseconds. Leave empty to use the current date.
 */
const $currentDatePlusOneMonth = function(timestamp) {
  const d = timestamp === undefined || timestamp === null || timestamp === ''
    ? DateTime.now().toJSDate()
    : (timestamp && typeof timestamp.toJSDate === 'function' ? timestamp.toJSDate() : new Date(timestamp));
  d.setMonth(d.getMonth() + 1);
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: String(d.getMonth() + 1).padStart(2, '0'),
    year: d.getFullYear()
  };
};

