import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { SearchToolbar } from "../../components/SearchToolbar";
import { deletePrincipalUser, getClassAllocations, getTeachers } from "../../services/principalServiceApi";
import type { PrincipalClassAllocation, TeacherSummary } from "../../services/principalServiceApi";

function formatClassLabel(className: string, section: string) {
  const base = className.replace(/^Class\s+/i, "").trim();
  if (!section) return base;
  return `${base} - Section ${section.toUpperCase()}`;
}

export function TeachersPage() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<TeacherSummary[]>([]);
  const [allocations, setAllocations] = useState<PrincipalClassAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Offline">("All");
  const [sortBy, setSortBy] = useState("name");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [teacherItems, allocationItems] = await Promise.all([
      getTeachers(),
      getClassAllocations(),
    ]);
    setTeachers(teacherItems);
    setAllocations(allocationItems);
  }, []);

  useEffect(() => {
    loadData()
      .catch(() => {
        setTeachers([]);
        setAllocations([]);
      })
      .finally(() => setLoading(false));
  }, [loadData]);

  // Derive display classes and subjects from published allocations only
  const teacherDisplayMap = useMemo(() => {
    const map = new Map<string, { classes: string[]; subjects: string[] }>();
    const publishedAllocs = allocations.filter((a) => a.status === "published");
    for (const alloc of publishedAllocs) {
      const existing = map.get(alloc.teacherId) || { classes: [] as string[], subjects: [] as string[] };
      const classLabel = formatClassLabel(alloc.className, alloc.section);
      if (!existing.classes.includes(classLabel)) {
        existing.classes.push(classLabel);
      }
      for (const subj of alloc.subjects) {
        if (!existing.subjects.includes(subj)) {
          existing.subjects.push(subj);
        }
      }
      map.set(alloc.teacherId, existing);
    }
    return map;
  }, [allocations]);

  const filtered = useMemo(() => {
    let result = [...teachers];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) => {
        const display = teacherDisplayMap.get(t.id);
        const classesToSearch = display?.classes ?? [];
        const subjectsToSearch = display?.subjects ?? [];
        return (
          t.name.toLowerCase().includes(q) ||
          t.employeeId.toLowerCase().includes(q) ||
          subjectsToSearch.some((s) => s.toLowerCase().includes(q)) ||
          classesToSearch.some((c) => c.toLowerCase().includes(q))
        );
      });
    }

    if (statusFilter !== "All") {
      result = result.filter((t) => t.status === statusFilter);
    }

    switch (sortBy) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "status":
        result.sort((a, b) => (a.status === "Active" ? -1 : 1));
        break;
      default:
        break;
    }

    return result;
  }, [teachers, search, statusFilter, sortBy, teacherDisplayMap]);

  const activeCount = teachers.filter((t) => t.status === "Active").length;
  const offlineCount = teachers.filter((t) => t.status === "Offline").length;

  const handleDeleteTeacher = async (teacher: TeacherSummary) => {
    if (deletingId) return;
    const confirmed = window.confirm(`Remove ${teacher.name} from this school? This will also remove linked teacher records.`);
    if (!confirmed) return;

    setDeletingId(teacher.id);
    try {
      await deletePrincipalUser(teacher.id);
      setTeachers((current) => current.filter((item) => item.id !== teacher.id));
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-6 py-4 shadow-lg">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#36ADAA] border-t-transparent" />
          <span className="text-sm font-semibold text-slate-600">Loading teachers...</span>
        </div>
      </div>
    );
  }

  if (teachers.length === 0) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="rounded-2xl bg-white/90 px-8 py-6 shadow-lg text-center">
          <Users className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-lg font-bold text-slate-800">No teachers found</p>
          <p className="mt-2 text-sm text-slate-500">Teachers will appear here once they are added to the system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[fadeInUp_0.4s_ease-out]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-extrabold text-slate-900">Teachers</h2>
            <p className="mt-1 text-sm text-slate-500">{teachers.length} teachers · {activeCount} active · {offlineCount} offline</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SearchToolbar
          placeholder="Search by name, ID, subject, or class..."
          onSearch={setSearch}
          sortOptions={[
            { label: "Sort by Name", value: "name" },
            { label: "Sort by Status", value: "status" },
          ]}
          onSort={setSortBy}
        />
        <div className="flex gap-2">
          {(["All", "Active", "Offline"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setStatusFilter(opt)}
              className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
                statusFilter === opt
                  ? "bg-[#36ADAA] text-white shadow-lg shadow-[#36ADAA]/25"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Teachers Table */}
      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">No teachers match your search criteria.</div>
        ) : (
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs font-black uppercase tracking-[0.14em] text-slate-700">
                <th className="rounded-l-2xl bg-[#dff3f2] px-4 py-3">Teacher</th>
                <th className="bg-[#dff3f2] px-4 py-3">Employee ID</th>
                <th className="bg-[#dff3f2] px-4 py-3">Classes</th>
                <th className="bg-[#dff3f2] px-4 py-3">Subjects</th>
                <th className="bg-[#dff3f2] px-4 py-3">Last Login</th>
                <th className="rounded-r-2xl bg-[#dff3f2] px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((teacher) => {
                const display = teacherDisplayMap.get(teacher.id);
                const classesToShow = display?.classes ?? [];
                const subjectsToShow = display?.subjects ?? [];
                return (
                <tr
                  key={teacher.id}
                  onClick={() => navigate(`/principal/teachers/${teacher.id}`)}
                  className="cursor-pointer align-middle transition hover:bg-slate-50/80"
                >
                  <td className="rounded-l-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#36ADAA] text-xs font-black text-white">
                        {teacher.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-800">{teacher.name}</span>
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDeleteTeacher(teacher);
                            }}
                            disabled={deletingId === teacher.id}
                            className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {deletingId === teacher.id ? "Removing..." : "Remove"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">{teacher.employeeId}</td>
                  <td className="bg-slate-50 px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {classesToShow.length ? classesToShow.map((c) => (
                        <span key={c} className="rounded-full bg-[#36ADAA]/10 px-2 py-0.5 text-[11px] font-bold text-[#36ADAA]">
                          {c}
                        </span>
                      )) : <span className="text-sm text-slate-400">No class allocated</span>}
                    </div>
                  </td>
                  <td className="bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">{subjectsToShow.length ? subjectsToShow.join(", ") : "No subject allocated"}</td>
                  <td className="bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    {new Date(teacher.lastLogin).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="rounded-r-2xl bg-slate-50 px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${
                        teacher.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {teacher.status === "Active" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {teacher.status}
                    </span>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
