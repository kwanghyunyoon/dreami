/**
 * Calculates the current sleep-tracking streak from the log.
 *
 * A "day" is keyed by the calendar date of the session's start time.
 * We walk backwards from yesterday (a session starting tonight hasn't
 * ended yet, so today never counts until the user wakes up).
 * If the most recent entry started today, today counts and we walk
 * from today backwards.
 */
export function calcStreak(log) {
  if (!log || log.length === 0) return 0;

  // Build a Set of date strings "YYYY-MM-DD" that have at least one entry
  const logged = new Set(
    log.map((e) => {
      const d = new Date(e.start);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })
  );

  // Determine anchor: today if logged today, otherwise yesterday
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const anchor = new Date(now);
  if (!logged.has(todayStr)) {
    anchor.setDate(anchor.getDate() - 1);
  }

  let streak = 0;
  const cursor = new Date(anchor);

  while (true) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    if (!logged.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
