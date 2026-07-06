import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, PlusCircle, Trash2, UserRoundCog, Users } from "lucide-react";
import { ChartCard } from "../../components/ChartCard";
import {
  assignUsersToClass,
  deletePrincipalClass,
  getClassDetails,
  removeStudentFromClass,
  removeTeacherFromClass,
  searchClassUsers,
  updateClassTeacherAssignment,
} from "../../services/principalServiceApi";
import type { PrincipalClassDetail, PrincipalClassUserSearchResult } from "../../services/principalServiceApi";

function formatDate(value: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function toSafeNumber(value: unknown, fallback = 0) {
  const next = typeof value === "number" ? value : Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function expandRouteParamCandidates(value: string) {
  const candidates: string[] = [];
  let current = String(value || "").trim();
  if (!current) return candidates;

  for (let index = 0; index < 3; index += 1) {
    if (current && !candidates.includes(current)) {
      candidates.push(current);
    }
    try {
      const next = decodeURIComponent(current);
      if (!next || next === current) {
        break;
      }
      current = next;
    } catch {
      break;
    }
  }

  return candidates;
}

export function ClassDetailPage() {
  const { className: classKey } = useParams<{ className: string }>();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<PrincipalClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [userRole, setUserRole] = useState<"teacher" | "student">("student");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PrincipalClassUserSearchResult[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const loadClass = async () => {
    if (!classKey) return;
    let lastError: unknown = null;
    for (const candidate of expandRouteParamCandidates(classKey)) {
      try {
        const item = await getClassDetails(candidate);
        setClassData(item);
        setSelectedSubjects(item.subjectDetails[0]?.subject ? [item.subjectDetails[0].subject] : []);
        return;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("Unable to load class details");
  };

  useEffect(() => {
    loadClass()
      .catch(() => setClassData(null))
      .finally(() => setLoading(false));
  }, [classKey]);

  useEffect(() => {
    if (!showAddUser || !classKey) return;
    const timer = setTimeout(() => {
      const candidates = expandRouteParamCandidates(classKey);
      const runSearch = async () => {
        let lastError: unknown = null;
        for (const candidate of candidates) {
          try {
            return await searchClassUsers(candidate, { q: search, role: userRole });
          } catch (error) {
            lastError = error;
          }
        }
        throw lastError || new Error("Unable to search class users");
      };

      runSearch()
        .then((fetchedResults) => {
          const filtered = fetchedResults.filter((user) => {
            const matchesRole = String(user.role || "").toLowerCase() === userRole.toLowerCase();
            const matchesSearch = !search.trim()
              || String(user.name || "").toLowerCase().includes(search.toLowerCase())
              || String(user.email || "").toLowerCase().includes(search.toLowerCase())
              || String(user.rollNo || user.employeeId || "").toLowerCase().includes(search.toLowerCase());
            return matchesRole && matchesSearch;
          });
          setResults(filtered);
        })
        .catch(() => setResults([]));
    }, 150);
    return () => clearTimeout(timer);
  }, [classKey, search, showAddUser, userRole]);

  const subjectOptions = useMemo(() => Array.from(new Set((classData?.subjectDetails || []).map((item) => item.subject))), [classData]);

  if (loading) {
    return <div className="flex items-center justify-center py-32"><div className="flex items-center gap-3 rounded-2xl bg-white/90 px-6 py-4 shadow-lg"><div className="h-5 w-5 animate-spin rounded-full border-2 border-[#36ADAA] border-t-transparent" /><span className="text-sm font-semibold text-slate-600">Loading class details...</span></div></div>;
  }

  if (!classData) {
    return <div className="rounded-[30px] border border-white/80 bg-white/90 px-8 py-14 text-center shadow-[0_24px_60px_rgba(15,23,42,0.06)]"><p className="text-lg font-bold text-slate-800">Class not found</p></div>;
  }

  return (
    <div className="space-y-6 animate-[fadeInUp_0.4s_ease-out]">
      <button type="button" onClick={() => navigate("/principal/classes")} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"><ArrowLeft className="h-4 w-4" />Back to Classes</button>

      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#36ADAA]">{classData.section ? `Section ${classData.section}` : "Class Overview"}</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-slate-900">{classData.className}</h2>
            <p className="mt-2 text-sm text-slate-500">Academic Year: {classData.academicYear || "Unavailable"}</p>
            <p className="mt-1 text-sm text-slate-600">Class Teacher: <span className="font-bold text-slate-900">{classData.classTeacher || "Not assigned"}</span></p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                const confirmed = window.confirm(`Delete ${classData.className}${classData.section ? ` - Section ${classData.section}` : ""}? This will remove the class record, linked allocations, linked workspace data, and clear enrolled students from this class.`);
                if (!confirmed) return;
                setBusy(true);
                try {
                  await deletePrincipalClass(classData.classKey);
                  navigate("/principal/classes");
                } finally {
                  setBusy(false);
                }
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete Class
            </button>
            <button type="button" onClick={() => setShowAddUser(true)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800"><PlusCircle className="h-4 w-4" />Add User</button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-2xl bg-slate-50 p-4 text-center"><p className="text-2xl font-extrabold text-slate-900">{toSafeNumber(classData.students)}</p><p className="mt-1 text-xs font-bold text-slate-500">Students</p></div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center"><p className="text-2xl font-extrabold text-slate-900">{toSafeNumber(classData.totalTeachers)}</p><p className="mt-1 text-xs font-bold text-slate-500">Teachers</p></div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center"><p className="text-2xl font-extrabold text-slate-900">{toSafeNumber(classData.subjects)}</p><p className="mt-1 text-xs font-bold text-slate-500">Subjects</p></div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center"><p className="text-2xl font-extrabold text-slate-900">{toSafeNumber(classData.sessionsGenerated)}</p><p className="mt-1 text-xs font-bold text-slate-500">Sessions</p></div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center"><p className="text-2xl font-extrabold text-slate-900">{toSafeNumber(classData.submissionRate)}%</p><p className="mt-1 text-xs font-bold text-slate-500">Submission Rate</p></div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center"><p className="text-2xl font-extrabold text-slate-900">{toSafeNumber(classData.averageClassPerformance)}%</p><p className="mt-1 text-xs font-bold text-slate-500">Average Performance</p></div>
        </div>
      </div>

      <ChartCard title="Subjects" subtitle="Open any subject for teacher and student activity details" icon={<BookOpen className="h-5 w-5" />}>
        <div className="grid gap-4 lg:grid-cols-2">
          {classData.subjectDetails.map((subjectItem) => (
            <button key={subjectItem.subjectKey} type="button" onClick={() => navigate(`/principal/classes/${encodeURIComponent(classData.classKey)}/subjects/${encodeURIComponent(subjectItem.subjectKey)}`)} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-[#36ADAA]/30 hover:bg-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">{subjectItem.subject}</h3>
                  <p className="mt-1 text-sm text-slate-500">Teacher: {subjectItem.teacher || "Unassigned"}</p>
                </div>
                <span className="rounded-full bg-[#36ADAA]/10 px-3 py-1 text-[11px] font-bold text-[#36ADAA]">{subjectItem.curriculumProgress}% progress</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-600">
                <div>Students: <span className="font-bold text-slate-900">{subjectItem.studentCount}</span></div>
                <div>Terms: <span className="font-bold text-slate-900">{subjectItem.terms}</span></div>
                <div>Sessions: <span className="font-bold text-slate-900">{subjectItem.sessionsGenerated}</span></div>
                <div>Pending: <span className="font-bold text-slate-900">{subjectItem.pendingSessions}</span></div>
                <div>Homework: <span className="font-bold text-slate-900">{subjectItem.homework}</span></div>
                <div>Assessments: <span className="font-bold text-slate-900">{subjectItem.assessments}</span></div>
                <div>Avg Marks: <span className="font-bold text-slate-900">{subjectItem.averageMarks}%</span></div>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">Last updated: {formatDate(subjectItem.lastUpdated)}</p>
            </button>
          ))}
        </div>
      </ChartCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Teachers" subtitle="Assigned class faculty and subject ownership" icon={<UserRoundCog className="h-5 w-5" />}>
          <div className="space-y-3">
            {classData.teacherRoster.map((teacher) => (
              <div key={teacher.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{teacher.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{teacher.email || "No email"}</p>
                    <p className="mt-1 text-xs text-slate-500">Subjects: {(teacher.subjects || []).join(", ") || "None"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={async () => { const input = window.prompt("Enter comma-separated subjects", (teacher.subjects || []).join(", ")); if (input == null) return; setBusy(true); try { const next = await updateClassTeacherAssignment(classData.classKey, teacher.id, input.split(",").map((item) => item.trim()).filter(Boolean)); setClassData(next); } finally { setBusy(false); } }} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50" disabled={busy}>Change Subjects</button>
                    <button type="button" onClick={async () => { setBusy(true); try { const next = await removeTeacherFromClass(classData.classKey, teacher.id); setClassData(next); } finally { setBusy(false); } }} className="rounded-2xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50" disabled={busy}><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Students" subtitle="Current class roster and enrollment status" icon={<Users className="h-5 w-5" />}>
          <div className="mb-3">
            <input
              value={studentSearch}
              onChange={(event) => setStudentSearch(event.target.value)}
              placeholder="Search students by name..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none"
            />
          </div>
          <div className="space-y-3">
            {classData.studentRoster
              .filter((student) => {
                const query = studentSearch.trim().toLowerCase();
                if (!query) return true;
                return String(student.name || "").toLowerCase().includes(query) ||
                       String(student.rollNo || "").toLowerCase().includes(query) ||
                       String(student.email || "").toLowerCase().includes(query);
              })
              .map((student) => (
              <div key={student.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{student.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{student.rollNo || "No roll number"} • {student.email || "No email"}</p>
                  </div>
                  <button type="button" onClick={async () => { setBusy(true); try { const next = await removeStudentFromClass(classData.classKey, student.id); setClassData(next); } finally { setBusy(false); } }} className="rounded-2xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50" disabled={busy}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {showAddUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-[30px] border border-white/80 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div><h3 className="font-display text-xl font-extrabold text-slate-900">Add Users to {classData.className}</h3><p className="mt-1 text-sm text-slate-500">Search by name, email, employee ID, or roll number.</p></div>
              <button type="button" onClick={() => { setShowAddUser(false); setSelectedUserIds([]); setSearch(""); }} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600">Close</button>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Start typing to search..." className="min-w-[260px] flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none" />
              <select value={userRole} onChange={(event) => { setUserRole(event.target.value as "teacher" | "student"); setSelectedUserIds([]); setSelectedSubjects([]); }} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"><option value="student">Student</option><option value="teacher">Teacher</option></select>
            </div>
            {userRole === "teacher" ? (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Subjects</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {subjectOptions.map((item) => {
                    const checked = selectedSubjects.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setSelectedSubjects((prev) => checked ? prev.filter((entry) => entry !== item) : [...prev, item])}
                        className={`rounded-full px-3 py-1 text-xs font-bold transition ${checked ? "bg-[#36ADAA] text-white" : "border border-slate-200 bg-white text-slate-600"}`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <div className="mt-5 space-y-3">
              {results.map((item) => {
                const selected = selectedUserIds.includes(item.id);
                return (
                  <button key={item.id} type="button" onClick={() => setSelectedUserIds((prev) => selected ? prev.filter((entry) => entry !== item.id) : [...prev, item.id])} className={`flex w-full items-start justify-between rounded-2xl border p-4 text-left transition ${selected ? "border-[#36ADAA] bg-[#36ADAA]/5" : "border-slate-200 bg-slate-50"}`}>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.email}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.role === "teacher" ? item.employeeId || "No employee ID" : item.rollNo || "No roll number"}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{item.currentClass || "Unassigned"}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowAddUser(false)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700">Cancel</button>
              <button type="button" disabled={busy || selectedUserIds.length === 0} onClick={async () => { setBusy(true); try { const next = await assignUsersToClass({ classKey: classData.classKey, role: userRole, userIds: selectedUserIds, subject: userRole === "teacher" ? selectedSubjects[0] : undefined, subjects: userRole === "teacher" ? selectedSubjects : undefined }); setClassData(next); setShowAddUser(false); setSelectedUserIds([]); setSearch(""); setSelectedSubjects([]); } finally { setBusy(false); } }} className="rounded-2xl bg-[#36ADAA] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#36ADAA]/25 disabled:opacity-50">Assign Selected Users</button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
