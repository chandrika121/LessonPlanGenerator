import { CheckSquare2, Search, Square, Upload } from "lucide-react";
import type { EvaluationStudent } from "../services/evaluationService";

function statusLabel(status: EvaluationStudent["uploadStatus"]) {
  switch (status) {
    case "uploaded":
      return "Uploaded";
    case "already_available":
      return "Already available";
    default:
      return "Not uploaded";
  }
}

function statusClass(status: EvaluationStudent["uploadStatus"]) {
  switch (status) {
    case "uploaded":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "already_available":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-50 text-slate-500 border-slate-200";
  }
}

export function StudentSelector({
  students,
  selectedStudentIds,
  search,
  onSearchChange,
  onToggleStudent,
  onSelectAll,
}: {
  students: EvaluationStudent[];
  selectedStudentIds: string[];
  search: string;
  onSearchChange: (value: string) => void;
  onToggleStudent: (studentId: string) => void;
  onSelectAll: () => void;
}) {
  const filteredStudents = students.filter((student) => {
    const value = search.trim().toLowerCase();
    if (!value) return true;
    return [student.name, student.rollNo, student.className].some((field) => field.toLowerCase().includes(value));
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Students</p>
            <h3 className="mt-2 font-display text-2xl font-extrabold text-slate-900">Choose who to evaluate</h3>
          </div>
          <button type="button" onClick={onSelectAll} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
            <CheckSquare2 className="h-4 w-4 text-[#36ADAA]" />
            Select all visible
          </button>
        </div>

        <label className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search students by name, class, or roll number"
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="mt-5 grid gap-3">
          {filteredStudents.map((student) => {
            const selected = selectedStudentIds.includes(student.id);
            return (
              <button
                key={student.id}
                type="button"
                onClick={() => onToggleStudent(student.id)}
                className={[
                  "rounded-2xl border px-4 py-4 text-left transition",
                  selected ? "border-[#36ADAA]/35 bg-[#36ADAA]/8" : "border-slate-100 bg-slate-50 hover:border-slate-200",
                ].join(" ")}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5 text-[#36ADAA]">
                      {selected ? <CheckSquare2 className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-800">{student.name}</div>
                      <div className="mt-1 text-sm text-slate-500">{student.className} • Roll No. {student.rollNo}</div>
                      {student.answerResponsePreview ? (
                        <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-500">
                          <span className="font-semibold text-slate-700">
                            {student.answerResponseSource === "student_upload" ? "Student upload:" : "Teacher upload:"}
                          </span>{" "}
                          {student.answerResponsePreview}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(student.uploadStatus)}`}>
                      {statusLabel(student.uploadStatus)}
                    </span>
                    {student.fileName ? <span className="text-xs text-slate-500">{student.fileName}</span> : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Selection Summary</p>
        <h3 className="mt-2 font-display text-2xl font-extrabold text-slate-900">Upload readiness</h3>
        <div className="mt-6 space-y-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-4">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Selected students</div>
            <div className="mt-2 font-display text-3xl font-extrabold text-slate-900">{selectedStudentIds.length}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-4">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Already uploaded</div>
            <div className="mt-2 font-display text-3xl font-extrabold text-slate-900">
              {students.filter((student) => selectedStudentIds.includes(student.id) && student.uploadStatus !== "not_uploaded").length}
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-[#36ADAA]/30 bg-[#36ADAA]/6 px-4 py-4 text-sm text-slate-600">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Upload className="h-4 w-4 text-[#36ADAA]" />
              Uploads stay per selected student
            </div>
            <p className="mt-2">Move to the next step to attach PDFs for each student before running AI evaluation.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
