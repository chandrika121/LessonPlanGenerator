export type PublishedContentType = "assignments" | "homework" | "assessments" | "evaluations" | "lesson_plans" | "notes";

export interface TeacherPublication {
  id: string;
  teacherId: string;
  teacherName: string;
  type: PublishedContentType;
  title: string;
  description: string;
  targetClass: string;
  publishedAt: string;
  studentCount: number;
}

const mockPublications: TeacherPublication[] = [
  {
    id: "pub-1",
    teacherId: "teacher-1",
    teacherName: "Meera Sharma",
    type: "assignments",
    title: "Classification of Matter Assignment",
    description: "Chapter 1 assignment on classification of matter, pure substances, and mixtures.",
    targetClass: "Class XI - A",
    publishedAt: "2026-06-29T09:00:00.000Z",
    studentCount: 28,
  },
  {
    id: "pub-2",
    teacherId: "teacher-1",
    teacherName: "Meera Sharma",
    type: "homework",
    title: "Significant Figures Worksheet",
    description: "Homework practice on significant figures, rounding rules, and precision in measurements.",
    targetClass: "Class XI - A",
    publishedAt: "2026-06-28T15:30:00.000Z",
    studentCount: 28,
  },
  {
    id: "pub-3",
    teacherId: "teacher-1",
    teacherName: "Meera Sharma",
    type: "assessments",
    title: "Session 1 - Matter and Measurement",
    description: "Quick assessment covering the first session on matter and measurement concepts.",
    targetClass: "Class XI - A",
    publishedAt: "2026-06-27T10:15:00.000Z",
    studentCount: 28,
  },
  {
    id: "pub-4",
    teacherId: "teacher-1",
    teacherName: "Meera Sharma",
    type: "evaluations",
    title: "Term 1 Evaluation Results",
    description: "Term 1 evaluation marks and feedback published for all students.",
    targetClass: "Class XI - A",
    publishedAt: "2026-06-26T14:00:00.000Z",
    studentCount: 28,
  },
  {
    id: "pub-5",
    teacherId: "teacher-1",
    teacherName: "Meera Sharma",
    type: "lesson_plans",
    title: "Atomic Structure - Lesson Plan",
    description: "Generated lesson plan for chapter on atomic structure and subatomic particles.",
    targetClass: "Class XI - A",
    publishedAt: "2026-06-25T11:45:00.000Z",
    studentCount: 28,
  },
  {
    id: "pub-6",
    teacherId: "teacher-1",
    teacherName: "Meera Sharma",
    type: "notes",
    title: "Matter Classification Study Notes",
    description: "Supplementary study notes shared for chapter on classification of matter.",
    targetClass: "Class XI - A",
    publishedAt: "2026-06-24T08:30:00.000Z",
    studentCount: 28,
  },
  {
    id: "pub-7",
    teacherId: "teacher-2",
    teacherName: "Arun Kumar",
    type: "assignments",
    title: "Kinematics Problem Set",
    description: "Problem set on equations of motion, velocity, and acceleration graphs.",
    targetClass: "Class XI - B",
    publishedAt: "2026-06-28T09:30:00.000Z",
    studentCount: 30,
  },
  {
    id: "pub-8",
    teacherId: "teacher-2",
    teacherName: "Arun Kumar",
    type: "assessments",
    title: "Laws of Motion Quiz",
    description: "Quick quiz on Newton's laws of motion and their applications.",
    targetClass: "Class XI - B",
    publishedAt: "2026-06-26T13:00:00.000Z",
    studentCount: 30,
  },
];

const typeLabels: Record<PublishedContentType, string> = {
  assignments: "Assignment",
  homework: "Homework",
  assessments: "Assessment",
  evaluations: "Evaluation",
  lesson_plans: "Lesson Plan",
  notes: "Study Notes",
};

const typeIcons: Record<PublishedContentType, string> = {
  assignments: "📝",
  homework: "📚",
  assessments: "📋",
  evaluations: "✅",
  lesson_plans: "📖",
  notes: "📓",
};

export function getTeacherPublications(): TeacherPublication[] {
  return [...mockPublications];
}

export function getPublicationsByTeacher(teacherName: string): TeacherPublication[] {
  return mockPublications.filter((p) => p.teacherName === teacherName);
}

export function getPublicationsByType(type: PublishedContentType): TeacherPublication[] {
  return mockPublications.filter((p) => p.type === type);
}

export function getTypeLabel(type: PublishedContentType): string {
  return typeLabels[type];
}

export function getTypeIcon(type: PublishedContentType): string {
  return typeIcons[type];
}

export function getPublishedTypeSummary() {
  const summary: Record<PublishedContentType, number> = {
    assignments: 0,
    homework: 0,
    assessments: 0,
    evaluations: 0,
    lesson_plans: 0,
    notes: 0,
  };
  mockPublications.forEach((pub) => {
    summary[pub.type] = (summary[pub.type] || 0) + 1;
  });
  return summary;
}

export function getTeacherSummary() {
  const teacherMap = new Map<string, { teacherName: string; publications: number; types: Set<PublishedContentType> }>();
  mockPublications.forEach((pub) => {
    const existing = teacherMap.get(pub.teacherId) || {
      teacherName: pub.teacherName,
      publications: 0,
      types: new Set<PublishedContentType>(),
    };
    existing.publications += 1;
    existing.types.add(pub.type);
    teacherMap.set(pub.teacherId, existing);
  });
  return Array.from(teacherMap.values());
}