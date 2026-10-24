'use strict';

// Offline router regression: use the real approval/role middleware and Express
// dispatch, but replace authentication and controllers before loading routers.
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

function controllerStubs(namespace, names) {
  return Object.fromEntries(names.map((name) => [name, (req, res) => res.json({
    handler: namespace + '.' + name,
    params: req.params,
  })]));
}

const stubs = new Map([
  [require.resolve('../src/middleware/auth.middleware'), (req, res, next) => {
    if (!req.fixtureUser) return res.status(401).json({ success: false });
    req.user = req.fixtureUser;
    return next();
  }],
  [require.resolve('../src/controllers/coordinator.controller'), controllerStubs('coordinator', [
    'getDashboard', 'listStudentBatches', 'updateStudentBatch',
    'listPendingStudents', 'approveStudent', 'rejectStudent', 'getApprovalHistory',
  ])],
  [require.resolve('../src/controllers/event.controller'), controllerStubs('event', [
    'getEventStats', 'listEvents', 'createEvent',
  ])],
  [require.resolve('../src/controllers/studentPortalManagement.controller'), controllerStubs('portalManagement', [
    'getCoordinatorDashboardStats', 'getCoordinatorReports', 'listCoordinatorFaculty',
    'mapCoordinatorFacultyToEvent', 'listCoordinatorParticipants', 'addCoordinatorParticipant',
    'bulkAddCoordinatorParticipants', 'listCoordinatorEvents', 'getCoordinatorEvent',
    'createCoordinatorEvent', 'getFacultyTimetable', 'createTimetableEntry',
    'deleteTimetableEntry', 'listFacultyAssignments', 'createFacultyAssignment',
    'updateFacultyAssignment', 'getAssignmentSubmissions', 'reviewAssignmentSubmission',
    'listFacultyStudyPlans', 'createFacultyStudyPlan', 'publishStudyPlan',
  ])],
  [require.resolve('../src/controllers/faculty.controller'), controllerStubs('faculty', [
    'getMyProfile', 'getMyDashboard', 'getMyTodayClasses', 'getMyTodaySchedule',
    'getMyNotifications', 'getMyAttendanceSummary', 'listFaculty', 'getFaculty',
    'getAssignedSubjects', 'createFaculty', 'updateFaculty', 'assignSubject',
    'removeSubjectAssignment', 'deleteFaculty',
  ])],
  [require.resolve('../src/middleware/validate.middleware'), (_req, _res, next) => next()],
  [require.resolve('../src/validators/faculty.validator'), { createFacultyRules: [] }],
]);

function loadOfflineRouter(relativePath) {
  const routerPath = require.resolve(relativePath);
  const savedCache = new Map([...stubs.keys(), routerPath].map((key) => [key, require.cache[key]]));
  const originalLoad = Module._load;
  const prismaPath = require.resolve('../src/config/prisma');
  try {
    for (const [filename, exports] of stubs) {
      const replacement = new Module(filename);
      replacement.filename = filename;
      replacement.loaded = true;
      replacement.exports = exports;
      require.cache[filename] = replacement;
    }
    delete require.cache[routerPath];
    Module._load = function guardedLoad(request, parent, isMain) {
      const filename = Module._resolveFilename(request, parent, isMain);
      if (filename === prismaPath || /node_modules[\\/](?:pg|@prisma|@neondatabase)(?:[\\/]|$)/.test(filename)) {
        throw new Error('Database dependencies are forbidden in offline router tests');
      }
      return originalLoad.apply(this, arguments);
    };
    return require(routerPath);
  } finally {
    Module._load = originalLoad;
    for (const [filename, original] of savedCache) {
      if (original) require.cache[filename] = original;
      else delete require.cache[filename];
    }
  }
}

const coordinatorRouter = loadOfflineRouter('../src/routes/coordinator.routes');
const facultyRouter = loadOfflineRouter('../src/routes/faculty.routes');

function approvedUser(role, roles = [role]) {
  return { id: 'offline-route-test-user', role, roles, status: 'APPROVED' };
}

function dispatch(router, method, url, user) {
  return new Promise((resolve, reject) => {
    const req = { method, url, originalUrl: url, headers: {}, fixtureUser: user };
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(body) { resolve({ status: this.statusCode, body }); return this; },
    };
    router.handle(req, res, (error) => reject(error || new Error('No route matched ' + method + ' ' + url)));
  });
}

function registrations(router) {
  return router.stack.flatMap((layer) => layer.route
    ? Object.keys(layer.route.methods).filter((method) => layer.route.methods[method])
      .map((method) => method.toUpperCase() + ' ' + layer.route.path)
    : []);
}

