import test from 'node:test';
import assert from 'node:assert/strict';
import { formatFacultyName } from '../src/utils/facultyDisplayName.js';
import { attendanceCounts, attendanceRecords, markLoadedRoster, rosterShortcut } from '../src/utils/attendanceMarking.js';

test('faculty titles preserve Dr/Mr/Ms, normalize spacing and remove duplicate Prof', () => {
 for (const [input, expected] of [
 ['Jagatram Gaydhane', 'Prof. Jagatram Gaydhane'],
 ['Prof. Jagatram Gaydhane', 'Prof. Jagatram Gaydhane'],
 ['Prof. Prof. Jagatram Gaydhane', 'Prof. Jagatram Gaydhane'],
 ['Prof.Neeta Moharkar', 'Prof. Neeta Moharkar'],
 ['Dr. Vidya Kubde', 'Dr. Vidya Kubde'], ['Mr Rane', 'Mr. Rane'],
 ['Ms. Korade', 'Ms. Korade'], ['', 'Faculty'],
 ]) assert.equal(formatFacultyName(input), expected);
});
const roster = [{ id: 11, status: '' }, { id: 22, status: '' }, { id: 33, status: '' }];
test('bulk marking only changes loaded roster, without mutating source', () => {
 const present = markLoadedRoster(roster, 'PRESENT');
 assert.deepEqual(present.map((s) => s.id), [11, 22, 33]);
 assert.equal(attendanceCounts(present).present, 3);
 assert.equal(attendanceCounts(roster).missing, 3);
 const absent = markLoadedRoster(present, 'ABSENT');
 assert.equal(attendanceCounts(absent).absent, 3);
 assert.throws(() => markLoadedRoster(roster, 'LATE'));
});
test('counts stay live after bulk marking and individual exceptions', () => {
 const marked = markLoadedRoster(roster, 'PRESENT').map((s) => s.id === 22 ? {...s, status: 'ABSENT'} : s);
 assert.deepEqual(attendanceCounts(marked), { total: 3, present: 2, absent: 1, marked: 3, missing: 0 });
});
test('payload excludes unmarked and rejects unsupported statuses', () => {
 assert.deepEqual(attendanceRecords([{id: 11, status: 'PRESENT'}, {id: 22, status: ''}]), [{studentId: 11, status: 'PRESENT'}]);
 for (const status of ['LATE', 'EXCUSED', 'UNKNOWN']) assert.throws(() => attendanceRecords([{id: 11, status}]));
});
test('keyboard navigation clamps rows and marks only the selected visible student', () => {
 assert.deepEqual(rosterShortcut(roster, 11, 'arrowup'), {id: 11, status: null});
 assert.deepEqual(rosterShortcut(roster, 33, 'arrowdown'), {id: 33, status: null});
 assert.deepEqual(rosterShortcut(roster, 11, 'arrowdown'), {id: 22, status: null});
 assert.deepEqual(rosterShortcut([roster[2]], 11, 'a'), {id: 33, status: 'ABSENT'});
 assert.deepEqual(rosterShortcut(roster, 22, 'p'), {id: 22, status: 'PRESENT'});
 assert.equal(rosterShortcut([], 11, 'p'), null);
 assert.equal(rosterShortcut(roster, 11, 'l'), null);
 assert.equal(rosterShortcut(roster, 11, 'e'), null);
});

test('historical lab roster rows are read-only for bulk actions and excluded from counts/payload', () => {
 const historical = {id: 44, eligible: false, status: 'EXCUSED'};
 const mixed = [{id: 11, eligible: true, status: ''}, {id: 22, status: ''}, historical];
 const marked = markLoadedRoster(mixed, 'PRESENT');
 assert.equal(marked[2], historical);
 assert.deepEqual(attendanceCounts(marked), {total: 2, present: 2, absent: 0, marked: 2, missing: 0});
 assert.deepEqual(attendanceRecords(marked), [{studentId: 11, status: 'PRESENT'}, {studentId: 22, status: 'PRESENT'}]);
 assert.deepEqual(attendanceRecords([historical]), []);
 assert.equal(markLoadedRoster(mixed, 'ABSENT')[2], historical);
});
test('keyboard can inspect historical rows but cannot mark them', () => {
 const mixed = [{id: 11, eligible: true}, {id: 44, eligible: false}, {id: 22, eligible: true}];
 assert.deepEqual(rosterShortcut(mixed, 11, 'arrowdown'), {id: 44, status: null});
 assert.deepEqual(rosterShortcut(mixed, 44, 'p'), {id: 44, status: null});
 assert.deepEqual(rosterShortcut(mixed, 44, 'a'), {id: 44, status: null});
 assert.deepEqual(rosterShortcut(mixed, 44, 'arrowdown'), {id: 22, status: null});
 assert.deepEqual(rosterShortcut(mixed, 22, 'p'), {id: 22, status: 'PRESENT'});
});
