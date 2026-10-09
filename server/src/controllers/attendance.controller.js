const attendanceService = require("../services/attendance.service");

function handleAttendanceError(error, next, res) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      session: error.session || undefined,
    });
  }
  return next(error);
}

exports.getFacultyAssignments = async (req, res, next) => {
  try {
    const data = await attendanceService.listFacultyAssignments(req.user.id);
    return res.json({ success: true, ...data });
  } catch (error) {
    return handleAttendanceError(error, next, res);
  }
};

exports.getEligibleStudents = async (req, res, next) => {
  try {
    const { assignmentId, division } = req.query;
    const data = await attendanceService.listEligibleStudents(req.user.id, {
      assignmentId,
      division,
    });
    return res.json({ success: true, ...data });
  } catch (error) {
    return handleAttendanceError(error, next, res);
  }
};

exports.getClassStudents = async (req, res, next) => {
  try {
    const { year, semester, division, department, academicYear, assignmentId } = req.query;
    const data = await attendanceService.listClassStudents(req.user.id, {
      year,
      semester,
      division,
      department,
      academicYear,
      assignmentId,
    });
    return res.json({ success: true, ...data });
  } catch (error) {
    return handleAttendanceError(error, next, res);
  }
};

exports.createSession = async (req, res, next) => {
  try {
    const session = await attendanceService.createSession(req.user.id, req.body || {});
    return res.status(201).json({ success: true, session });
  } catch (error) {
    return handleAttendanceError(error, next, res);
  }
};

exports.startSession = async (req, res, next) => {
  try {
    const session = await attendanceService.startSession(req.user.id, req.params.id);
    return res.json({ success: true, session });
  } catch (error) {
    return handleAttendanceError(error, next, res);
  }
};

exports.getActiveSession = async (req, res, next) => {
  try {
    const session = await attendanceService.getActiveSession(req.user.id);
    return res.json({ success: true, session });
  } catch (error) {
    return handleAttendanceError(error, next, res);
  }
};

exports.getSession = async (req, res, next) => {
  try {
    const session = await attendanceService.getSession(req.user.id, req.params.id);
    return res.json({ success: true, session });
  } catch (error) {
    return handleAttendanceError(error, next, res);
  }
};

exports.getSessionStudents = async (req, res, next) => {
  try {
    const data = await attendanceService.getSessionStudents(req.user.id, req.params.id);
    return res.json({ success: true, ...data });
  } catch (error) {
    return handleAttendanceError(error, next, res);
  }
};

exports.saveRecords = async (req, res, next) => {
  try {
    const session = await attendanceService.saveRecords(
      req.user.id,
      req.params.id,
      req.body?.records || []
    );
    return res.json({ success: true, message: "Attendance saved successfully", session });
  } catch (error) {
    return handleAttendanceError(error, next, res);
  }
};

exports.completeSession = async (req, res, next) => {
  try {
    const session = await attendanceService.completeSession(req.user.id, req.params.id);
    return res.json({ success: true, message: "Attendance session completed", session });
  } catch (error) {
    return handleAttendanceError(error, next, res);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const data = await attendanceService.listHistory(req.user.id, req.query || {});
    return res.json({ success: true, ...data });
  } catch (error) {
    return handleAttendanceError(error, next, res);
  }
};

exports.getSessionSummary = async (req, res, next) => {
  try {
    const session = await attendanceService.getSession(req.user.id, req.params.id);
    return res.json({ success: true, session, stats: session.stats });
  } catch (error) {
    return handleAttendanceError(error, next, res);
  }
};
