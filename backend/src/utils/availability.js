const { DateTime } = require('luxon');

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MINUTES_PER_WEEK = 7 * 24 * 60;

/**
 * Converts a single weekly recurring slot (dayOfWeek/startTime/endTime in the
 * user's own timezone) into one or two ranges expressed as "minutes since
 * Sunday 00:00 UTC". Two ranges are returned when the UTC conversion pushes
 * the slot across a week boundary (e.g. a late Saturday-night slot in
 * UTC+9 becomes Sunday morning in UTC).
 *
 * We anchor to a fixed reference week (an arbitrary Sunday) so the offset
 * used reflects a real calendar date for that timezone/weekday, which
 * handles DST correctly for that week. Recurring weekly slots that straddle
 * a DST transition can drift by an hour a couple of times a year - an
 * accepted simplification for a peer-matching MVP.
 */
function slotToUtcMinuteRanges(slot) {
  const dayIndex = DAY_NAMES.indexOf(slot.dayOfWeek);
  if (dayIndex === -1) throw new Error(`Invalid dayOfWeek: ${slot.dayOfWeek}`);

  // Reference week: a known Sunday. Any Sunday works since we only care about
  // the recurring weekly pattern and each zone's current UTC offset.
  const referenceSunday = DateTime.fromISO('2024-01-07', { zone: slot.timezone || 'UTC' });

  const [startH, startM] = slot.startTime.split(':').map(Number);
  const [endH, endM] = slot.endTime.split(':').map(Number);

  const startLocal = referenceSunday.plus({ days: dayIndex, hours: startH, minutes: startM });
  const endLocal = referenceSunday.plus({ days: dayIndex, hours: endH, minutes: endM });

  const startUtc = startLocal.toUTC();
  const endUtc = endLocal.toUTC();

  const toMinuteOfWeek = (dt) => {
    const utcWeekdayIndex = dt.weekday % 7; // luxon: Monday=1..Sunday=7 -> Sunday becomes 0
    return utcWeekdayIndex * 24 * 60 + dt.hour * 60 + dt.minute;
  };

  let start = toMinuteOfWeek(startUtc);
  let end = toMinuteOfWeek(endUtc);

  if (end <= start) {
    // Wrapped past the end of the week (or zero-length) - split into two ranges.
    return [
      { start, end: MINUTES_PER_WEEK },
      { start: 0, end },
    ];
  }

  return [{ start, end }];
}

function slotsToUtcRanges(slots) {
  return (slots || []).flatMap(slotToUtcMinuteRanges);
}

/**
 * Total overlapping minutes per week between two sets of weekly availability
 * slots, after normalizing both to UTC minute-of-week ranges.
 */
function computeOverlapMinutes(slotsA, slotsB) {
  const rangesA = slotsToUtcRanges(slotsA);
  const rangesB = slotsToUtcRanges(slotsB);

  let totalOverlap = 0;
  for (const a of rangesA) {
    for (const b of rangesB) {
      const overlapStart = Math.max(a.start, b.start);
      const overlapEnd = Math.min(a.end, b.end);
      if (overlapEnd > overlapStart) {
        totalOverlap += overlapEnd - overlapStart;
      }
    }
  }
  return totalOverlap;
}

module.exports = { computeOverlapMinutes, slotsToUtcRanges, MINUTES_PER_WEEK };
