import test from 'node:test';
import assert from 'node:assert/strict';
import { mergePolledAttendanceRoster } from '../src/utils/attendanceRoster.js';

test('poll merges a genuine server check-in for a student without a local edit', () => {
  const merged = mergePolledAttendanceRoster(
    [{ id: 1, name: 'Student One', status: '' }],
    [{ id: 1, name: 'Student One', status: 'PRESENT' }],
    new Map()
  );

  assert.equal(merged[0].status, 'PRESENT');
});

test('poll preserves an unsaved faculty status over a stale server status', () => {
  const merged = mergePolledAttendanceRoster(
    [{ id: 1, name: 'Student One', status: 'ABSENT' }],
    [{ id: 1, name: 'Student One', status: 'PRESENT' }],
    new Map([[1, 'ABSENT']])
  );

  assert.equal(merged[0].status, 'ABSENT');
});

test('poll retains a locally edited row omitted from a later roster as non-eligible', () => {
  const merged = mergePolledAttendanceRoster(
    [{ id: 1, name: 'Student One', status: 'PRESENT' }],
    [],
    new Map([[1, 'PRESENT']])
  );

  assert.equal(merged.length, 1);
  assert.equal(merged[0].status, 'PRESENT');
  assert.equal(merged[0].eligible, false);
});
