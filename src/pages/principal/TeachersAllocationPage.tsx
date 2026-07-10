import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronDown, ChevronRight, PlusCircle, Trash2, Users, XCircle } from "lucide-react";
import { ChartCard } from "../../components/ChartCard";
import { SearchToolbar } from "../../components/SearchToolbar";
import {
  deleteClassAllocation,
  getAllocationClassOptions,
  getClassAllocations,
  getTeachers,
  publishClassAllocation,
  saveClassAllocation,
  updateClassAllocation,
} from "../../services/principalServiceApi";
import type { PrincipalAllocationClassOption, PrincipalClassAllocation, TeacherSummary } from "../../services/principalServiceApi";

const currentAcademicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

function formatClassLabel(className: string, section: string) {
  const base = className.replace(/^Class\s+/i, "").trim();
  if (!section) return base;
  return `${base} - Section ${section.toUpperCase()}`;
}

export function TeachersAllocationPage() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<TeacherSummary[]>([]);
  const [allocations, setAllocations] = useState<PrincipalClassAllocation[]>([]);
  const [classes, setClasses] = useState<PrincipalAllocationClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Offline">("All");
  const [sortBy, setSortBy] = useState("name");
  const [showAllocationPanel, setShowAllocationPanel] = useState(false);
  const [savingAllocation, setSavingAllocation] = useState(false);
  const [editingAllocationId, setEditingAllocationId] = useState<string | null>(null);
  const [expandedTeacherId, setExpandedTeacherId] = useState<string | null>(null);
  const [allocationForm, setAllocationForm] = useState({
    teacherId: "",
    classKey: "",
    academicYear: currentAcademicYear,
    selectedSubjects: [] as string[],
    manualSubjects: "",
  });

  const loadData = useCallback(async () => {
    const [teacherItems, allocationItems, classItems] = await Promise.all([
      getTeachers(),
      getClassAllocations(),
      getAllocationClassOptions(),
    ]);
    console.log(`[AllocationSync] Teachers refetched: ${teacherItems.length}, Allocations refetched: ${allocationItems.length}`);
    for (const t of teacherItems) {
      const tAllocations = allocationItems.filter((a) => a.teacherId === t.id);
      console.log(`[AllocationSync] Teacher "${t.name}" (${t.id}): ${tAllocations.length} allocations after sync`);
    }
    setTeachers(teacherItems);
    setAllocations(allocationItems);
    setClasses(classItems);
  }, []);

  useEffect(() => {
    loadData()
      .catch(() => {
        setTeachers([]);
        setAllocations([]);
        setClasses([]);
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
    let result = [...teachers].filter((teacher) => {
      const display = teacherDisplayMap.get(teacher.id);
      return Boolean((display?.classes?.length || 0) > 0);
    });

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) => {
        const display = teacherDisplayMap.get(t.id);
        return (
          t.name.toLowerCase().includes(q) ||
          t.employeeId.toLowerCase().includes(q) ||
          (display?.subjects ?? []).some((s) => s.toLowerCase().includes(q)) ||
          (display?.classes ?? []).some((c) => c.toLowerCase().includes(q))
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
  const selectedTeacher = teachers.find((teacher) => teacher.id === allocationForm.teacherId) || null;
  const selectedClass = classes.find((item) => item.classKey === allocationForm.classKey) || null;

  const resetAllocationForm = () => {
    setEditingAllocationId(null);
    setAllocationForm({
      teacherId: "",
      classKey: "",
      academicYear: currentAcademicYear,
      selectedSubjects: [],
      manualSubjects: "",
    });
  };

  const beginEditAllocation = (allocation: PrincipalClassAllocation) => {
    setEditingAllocationId(allocation._id);
    setShowAllocationPanel(true);
    const matchedClass =
      classes.find((item) => item.classKey === allocation.classId)
      || classes.find(
        (item) =>
          item.className === allocation.className
          && String(item.section || "").trim().toLowerCase() === String(allocation.section || "").trim().toLowerCase()
      )
      || null;
    setAllocationForm({
      teacherId: allocation.teacherId,
      classKey: matchedClass?.classKey || allocation.classId || "",
      academicYear: allocation.academicYear || currentAcademicYear,
      selectedSubjects: allocation.subjects || [],
      manualSubjects: "",
    });
  };

  const handleSaveAllocation = async (status: "draft" | "published") => {
    const teacher = teachers.find((item) => item.id === allocationForm.teacherId);
    const manualSubjects = allocationForm.manualSubjects.split(",").map((item) => item.trim()).filter(Boolean);
    const subjects = Array.from(new Set([...allocationForm.selectedSubjects, ...manualSubjects]));
    if (!teacher || !selectedClass || !allocationForm.academicYear.trim() || subjects.length === 0) return;

    setSavingAllocation(true);
    try {
      const payload = {
        teacherId: teacher.id,
        classId: selectedClass.classKey,
        className: selectedClass.className,
        section: selectedClass.section.trim(),
        subjectIds: subjects,
        subjects,
        academicYear: allocationForm.academicYear.trim(),
        status,
      };
      console.log(`[AllocationSync] ${editingAllocationId ? "Edit" : "Create"} allocation for teacher "${teacher.name}" (${teacher.id})`);
      if (editingAllocationId) {
        await updateClassAllocation(editingAllocationId, payload);
      } else {
        await saveClassAllocation(payload);
      }
      await loadData();
      resetAllocationForm();
      setShowAllocationPanel(false);
    } finally {
      setSavingAllocation(false);
    }
  };

  // Group allocations by teacher
  const allocationsByTeacher = useMemo(() => {
    const grouped = new Map<string, PrincipalClassAllocation[]>();
    for (const allocation of allocations) {
      const teacherId = allocation.teacherId;
      if (!grouped.has(teacherId)) {
        grouped.set(teacherId, []);
      }
      grouped.get(teacherId)!.push(allocation);
    }
    return grouped;
  }, [allocations]);

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

  return (
    <div className="space-y-6 animate-[fadeInUp_0.4s_ease-out]">
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
        <button
          type="button"
          onClick={() => {
            resetAllocationForm();
            setShowAllocationPanel((value) => !value);
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800"
        >
          <PlusCircle className="h-4 w-4" />
          Allocate Classes
        </button>
      </div>

      {showAllocationPanel ? (
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-extrabold text-slate-900">{editingAllocationId ? "Edit Allocation" : "Allocate Classes"}</h3>
              <p className="mt-1 text-sm text-slate-500">Save draft allocations or publish them so they appear in the teacher login.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetAllocationForm();
                setShowAllocationPanel(false);
              }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Teacher</span>
              <select value={allocationForm.teacherId} onChange={(event) => setAllocationForm((prev) => ({ ...prev, teacherId: event.target.value, selectedSubjects: [] }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none">
                <option value="">Select teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Class and Section</span>
              <select
                value={allocationForm.classKey}
                onChange={(event) => setAllocationForm((prev) => ({ ...prev, classKey: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              >
                <option value="">Select class and section</option>
                {classes.map((item) => (
                  <option key={item.classKey} value={item.classKey}>
                    {formatClassLabel(item.className, item.section)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Academic Year</span>
              <input value={allocationForm.academicYear} onChange={(event) => setAllocationForm((prev) => ({ ...prev, academicYear: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none" />
            </label>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Subjects</p>
            <p className="mt-1 text-sm text-slate-500">
              Principals can add subjects to any class allocation. Pick a class-section above, then select teacher subjects or type new subject names.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(selectedTeacher?.subjects || []).map((subject) => {
                const checked = allocationForm.selectedSubjects.includes(subject);
                return (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => setAllocationForm((prev) => ({ ...prev, selectedSubjects: checked ? prev.selectedSubjects.filter((item) => item !== subject) : [...prev.selectedSubjects, subject] }))}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition ${checked ? "bg-[#36ADAA] text-white" : "border border-slate-200 bg-white text-slate-600"}`}
                  >
                    {subject}
                  </button>
                );
              })}
            </div>
            <input value={allocationForm.manualSubjects} onChange={(event) => setAllocationForm((prev) => ({ ...prev, manualSubjects: event.target.value }))} placeholder="Add subject names separated by commas" className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none" />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" disabled={savingAllocation} onClick={() => handleSaveAllocation("draft")} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50">Save Draft</button>
            <button type="button" disabled={savingAllocation} onClick={() => handleSaveAllocation("published")} className="rounded-2xl bg-[#36ADAA] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#36ADAA]/25 hover:opacity-95 disabled:opacity-50">Publish Allocation</button>
          </div>
        </div>
      ) : null}

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
            <button key={opt} type="button" onClick={() => setStatusFilter(opt)} className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${statusFilter === opt ? "bg-[#36ADAA] text-white shadow-lg shadow-[#36ADAA]/25" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] overflow-x-auto">
        {teachers.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">No teachers found. Add teacher records to start class allocation.</div>
        ) : filtered.length === 0 ? (
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
                <tr key={teacher.id} onClick={() => navigate(`/principal/teachers/${teacher.id}`)} className="cursor-pointer align-middle transition hover:bg-slate-50/80">
                  <td className="rounded-l-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#36ADAA] text-xs font-black text-white">{teacher.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div>
                      <span className="text-sm font-bold text-slate-800">{teacher.name}</span>
                    </div>
                  </td>
                  <td className="bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">{teacher.employeeId}</td>
                  <td className="bg-slate-50 px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {classesToShow.map((c) => (
                        <span key={c} className="rounded-full bg-[#36ADAA]/10 px-2 py-0.5 text-[11px] font-bold text-[#36ADAA]">{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">{subjectsToShow.join(", ")}</td>
                  <td className="bg-slate-50 px-4 py-3 text-sm text-slate-500">{new Date(teacher.lastLogin).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="rounded-r-2xl bg-slate-50 px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${teacher.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {teacher.status === "Active" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {teacher.status}
                    </span>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>

      <ChartCard title="Class Allocations" subtitle="Draft and published allocations scoped to this school" icon={<Users className="h-5 w-5" />}>
        {allocations.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">No class allocations have been created yet.</div>
        ) : (
          <div className="space-y-3">
            {Array.from(allocationsByTeacher.entries()).map(([teacherId, teacherAllocations]) => {
              const teacherName = teachers.find((t) => t.id === teacherId)?.name || teacherId;
              const isExpanded = expandedTeacherId === teacherId;
              const publishedCount = teacherAllocations.filter((a) => a.status === "published").length;
              const draftCount = teacherAllocations.filter((a) => a.status !== "published").length;
              const statusLabel = publishedCount > 0 && draftCount === 0
                ? "Published"
                : draftCount > 0 && publishedCount === 0
                  ? "Draft"
                  : "Mixed";

              return (
                <div key={teacherId} className="rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedTeacherId(isExpanded ? null : teacherId)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-slate-100/50"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                      <div>
                        <span className="text-sm font-bold text-slate-800">{teacherName}</span>
                        <span className="ml-2 text-xs text-slate-500">{teacherAllocations.length} class allocation{teacherAllocations.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      statusLabel === "Published"
                        ? "bg-emerald-50 text-emerald-700"
                        : statusLabel === "Draft"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-blue-50 text-blue-700"
                    }`}>
                      {statusLabel}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-200">
                      {teacherAllocations.map((allocation) => (
                        <div key={allocation._id} className="border-b border-slate-100 px-4 py-3 last:border-b-0">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-800">
                                {formatClassLabel(allocation.className, allocation.section)}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {allocation.subjects.join(", ")} • {allocation.academicYear}
                              </div>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${allocation.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                              {allocation.status}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => beginEditAllocation(allocation)}
                              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            {allocation.status !== "published" ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  console.log(`[AllocationSync] Publishing allocation ${allocation._id} for teacherId=${allocation.teacherId}`);
                                  await publishClassAllocation(allocation._id);
                                  await loadData();
                                }}
                                className="rounded-2xl bg-[#36ADAA] px-3 py-2 text-xs font-bold text-white hover:opacity-95"
                              >
                                Publish
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={async () => {
                                console.log(`[AllocationSync] Deleting allocation ${allocation._id} for teacherId=${allocation.teacherId}`);
                                await deleteClassAllocation(allocation._id);
                                await loadData();
                              }}
                              className="rounded-2xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ChartCard>
    </div>
  );
}
