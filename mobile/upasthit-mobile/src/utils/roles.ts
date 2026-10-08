import { AuthUser } from '@/utils/storage';

export const ROLE_LABELS: Record<AuthUser['role'], string> = {
  ADMIN: 'Administrator',
  STUDENT: 'Student',
  FACULTY: 'Faculty',
  HOD: 'Head of Department',
  COORDINATOR: 'Coordinator',
};

export const ROLE_FEATURES: Record<AuthUser['role'], string[]> = {
  ADMIN: ['User management', 'Create HOD', 'Create faculty'],
  STUDENT: ['Attendance', 'Leave', 'Assignments'],
  FACULTY: ['Mark attendance', 'Students', 'Assignments'],
  HOD: ['Faculty reports', 'Analytics', 'Departments'],
  COORDINATOR: ['Timetable', 'Faculty', 'Subjects'],
};
