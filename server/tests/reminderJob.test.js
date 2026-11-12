import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCronSchedule,
  getReminderDate,
  normalizeReminderDurations
} from '../services/reminderSchedule.js';

test('rent reminder scheduler runs every day at 8 AM', () => {
  assert.equal(buildCronSchedule(), '0 8 * * *');
});

test('reminder durations are validated and deduplicated', () => {
  assert.deepEqual(normalizeReminderDurations(['2 Months', '1 Week', '2 Months']), ['2 Months', '1 Week']);
  assert.deepEqual(normalizeReminderDurations(undefined), []);
  assert.throws(() => normalizeReminderDurations('Tomorrow'), /invalid/);
});

test('reminder dates are calculated relative to lease end with calendar month clamping', () => {
  assert.equal(getReminderDate('2025-03-31', '1 Month'), '2025-02-28');
  assert.equal(getReminderDate('2024-04-30', '2 Months'), '2024-02-29');
  assert.equal(getReminderDate('2025-01-08', '1 Week'), '2025-01-01');
  assert.equal(getReminderDate('2025-01-08', '3 Days'), '2025-01-05');
  assert.throws(() => getReminderDate('2025-02-30', '1 Month'), /valid/);
});
