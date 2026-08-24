/* @help Globals
 * @sig $page
 * @desc The Puppeteer Page instance. Use for direct page interactions (goto, click, evaluate, etc.).
 * @nodal-desc Current browser page used by the flow.
 */

/* @help Globals
 * @sig $now
 * @desc Current run DateTime. Supports Luxon methods like format(), plus(), minus(), startOf(), endOf() and toISO().
 * @nodal-desc Current date and time for this run.
 */
const __durationUnitMap = {
  day: 'days',
  month: 'months',
  year: 'years',
  week: 'weeks',
  hour: 'hours',
  minute: 'minutes',
  second: 'seconds',
  millisecond: 'milliseconds',
  ms: 'milliseconds',
  sec: 'seconds',
  secs: 'seconds',
  hr: 'hours',
  hrs: 'hours',
  min: 'minutes',
  mins: 'minutes',
};
const __dateTimeUnitMap = {
  days: 'day',
  months: 'month',
  years: 'year',
  hours: 'hour',
  minutes: 'minute',
  seconds: 'second',
  milliseconds: 'millisecond',
  hrs: 'hour',
  hr: 'hour',
  mins: 'minute',
  min: 'minute',
  secs: 'second',
  sec: 'second',
  ms: 'millisecond',
  week: 'week',
};
const __dateTimeDurationUnits = ['milliseconds', 'seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'quarters', 'years'];
const __toDateTime = function(value) {
  if (DateTime.isDateTime(value)) return value;
  if (value instanceof Date) return DateTime.fromJSDate(value);
  if (typeof value === 'number') return DateTime.fromMillis(value);
  if (typeof value === 'string') {
    const iso = DateTime.fromISO(value);
    if (iso.isValid) return iso;
    const parsed = new Date(value);
    return DateTime.fromJSDate(parsed);
  }
  if (value && typeof value.toJSDate === 'function') return DateTime.fromJSDate(value.toJSDate());
  return DateTime.now();
};
const __durationObject = function(durationValue, unit) {
  if (durationValue && typeof durationValue === 'object') return durationValue;
  const normalizedUnit = __durationUnitMap[unit] || unit || 'milliseconds';
  return { [normalizedUnit]: durationValue || 0 };
};
const __installDateTimeAliases = function() {
  const proto = DateTime.prototype;
  const nativePlus = proto.__nopNativePlus || proto.plus;
  const nativeMinus = proto.__nopNativeMinus || proto.minus;
  if (!proto.__nopNativePlus) Object.defineProperty(proto, '__nopNativePlus', { value: nativePlus });
  if (!proto.__nopNativeMinus) Object.defineProperty(proto, '__nopNativeMinus', { value: nativeMinus });
  proto.plus = function(durationOrAmount, unit) {
    return nativePlus.call(this, arguments.length <= 1 ? durationOrAmount : __durationObject(durationOrAmount, unit));
  };
  proto.minus = function(durationOrAmount, unit) {
    return nativeMinus.call(this, arguments.length <= 1 ? durationOrAmount : __durationObject(durationOrAmount, unit));
  };
  if (!proto.format) {
    proto.format = function(dateFormat = 'yyyy-MM-dd') {
      return this.toFormat(dateFormat);
    };
  }
  if (!proto.extract) {
    proto.extract = function(part = 'week') {
      const normalizedPart = part === 'week' ? 'weekNumber' : (__dateTimeUnitMap[part] || part);
      return this.get(normalizedPart);
    };
  }
  if (!proto.diffTo) {
    proto.diffTo = function(otherDate, unit = 'days') {
      let units = Array.isArray(unit) ? unit : [unit];
      if (units.length === 0) units = ['days'];
      const invalidUnit = units.find(u => !__dateTimeDurationUnits.includes(u) && !['day', 'week', 'month', 'year', 'hour', 'minute', 'second', 'millisecond', 'weekNumber', 'weekday'].includes(u));
      if (invalidUnit) throw new Error('Unsupported DateTime diff unit: ' + invalidUnit);
      const diffResult = this.diff(__toDateTime(otherDate), units);
      return units.length > 1 ? diffResult.toObject() : diffResult.as(units[0]);
    };
  }
  if (!proto.diffToNow) {
    proto.diffToNow = function(unit = 'days') {
      return this.diffTo(DateTime.now(), unit);
    };
  }
  if (!proto.isBetween) {
    proto.isBetween = function(firstDate, secondDate) {
      const first = __toDateTime(firstDate);
      const second = __toDateTime(secondDate);
      return first > second ? second < this && this < first : first < this && this < second;
    };
  }
  if (!Object.prototype.hasOwnProperty.call(proto, 'isWeekend')) {
    Object.defineProperty(proto, 'isWeekend', {
      get() { return [6, 7].includes(this.weekday); },
    });
  }
};
__installDateTimeAliases();
const $now = DateTime.now();

/* @help Globals
 * @sig $today
 * @desc Current day at midnight as a DateTime. Useful for date-only comparisons and ranges.
 */
const $today = DateTime.now().startOf('day');

