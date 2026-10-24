/**
 * Event Controller
 * Handles campus events management with role-based access control.
 * Preserves database integrity without schema changes.
 */

let eventsStore = [
  {
    id: "EVT-2025-001",
    name: "Technical Symposium 2025",
    type: "Symposium",
    department: "Computer Engineering",
    venue: "Main Auditorium",
    startDate: "2025-09-15",
    endDate: "2025-09-16",
    startTime: "09:00 AM",
    endTime: "05:00 PM",
    status: "Upcoming",
    registeredCount: 142,
    maxParticipants: 250,
    registrationDeadline: "2025-09-10",
    description: "Annual technical symposium featuring keynote lectures, hackathons, and robotics demonstrations.",
    createdBy: "admin-seed",
    createdByName: "Administrator",
    createdByRole: "ADMIN",
    createdAt: new Date("2025-01-10").toISOString(),
  },
  {
    id: "EVT-2025-002",
    name: "National Coding Contest",
    type: "Competition",
    department: "Information Technology",
    venue: "Computer Lab 3 & 4",
    startDate: "2025-10-02",
    endDate: "2025-10-02",
    startTime: "10:00 AM",
    endTime: "04:00 PM",
    status: "Upcoming",
    registeredCount: 88,
    maxParticipants: 120,
    registrationDeadline: "2025-09-28",
    description: "Competitive programming contest open to undergraduate engineering students nationwide.",
    createdBy: "admin-seed",
    createdByName: "Administrator",
    createdByRole: "ADMIN",
    createdAt: new Date("2025-01-15").toISOString(),
  },
  {
    id: "EVT-2025-003",
    name: "Annual Sports Day 2025",
    type: "Sports",
    department: "All Departments",
    venue: "College Sports Ground",
    startDate: "2025-11-20",
    endDate: "2025-11-21",
    startTime: "08:00 AM",
    endTime: "06:00 PM",
    status: "Upcoming",
    registeredCount: 310,
    maxParticipants: 500,
    registrationDeadline: "2025-11-15",
    description: "College-wide track & field events, football, basketball, and indoor gaming tournaments.",
    createdBy: "admin-seed",
    createdByName: "Administrator",
    createdByRole: "ADMIN",
    createdAt: new Date("2025-02-01").toISOString(),
  },
  {
    id: "EVT-2025-004",
    name: "AI & Generative Models Workshop",
    type: "Workshop",
    department: "AI & Data Science",
    venue: "Seminar Hall B",
    startDate: "2025-08-10",
    endDate: "2025-08-11",
    startTime: "10:00 AM",
    endTime: "03:00 PM",
    status: "Completed",
    registeredCount: 65,
    maxParticipants: 75,
    registrationDeadline: "2025-08-05",
    description: "Hands-on bootcamp on Large Language Models, Diffusion Architectures, and production deployment.",
    createdBy: "admin-seed",
    createdByName: "Administrator",
    createdByRole: "ADMIN",
    createdAt: new Date("2025-02-15").toISOString(),
  },
];

// ─── List Events ─────────────────────────────────────────────────────────────
exports.listEvents = async (req, res, next) => {
  try {
    const { type, status, search } = req.query;
    let filtered = [...eventsStore];

    if (type && type !== "All") {
      filtered = filtered.filter(
        (e) => e.type?.toLowerCase() === type.toLowerCase()
      );
    }
    if (status && status !== "All") {
      filtered = filtered.filter(
        (e) => e.status?.toLowerCase() === status.toLowerCase()
      );
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name?.toLowerCase().includes(q) ||
          e.department?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q)
      );
    }

    return res.json({
      success: true,
      count: filtered.length,
      events: filtered,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Event Statistics ────────────────────────────────────────────────────
exports.getEventStats = async (req, res, next) => {
  try {
    const totalEvents = eventsStore.length;
    const upcomingEvents = eventsStore.filter(
      (e) => e.status?.toLowerCase() === "upcoming"
    ).length;
    const completedEvents = eventsStore.filter(
      (e) => e.status?.toLowerCase() === "completed"
    ).length;
    const totalParticipants = eventsStore.reduce(
      (sum, e) => sum + (e.registeredCount || 0),
      0
    );

    return res.json({
      success: true,
      stats: {
        totalEvents,
        upcomingEvents,
        completedEvents,
        totalParticipants,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Event Details ───────────────────────────────────────────────────────
exports.getEventById = async (req, res, next) => {
  try {
    const event = eventsStore.find((e) => e.id === req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    return res.json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Create Event (Authorized roles: ADMIN, HOD, COORDINATOR) ───────────────
exports.createEvent = async (req, res, next) => {
  try {
    const {
      name,
      type = "Conference",
      description = "",
      banner = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
      venue = "",
      startDate,
      endDate,
      dateTime,
      startTime = "10:00 AM",
      endTime = "05:00 PM",
      maxParticipants = 200,
      registrationStartDate,
      registrationDeadline,
      department = "Computer Engineering",
      academicYear = "2024 - 2025",
      semester = "Semester 6",
      status = "Upcoming",
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Event name is required",
      });
    }

    const eventId = `EVT-2025-${String(eventsStore.length + 1).padStart(3, "0")}`;

    const newEvent = {
      id: eventId,
      name: name.trim(),
      type,
      description,
      banner,
      venue,
      startDate: startDate || (dateTime ? dateTime.split(",")[0] : new Date().toISOString().split("T")[0]),
      endDate: endDate || startDate || new Date().toISOString().split("T")[0],
      startTime,
      endTime,
      maxParticipants: Number(maxParticipants) || 100,
      registeredCount: 0,
      registrationStartDate: registrationStartDate || null,
      registrationDeadline: registrationDeadline || null,
      department,
      academicYear,
      semester,
      status,
      assignedFaculty: [],
      attendanceStats: { present: 0, absent: 0, notMarked: 0, rate: 0 },
      createdBy: req.user?.id || "unknown",
      createdByName: req.user?.name || "Event Coordinator",
      createdByRole: req.user?.role || "COORDINATOR",
      createdAt: new Date().toISOString(),
    };

    eventsStore.unshift(newEvent);

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (error) {
    next(error);
  }
};