const coordinatorEndpoints = [
  ['GET', '/dashboard', 'coordinator.getDashboard'],
  ['GET', '/student-batches', 'coordinator.listStudentBatches'],
  ['PATCH', '/student-batches/42', 'coordinator.updateStudentBatch'],
  ['GET', '/events', 'portalManagement.listCoordinatorEvents'],
  ['POST', '/events', 'portalManagement.createCoordinatorEvent'],
  ['GET', '/pending-students', 'coordinator.listPendingStudents'],
  ['PATCH', '/students/42/approve', 'coordinator.approveStudent'],
  ['PATCH', '/students/42/reject', 'coordinator.rejectStudent'],
  ['GET', '/approval-history', 'coordinator.getApprovalHistory'],
];

test('coordinator router registers every teammate and local endpoint exactly once', () => {
  const actual = registrations(coordinatorRouter);
  const expected = [
    'GET /dashboard', 'GET /student-batches', 'PATCH /student-batches/:id',
    'GET /events', 'POST /events', 'GET /pending-students',
    'PATCH /students/:id/approve', 'PATCH /students/:id/reject', 'GET /approval-history',
    'GET /dashboard/portal-events', 'GET /reports/events', 'GET /faculty',
    'POST /faculty/mapping', 'GET /participants', 'POST /participants',
    'POST /participants/bulk', 'GET /events/:id',
  ];
  for (const route of expected) assert.ok(actual.includes(route), 'missing ' + route);
  assert.equal(new Set(actual).size, actual.length);
});

test('approved coordinator dispatches to both batch allocation and event handlers', async () => {
  for (const [method, url, handler] of coordinatorEndpoints) {
    const result = await dispatch(coordinatorRouter, method, url, approvedUser('COORDINATOR'));
    assert.equal(result.status, 200, method + ' ' + url);
    assert.equal(result.body.handler, handler, method + ' ' + url);
    if (url.includes('/42')) assert.equal(result.body.params.id, '42');
  }
});

test('coordinator router denies every endpoint to noncoordinators', async () => {
  for (const role of ['FACULTY', 'HOD', 'ADMIN', 'STUDENT']) {
    for (const [method, url] of coordinatorEndpoints) {
      const result = await dispatch(coordinatorRouter, method, url, approvedUser(role));
      assert.equal(result.status, 403, role + ': ' + method + ' ' + url);
      assert.equal(result.body.handler, undefined);
    }
  }
});

test('coordinator and faculty routers require authentication and approved status', async () => {
  for (const [router, url, role] of [
    [coordinatorRouter, '/events', 'COORDINATOR'],
    [facultyRouter, '/events', 'FACULTY'],
  ]) {
    assert.equal((await dispatch(router, 'GET', url)).status, 401);
    const user = { ...approvedUser(role), status: 'PENDING' };
    const denied = await dispatch(router, 'GET', url, user);
    assert.equal(denied.status, 403);
    assert.equal(denied.body.handler, undefined);
  }
});

test('faculty routes contain no duplicate method/path registrations', () => {
  const actual = registrations(facultyRouter);
  assert.equal(new Set(actual).size, actual.length);
  for (const endpoint of ['GET /events/stats', 'GET /events', 'POST /events']) {
    assert.equal(actual.filter((value) => value === endpoint).length, 1, endpoint);
  }
});

test('ordinary faculty can view events and stats but cannot create events', async () => {
  for (const [url, handler] of [['/events', 'event.listEvents'], ['/events/stats', 'event.getEventStats']]) {
    const result = await dispatch(facultyRouter, 'GET', url, approvedUser('FACULTY'));
    assert.equal(result.status, 200);
    assert.equal(result.body.handler, handler);
  }
  const denied = await dispatch(facultyRouter, 'POST', '/events', approvedUser('FACULTY'));
  assert.equal(denied.status, 403);
  assert.equal(denied.body.handler, undefined);
});

test('HOD, coordinator and admin can create events through faculty routes', async () => {
  for (const role of ['HOD', 'COORDINATOR', 'ADMIN']) {
    const result = await dispatch(facultyRouter, 'POST', '/events', approvedUser(role));
    assert.equal(result.status, 200, role);
    assert.equal(result.body.handler, 'event.createEvent', role);
  }
});

test('faculty/HOD dual-role access preserves faculty dashboard and HOD event permission', async () => {
  for (const role of ['HOD', 'FACULTY']) {
    const user = approvedUser(role, ['FACULTY', 'HOD']);
    const dashboard = await dispatch(facultyRouter, 'GET', '/dashboard', user);
    assert.equal(dashboard.status, 200);
    assert.equal(dashboard.body.handler, 'faculty.getMyDashboard');
    const event = await dispatch(facultyRouter, 'POST', '/events', user);
    assert.equal(event.status, 200);
    assert.equal(event.body.handler, 'event.createEvent');
  }
});

test('student cannot read or create faculty events', async () => {
  for (const [method, url] of [['GET', '/events'], ['GET', '/events/stats'], ['POST', '/events']]) {
    const result = await dispatch(facultyRouter, method, url, approvedUser('STUDENT'));
    assert.equal(result.status, 403);
    assert.equal(result.body.handler, undefined);
  }
});
