/**
 * Teacher Isolation Middleware
 * 
 * Provides helper functions to enforce teacher-wise ownership and isolation
 * across all backend APIs. Every teacher-scoped query must use these helpers
 * to ensure data isolation.
 */

import { Request, Response } from "express";
import { UserModel } from "../models/User";
import { TeacherClassAllocationModel } from "../models/TeacherClassAssignment";

/**
 * Extract authenticated user info from request.
 * In production, this would come from JWT/session.
 * Currently uses query params with user lookup fallback.
 */
export async function resolveAuthenticatedUser(req: Request, res: Response) {
  const userId = String(req.query.userId || req.body?.userId || "").trim();
  const schoolId = String(req.query.schoolId || req.body?.schoolId || "").trim();
  const role = String(req.query.role || req.body?.role || "").trim().toLowerCase();

  if (!userId) {
    return null;
  }

  // Try to look up user for definitive role/schoolId
  try {
    const user = await UserModel.findById(userId).lean();
    if (user) {
      return {
        id: String(user._id),
        name: String(user.name || ""),
        email: String(user.email || ""),
        role: String(user.role || "").toLowerCase(),
        schoolId: String(user.schoolId || schoolId || ""),
        classId: String(user.classId || ""),
        section: String(user.section || ""),
        subjectIds: Array.isArray(user.subjectIds) ? user.subjectIds.map(String) : [],
        subjects: Array.isArray(user.subjects) ? user.subjects.map(String) : [],
      };
    }
  } catch {
    // Fall through
  }

  // Fallback to provided params
  return {
    id: userId,
    name: "",
    email: "",
    role,
    schoolId,
    classId: "",
    section: "",
    subjectIds: [],
    subjects: [],
  };
}

/**
 * Build teacher-scoped query filter.
 * For teachers: filters by schoolId + teacherId
 * For principals: filters by schoolId only (no teacherId filter)
 * For students: filters by schoolId + classId/sectionId
 */
export function buildTeacherQueryFilter(user: {
  id: string;
  role: string;
  schoolId: string;
  classId?: string;
  section?: string;
}): Record<string, unknown> {
  const filter: Record<string, unknown> = {};

  if (user.schoolId) {
    filter.schoolId = user.schoolId;
  }

  if (user.role === "teacher") {
    filter.teacherId = user.id;
  }
  // Principal: no teacherId filter
  // Student: no teacherId filter

  return filter;
}

/**
 * Build student-scoped query filter for published content.
 */
export function buildStudentQueryFilter(user: {
  id: string;
  role: string;
  schoolId: string;
  classId?: string;
  section?: string;
}): Record<string, unknown> {
  const filter: Record<string, unknown> = {};

  if (user.schoolId) {
    filter.schoolId = user.schoolId;
  }

  if (user.classId) {
    filter.classId = user.classId;
  }

  if (user.section) {
    filter.sectionId = user.section;
  }

  filter.status = "published";

  return filter;
}

/**
 * Validate that a teacher is assigned to the given class/section/subject.
 * Returns the allocation if valid, or null if not assigned.
 */
export async function validateTeacherAllocation(input: {
  schoolId: string;
  teacherId: string;
  classId?: string;
  section?: string;
  subjectId?: string;
  academicYear?: string;
}) {
  const { schoolId, teacherId, classId, section, subjectId, academicYear } = input;

  if (!schoolId || !teacherId) {
    return { valid: false, error: "School ID and Teacher ID are required." };
  }

  const query: Record<string, unknown> = {
    schoolId,
    teacherId,
    status: "published",
  };

  if (classId) query.classId = classId;
  if (section) query.section = section;
  if (academicYear) query.academicYear = academicYear;

  const allocations = await TeacherClassAllocationModel.find(query).lean();

  if (!allocations || allocations.length === 0) {
    return {
      valid: false,
      error: "You are not assigned to this class/section/subject.",
    };
  }

  // If subjectId is specified, check if any allocation includes it
  if (subjectId) {
    const hasSubject = allocations.some((alloc: any) => {
      const subjectIds = Array.isArray(alloc.subjectIds) ? alloc.subjectIds : [];
      const subjects = Array.isArray(alloc.subjects) ? alloc.subjects : [];
      return subjectIds.includes(subjectId) || subjects.includes(subjectId);
    });

    if (!hasSubject) {
      return {
        valid: false,
        error: "You are not assigned to this class/section/subject.",
      };
    }
  }

  return { valid: true, allocations };
}

/**
 * Debug log helper for teacher API queries.
 */
export function logTeacherQuery(
  label: string,
  user: { id: string; schoolId: string; role: string },
  filter: Record<string, unknown>,
  results: any[]
) {
  console.log(`[TeacherIsolation][${label}]`, {
    loggedInTeacherId: user.id,
    schoolId: user.schoolId,
    role: user.role,
    queryFilter: filter,
    recordsReturnedCount: results.length,
    groupedBySubjectId: groupBy(results, "subjectId"),
  });
}

/**
 * Debug log helper for student API queries.
 */
export function logStudentQuery(
  label: string,
  user: { id: string; classId?: string; section?: string },
  subjects: any[],
  contentBySubject: Record<string, number>
) {
  console.log(`[StudentIsolation][${label}]`, {
    studentId: user.id,
    classId: user.classId,
    sectionId: user.section,
    subjectsReturned: subjects.length,
    contentCountBySubjectTermSession: contentBySubject,
  });
}

/**
 * Debug log helper for principal API queries.
 */
export function logPrincipalQuery(
  label: string,
  user: { id: string; schoolId: string; role: string },
  stats: Record<string, unknown>
) {
  console.log(`[PrincipalIsolation][${label}]`, {
    role: user.role,
    schoolId: user.schoolId,
    ...stats,
  });
}

function groupBy(items: any[], key: string): Record<string, number> {
  return (items || []).reduce((acc: Record<string, number>, item: any) => {
    const value = String(item?.[key] || "unknown");
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}