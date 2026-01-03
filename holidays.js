/**
 * Hong Kong Public Holidays
 *
 * Uses Hong Kong Government 1823 API to fetch holiday data
 * API: https://www.1823.gov.hk/common/ical/
 *
 * Note: When opening from local file://, holidays cannot be loaded due to CORS restrictions.
 * It will work properly after deploying to GitHub Pages or other HTTPS websites.
 */

// Parsed holidays map: { "YYYY-MM-DD": { zh: "中文名", en: "English Name" } }
let holidaysMap = new Map();

// API URLs
const API_EN = 'https://www.1823.gov.hk/common/ical/en.json';
const API_ZH = 'https://www.1823.gov.hk/common/ical/tc.json';

/**
 * Fetch holiday data from government API
 */
async function fetchHolidays() {
  try {
    const [enRes, zhRes] = await Promise.all([fetch(API_EN), fetch(API_ZH)]);

    if (!enRes.ok || !zhRes.ok) {
      throw new Error('API response not OK');
    }

    const enData = await enRes.json();
    const zhData = await zhRes.json();

    parseApiData(enData, zhData);
  } catch (error) {
    // Silent handling on API failure, Sundays will still be marked
  }
}

/**
 * Parse the iCal JSON format from government API
 */
function parseApiData(enData, zhData) {
  const enEvents = enData.vcalendar?.[0]?.vevent || [];
  const zhEvents = zhData.vcalendar?.[0]?.vevent || [];

  // Build Chinese name lookup table
  const zhMap = new Map();
  zhEvents.forEach((event) => {
    const dateStr = extractDateStr(event.dtstart);
    if (dateStr) {
      zhMap.set(dateStr, event.summary);
    }
  });

  // Merge Chinese and English data
  enEvents.forEach((event) => {
    const dateStr = extractDateStr(event.dtstart);
    if (dateStr) {
      const enName = event.summary;
      const zhName = zhMap.get(dateStr) || enName;
      holidaysMap.set(dateStr, { en: enName, zh: zhName });
    }
  });
}

/**
 * Extract date string (YYYY-MM-DD) from dtstart array
 */
function extractDateStr(dtstart) {
  if (!dtstart || !Array.isArray(dtstart) || dtstart.length === 0) {
    return null;
  }
  const rawDate = dtstart[0];
  if (typeof rawDate === 'string' && rawDate.length === 8) {
    const year = rawDate.substring(0, 4);
    const month = rawDate.substring(4, 6);
    const day = rawDate.substring(6, 8);
    return `${year}-${month}-${day}`;
  }
  return null;
}

/**
 * Get holiday info for a specific date
 * @param {number} year - The year
 * @param {number} month - The month (0-indexed, 0 = January)
 * @param {number} day - The day of the month
 * @returns {Object|null} Holiday object { zh, en } or null if not a holiday
 */
function getHoliday(year, month, day) {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
    day,
  ).padStart(2, '0')}`;
  return holidaysMap.get(dateStr) || null;
}

/**
 * Get all holidays for a specific month
 * @param {number} year - The year
 * @param {number} month - The month (0-indexed, 0 = January)
 * @returns {Map<number, Object>} Map of day -> holiday object { zh, en }
 */
function getMonthHolidays(year, month) {
  const result = new Map();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  holidaysMap.forEach((value, key) => {
    if (key.startsWith(monthStr)) {
      const day = parseInt(key.split('-')[2], 10);
      result.set(day, value);
    }
  });

  return result;
}
