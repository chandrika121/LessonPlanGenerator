import mongoose, { Model, Schema } from "mongoose";

const AssignmentSubmissionSchema = new Schema(
  {
    schoolId: { type: String, default: "", index: true },
    studentId: { type: String, default: "", index: true },
    classId: { type: String, default: "", index: true },
    teacherId: { type: String, default: "", index: true },
    assignmentId: { type: String, default: "", index: true },
    subject: { type: String, default: "", index: true },
    title: { type: String, default: "" },
    fileName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    fileDataUrl: { type: String, default: "" },
    submissionType: { type: String, default: "assignment" },
    status: { type: String, default: "submitted" },
    // Ownership fields for isolation
    academicYear: { type: String, default: "", index: true },
    sectionId: { type: String, default: "", index: true },
    subjectId: { type: String, default: "", index: true },
    termId: { type: String, default: "", index: true },
    sessionId: { type: String, default: "", index: true },
    curriculumId: { type: String, default: "", index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Composite index for teacher isolation
AssignmentSubmissionSchema.index(
  { schoolId: 1, teacherId: 1, classId: 1, subjectId: 1, termId: 1, sessionId: 1 },
  { name: "assignment_submission_teacher_isolation" }
);

// Composite index for student queries
AssignmentSubmissionSchema.index(
  { schoolId: 1, studentId: 1, assignmentId: 1, submissionType: 1 },
  { name: "assignment_submission_student_lookup" }
);

export const AssignmentSubmissionModel: Model<any> =
  mongoose.models.AssignmentSubmission || mongoose.model("AssignmentSubmission", AssignmentSubmissionSchema);