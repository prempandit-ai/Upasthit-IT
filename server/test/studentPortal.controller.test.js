process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:5432/upasthit_test';

const { after, beforeEach, test } = require('node:test');
const assert = require('node:assert/strict');
const prisma = require('../src/config/prisma');
const studentPortal = require('../src/controllers/studentPortal.controller');

const originalFindStudent = prisma.studentProfile.findUnique;
const originalFindRequest = prisma.leaveRequest.findUnique;
const originalCreateRequest = prisma.leaveRequest.create;
let calls;

beforeEach(() => {
  calls = { studentLookups: [], requestCreates: 0 };
  prisma.studentProfile.findUnique = async (args) => {
    calls.studentLookups.push(args);
    return {
      id: 72,
      userId: 'authenticated-user',
      enrollmentStatus: 'ACTIVE',
      user: { role: 'STUDENT', status: 'APPROVED', isActive: true },
    };
  };
  prisma.leaveRequest.findUnique = async () => ({
    id: 501,
    leaveType: 'Medical',
    startDate: new Date('2026-11-01T00:00:00.000Z'),
    endDate: new Date('2026-11-02T00:00:00.000Z'),
    submittedAt: new Date('2026-10-24T00:00:00.000Z'),
    reason: 'Existing request',
    status: 'PENDING',
  });
  prisma.leaveRequest.create = async () => { calls.requestCreates += 1; throw new Error('Should not create a duplicate request'); };
});

after(async () => {
  prisma.studentProfile.findUnique = originalFindStudent;
  prisma.leaveRequest.findUnique = originalFindRequest;
  prisma.leaveRequest.create = originalCreateRequest;
  await prisma.$disconnect();
});

function invoke(handler, req) {
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      status(value) { this.statusCode = value; return this; },
      json(body) { resolve({ statusCode: this.statusCode, body }); return this; },
    };
    handler(req, res, reject);
  });
}

test('student profile updates reject protected academic identity fields before a database write', async () => {
  const result = await invoke(studentPortal.updateProfile, {
    user: { id: 'authenticated-user' },
    body: { academicYear: '2099-00', labBatch: 'A1' },
  }).catch((error) => error);

  assert.equal(result.statusCode, 400);
  assert.match(result.message, /managed by authorized staff/i);
  assert.equal(calls.studentLookups.length, 0);
});

test('repeated leave submission reuses the authenticated student request key', async () => {
  const result = await invoke(studentPortal.createLeaveRequest, {
    user: { id: 'authenticated-user' },
    body: {
      studentId: 'another-student',
      type: 'Medical',
      startDate: '2026-11-01',
      endDate: '2026-11-02',
      reason: 'New client retry',
      clientRequestId: 'retry-1',
    },
  });

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.request.id, '501');
  assert.deepEqual(calls.studentLookups[0].where, { userId: 'authenticated-user' });
  assert.equal(calls.requestCreates, 0);
});

test('unapproved student accounts cannot submit leave requests', async () => {
  prisma.studentProfile.findUnique = async () => ({
    id: 72,
    userId: 'authenticated-user',
    enrollmentStatus: 'ACTIVE',
    user: { role: 'STUDENT', status: 'PENDING', isActive: true },
  });
  const result = await invoke(studentPortal.createLeaveRequest, {
    user: { id: 'authenticated-user' },
    body: { type: 'Medical', startDate: '2026-11-01', endDate: '2026-11-02', reason: 'Test', clientRequestId: 'retry-2' },
  }).catch((error) => error);

  assert.equal(result.statusCode, 403);
  assert.equal(calls.requestCreates, 0);
});
