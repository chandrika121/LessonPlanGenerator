import mongoose, { Model, Schema } from "mongoose";

const HomeworkSubmissionSchema = new Schema(
  {
    schoolId: { type: String, default: "", index: true },
    studentId: { type: String, default: "", index: true },
    classId: { type: String, default: "", index: true },
    teacherId: { type: String, default: "", index: true },
    homeworkId: { type: String, default: "", index: true },
    subject: { type: String, default: "", index: true },
    title: { type: String, default: "" },
    fileName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    fileDataUrl: { type: String, default: "" },
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
HomeworkSubmissionSchema.index(
  { schoolId: 1, teacherId: 1, classId: 1, subjectId: 1, termId: 1, sessionId: 1 },
  { name: "homework_submission_teacher_isolation" }
);

// Composite index for student queries
HomeworkSubmissionSchema.index(
  { schoolId: 1, studentId: 1, homeworkId: 1 },
  { name: "homework_submission_student_lookup" }
);

export const HomeworkSubmissionModel: Model<any> =
  mongoose.models.HomeworkSubmission || mongoose.model("HomeworkSubmission", HomeworkSubmissionSchema);