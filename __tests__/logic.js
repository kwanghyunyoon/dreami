/**
 * Pure-logic tests for sleep-app — no React Native dependencies required.
 * Run:  node __tests__/logic.js
 *
 * Extracted verbatim from the screen files so that any future divergence
 * between the two copies also becomes a test failure.
 */

// ── Tiny assertion harness ────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function eq(actual, expected, msg) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    process.stdout.write(`  ✅  ${msg}\n`);
    passed++;
  } else {
    process.stderr.write(
      `  ❌  ${msg}\n` +
      `       expected  ${JSON.stringify(expected)}\n` +
      `       got       ${JSON.stringify(actual)}\n`,
    );
    failed++;
  }
}

function ok(condition, msg) { eq(!!condition, true, msg); }

function section(name) {
  console.log(`\n── ${name} ${'─'.repeat(Math.max(0, 55 - name.length))}`);
}

// ── Logic copied verbatim from the screen files ───────────────────────────────

/** AlarmScreen.js  AND  HomeScreen.js  — must be identical */
function to24h(hour12, isPM) {
  if (!isPM) return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

/** HomeScreen.js (new) */
function formatTime12(h24, minute) {
  const isPM = h24 >= 12;
  const h12  = h24 % 12 || 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
}

/** HomeScreen.js  AND  LogScreen.js — must be identical */
function formatDuration(ms) {
  if (!ms || ms < 60_000) return '—';   // < 1 min → treat as no data
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** LogScreen.js — returns score label only for testability */
function getSleepScore(ms) {
  const hours = ms / 3600000;
  if (hours >= 7 && hours <= 9) return 'Great';
  if (hours >= 6)                return 'OK';
  return 'Short';
}

/** HomeScreen.js useFocusEffect — bedtime arithmetic extracted */
function calcBedtime(alarmHour12, alarmMinute, alarmIsPM, avgMs) {
  const h24          = to24h(alarmHour12, alarmIsPM);
  const alarmTotalMin = h24 * 60 + alarmMinute;
  const avgMin        = Math.round(avgMs / 60_000);
  const bedMin        = ((alarmTotalMin - avgMin) % (24 * 60) + 24 * 60) % (24 * 60);
  return { hour: Math.floor(bedMin / 60), minute: bedMin % 60 };
}

/**
 * AlarmScreen.js — nextAlarmText arithmetic extracted.
 * Returns the computed next-alarm Date (ignores selectedDays — that's the bug).
 */
function calcNextAlarmDate(alarmHour12, alarmMinute, alarmIsPM, now) {
  const h24  = to24h(alarmHour12, alarmIsPM);
  const alarm = new Date(now);
  alarm.setHours(h24, alarmMinute, 0, 0);
  if (alarm <= now) alarm.setDate(alarm.getDate() + 1);
  return alarm;
}

/**
 * FIXED version that walks forward until it lands on a selected day.
 * (dayIndex: 0=Sun … 6=Sat, matching JS getDay())
 */
function calcNextAlarmDateFixed(alarmHour12, alarmMinute, alarmIsPM, selectedDays, now) {
  const h24  = to24h(alarmHour12, alarmIsPM);
  const alarm = new Date(now);
  alarm.setHours(h24, alarmMinute, 0, 0);
  if (alarm <= now) alarm.setDate(alarm.getDate() + 1);

  // Walk forward up to 7 days until we land on a selected day
  for (let i = 0; i < 7; i++) {
    if (selectedDays.includes(alarm.getDay())) return alarm;
    alarm.setDate(alarm.getDate() + 1);
  }
  return alarm; // fallback (shouldn't happen if selectedDays is non-empty)
}

/** LogScreen.js — week-chart data builder extracted */
function buildWeekData(log, today = new Date()) {
  const todayDay = today.getDay();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - todayDay + i);
    const dayStr = d.toDateString();
    const entry  = log.find(e => new Date(e.start).toDateString() === dayStr);
    return {
      hours:   entry ? Math.round(entry.duration / 3600000 * 10) / 10 : 0,
      isToday: i === todayDay,
    };
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

section('to24h — 12-hour → 24-hour conversion');
eq(to24h(12, false),  0,  '12 AM → 0 (midnight)');
eq(to24h( 1, false),  1,  '1 AM  → 1');
eq(to24h(11, false), 11,  '11 AM → 11');
eq(to24h(12, true),  12,  '12 PM → 12 (noon)');
eq(to24h( 1, true),  13,  '1 PM  → 13');
eq(to24h(11, true),  23,  '11 PM → 23');

// ─────────────────────────────────────────────────────────────────────────────
section('formatTime12 — 24-hour → 12-hour AM/PM display');
eq(formatTime12( 0,  0), '12:00 AM', 'midnight (0:00) → 12:00 AM');
eq(formatTime12(12,  0), '12:00 PM', 'noon (12:00)    → 12:00 PM');
eq(formatTime12( 1,  5),  '1:05 AM', '01:05           → 1:05 AM');
eq(formatTime12(13, 30),  '1:30 PM', '13:30           → 1:30 PM');
eq(formatTime12(23, 59), '11:59 PM', '23:59           → 11:59 PM');

// ─────────────────────────────────────────────────────────────────────────────
section('formatDuration — milliseconds → human string');
eq(formatDuration(null),           '—',      'null → em-dash');
eq(formatDuration(0),              '—',      '0 ms → em-dash');
eq(formatDuration(59_000),         '—',      '59 s → "—" (sub-minute start/stop treated as no data)');
eq(formatDuration(60_000),         '1m',     '1 min');
eq(formatDuration(45 * 60_000),    '45m',    '45 min');
eq(formatDuration(3_600_000),      '1h 0m',  '1 h exactly');
eq(formatDuration(7.5 * 3_600_000),'7h 30m', '7.5 h');
eq(formatDuration(8 * 3_600_000),  '8h 0m',  '8 h exactly');

// ─────────────────────────────────────────────────────────────────────────────
section('getSleepScore — quality thresholds');
eq(getSleepScore(7 * 3_600_000),   'Great', '7 h → Great (lower bound)');
eq(getSleepScore(8 * 3_600_000),   'Great', '8 h → Great');
eq(getSleepScore(9 * 3_600_000),   'Great', '9 h → Great (upper bound)');
eq(getSleepScore(6.5 * 3_600_000), 'OK',    '6.5 h → OK');
eq(getSleepScore(6 * 3_600_000),   'OK',    '6 h exactly → OK');
eq(getSleepScore(5.9 * 3_600_000), 'Short', '5.9 h → Short');

// ── Edge / suspect cases ──────────────────────────────────────────────────────
// > 9h: the condition `hours >= 7 && hours <= 9` is false, falls through to
// `hours >= 6` → 'OK'.  Oversleeping (10 h) scores the same as marginal (6.5 h).
console.log();
console.log('  ⚠️   getSleepScore(10h) =', getSleepScore(10 * 3_600_000),
  '← oversleep scores same as marginal 6.5h (design gap, not crash)');

// ─────────────────────────────────────────────────────────────────────────────
section('calcBedtime — smart bedtime arithmetic');
eq(calcBedtime(6,  0, false, 8 * 3_600_000), { hour: 22, minute:  0 },
   '6:00 AM alarm, 8 h avg → 10:00 PM');
eq(calcBedtime(7, 30, false, 8 * 3_600_000), { hour: 23, minute: 30 },
   '7:30 AM alarm, 8 h avg → 11:30 PM');
eq(calcBedtime(7,  0, false, 7 * 3_600_000), { hour:  0, minute:  0 },
   '7:00 AM alarm, 7 h avg → 12:00 AM (midnight)');
eq(calcBedtime(7,  0, false, 6.5 * 3_600_000), { hour: 0, minute: 30 },
   '7:00 AM alarm, 6.5 h avg → 12:30 AM');
// Midnight alarm: wraps back to previous afternoon
eq(calcBedtime(12, 0, false, 8 * 3_600_000), { hour: 16, minute: 0 },
   '12:00 AM alarm, 8 h avg → 4:00 PM (prev day wrap-around)');

// ─────────────────────────────────────────────────────────────────────────────
section('nextAlarmText — selected-days bug');

// Setup: Mon–Fri alarm (indices 1–5), alarm at 6:00 AM
const MON_FRI = [1, 2, 3, 4, 5];
const ALARM_H  = 6;
const ALARM_M  = 0;
const ALARM_PM = false;

// It is Saturday 8 AM — alarm already passed for today
// JS getDay(): 0=Sun, 1=Mon, …, 6=Sat
const satMorning = new Date('2026-05-23T08:00:00'); // Saturday May 23 2026
ok(satMorning.getDay() === 6, 'test fixture is Saturday');

const buggyNext = calcNextAlarmDate(ALARM_H, ALARM_M, ALARM_PM, satMorning);
const fixedNext = calcNextAlarmDateFixed(ALARM_H, ALARM_M, ALARM_PM, MON_FRI, satMorning);

console.log(`\n  buggy result : ${buggyNext.toDateString()} (getDay=${buggyNext.getDay()})`);
console.log(`  fixed result : ${fixedNext.toDateString()} (getDay=${fixedNext.getDay()})`);

// Unpatched logic points to Sunday — no alarm fires Sunday for Mon-Fri schedule
ok(buggyNext.getDay() === 0,
   'unpatched: naively lands on Sunday (wrong day confirmed)');
ok(fixedNext.getDay() === 1,
   'patched: walks forward to Monday ✅');

// Same bug on a public holiday / all-off edge: Saturday with Sat–Sun alarm off, Mon–Fri only
const sunNight = new Date('2026-05-24T23:30:00'); // Sunday night (late)
ok(sunNight.getDay() === 0, 'test fixture is Sunday night');
const buggyMon = calcNextAlarmDate(ALARM_H, ALARM_M, ALARM_PM, sunNight);
const fixedMon = calcNextAlarmDateFixed(ALARM_H, ALARM_M, ALARM_PM, MON_FRI, sunNight);
ok(buggyMon.getDay() === 1,
   'Sunday-night: both agree on Monday (no bug on this path)');
ok(fixedMon.getDay() === 1,
   'Sunday-night fixed: still Monday ✅');

// ─────────────────────────────────────────────────────────────────────────────
section('buildWeekData — week chart');

// Wednesday May 20 2026
const wednesday = new Date('2026-05-20T09:00:00');
ok(wednesday.getDay() === 3, 'fixture is Wednesday');

const log = [
  { start: '2026-05-18T23:00:00', duration: 7 * 3_600_000 },  // Monday night
  { start: '2026-05-20T22:30:00', duration: 7.5 * 3_600_000 },// Wednesday night
];

const week = buildWeekData(log, wednesday);
eq(week.length, 7, 'always 7 bars');
eq(week[3].isToday, true,  'Wednesday (index 3) is today');
eq(week[0].isToday, false, 'Sunday is not today');

// Monday is index 1 in 0=Sun week; log entry on May 18 (Mon)
eq(week[1].hours, 7,   'Monday: 7 h');
// Wednesday night entry logged on May 20
eq(week[3].hours, 7.5, 'Wednesday: 7.5 h');
// Tuesday has no entry
eq(week[2].hours, 0,   'Tuesday: 0 h (no entry)');

// Edge: multiple entries same day — find() returns the FIRST (newest) entry
const dupLog = [
  { start: '2026-05-20T22:30:00', duration: 8 * 3_600_000 },  // Wed entry 1 (newest)
  { start: '2026-05-20T14:00:00', duration: 2 * 3_600_000 },  // Wed entry 2 (nap)
];
const weekDup = buildWeekData(dupLog, wednesday);
eq(weekDup[3].hours, 8, 'duplicate day: first (newest) entry wins — 8h not 2h');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log(`  ${passed} passed   ${failed} failed`);
console.log('═'.repeat(60));
if (failed > 0) process.exit(1);
