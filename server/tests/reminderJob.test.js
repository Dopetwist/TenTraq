import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCronSchedule } from '../services/rentReminderService.js';

test('rent reminder scheduler runs every day at 8 AM', () => {
  assert.equal(buildCronSchedule(), '0 8 * * *');
});
