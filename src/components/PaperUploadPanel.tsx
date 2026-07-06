import { CheckCircle2, FileUp, LoaderCircle } from "lucide-react";
import type { EvaluationStudent } from "../services/evaluationService";

function pillClass(status: EvaluationStudent["uploadStatus"]) {
  switch (status) {
    case "uploaded":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "already_available":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-500";
  }
}

export function PaperUploadPanel({
  students,
  uploadingStudentId,
  onUpload,
}: {
  students: EvaluationStudent[];
  uploadingStudentId: string | null;
  onUpload: (studentId: string, file: File) => void;
}) {
  return (
    <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Upload Papers</p>
      <h3 className="mt-2 font-display text-2xl font-extrabold text-slate-900">Attach student answer sheets</h3>
      <p className="mt-2 text-sm text-slate-500">Each selected student can have a PDF attached or reused from an already-available file.</p>

      <div className="mt-6 grid gap-4">
        {students.map((student) => (
          <div key={student.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-base font-bold text-slate-800">{student.name}</div>
                <div className="mt-1 text-sm text-slate-500">{student.className} • Roll No. {student.rollNo}</div>
                {student.fileName ? <div className="mt-2 text-xs text-slate-500">File: {student.fileName}</div> : null}
                {student.answerResponseSource ? (
                  <div className="mt-1 text-xs text-slate-500">
                    Source: {student.answerResponseSource === "student_upload" ? "Student login upload" : "Teacher upload"}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${pillClass(student.uploadStatus)}`}>
                  {student.uploadStatus === "not_uploaded" ? "Not uploaded" : student.uploadStatus === "uploaded" ? "Uploaded" : "Already available"}
                </span>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[#36ADAA] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#36ADAA]/25 transition hover:bg-[#2e9d9a]">
                  {uploadingStudentId === student.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                  Upload PDF
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) onUpload(student.id, file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-4 w-4" />
          Upload status is tracked per student
        </div>
        <p className="mt-2">Students with already-available files can go straight into AI evaluation without needing a fresh upload.</p>
      </div>
    </div>
  );
}
