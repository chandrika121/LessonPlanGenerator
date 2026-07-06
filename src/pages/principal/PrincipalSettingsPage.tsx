import { FormEvent, useEffect, useMemo, useState } from "react";
import { Search, Settings2, Trash2, UserPlus, Users } from "lucide-react";
import {
  createPrincipalUser,
  deletePrincipalUser,
  getPrincipalUsers,
  type PrincipalManagedUser,
} from "../../services/principalServiceApi";

const classOptions = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const sectionOptions = ["A", "B", "C", "D"];
const streamOptions = ["Science", "Commerce", "Humanities"];

function isSeniorClass(classId: string) {
  return classId === "XI" || classId === "XII";
}

export function PrincipalSettingsPage() {
  const [users, setUsers] = useState<PrincipalManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "teacher" | "student">("all");
  const [userSearch, setUserSearch] = useState("");
  const [form, setForm] = useState({
    role: "teacher" as "teacher" | "student",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    classId: "",
    section: "",
    stream: "",
    subject: "",
  });

  const loadUsers = async () => {
    const items = await getPrincipalUsers();
    setUsers(items);
  };

  useEffect(() => {
    loadUsers()
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to load users.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    let result = roleFilter === "all" ? users : users.filter((user) => user.role === roleFilter);
    if (query) {
      result = result.filter((user) =>
        String(user.name || "").toLowerCase().includes(query) ||
        String(user.email || "").toLowerCase().includes(query) ||
        String(user.phone || "").toLowerCase().includes(query) ||
        String(user.role || "").toLowerCase().includes(query) ||
        String(user.classId || "").toLowerCase().includes(query) ||
        String(user.section || "").toLowerCase().includes(query) ||
        String(user.stream || "").toLowerCase().includes(query) ||
        String(user.employeeId || "").toLowerCase().includes(query) ||
        (Array.isArray(user.subjects) && user.subjects.some((s) => String(s || "").toLowerCase().includes(query)))
      );
    }
    return result;
  }, [roleFilter, users, userSearch]);

  const teacherCount = users.filter((user) => user.role === "teacher").length;
  const studentCount = users.filter((user) => user.role === "student").length;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await createPrincipalUser(form);
      await loadUsers();
      setSuccess(`${form.role === "teacher" ? "Teacher" : "Student"} account created successfully.`);
      setForm({
        role: "teacher",
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        classId: "",
        section: "",
        stream: "",
        subject: "",
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create user.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: PrincipalManagedUser) {
    const confirmed = window.confirm(`Remove ${user.name} (${user.role}) from this school?`);
    if (!confirmed) return;
    setError("");
    setSuccess("");
    try {
      await deletePrincipalUser(user.id);
      await loadUsers();
      setSuccess(`${user.name} was removed successfully.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to remove user.");
    }
  }

  return (
    <div className="space-y-6 animate-[fadeInUp_0.4s_ease-out]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-extrabold text-slate-900">Settings</h2>
            <p className="mt-1 text-sm text-slate-500">User Manager for creating and removing teacher and student accounts.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
          <span className="rounded-2xl bg-white px-4 py-2 shadow-sm">{teacherCount} teachers</span>
          <span className="rounded-2xl bg-white px-4 py-2 shadow-sm">{studentCount} students</span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
        <form onSubmit={handleSubmit} className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-900 p-3 text-white">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-xl font-extrabold text-slate-900">Create User</h3>
              <p className="text-sm text-slate-500">Add teacher or student accounts directly from principal settings.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {(["teacher", "student"] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, role, classId: "", section: "", stream: "", subject: "" }))}
                  className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${form.role === role ? "border-[#36ADAA] bg-[#36ADAA] text-white" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"}`}
                >
                  {role === "teacher" ? "Teacher" : "Student"}
                </button>
              ))}
            </div>

            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Full name" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none" />
            <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email address" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none" />
            <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone number" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none" />

            {form.role === "teacher" ? (
              <input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} placeholder="Subject" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <select value={form.classId} onChange={(event) => setForm((current) => ({ ...current, classId: event.target.value, stream: "" }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none">
                  <option value="">Select Class</option>
                  {classOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <select value={form.section} onChange={(event) => setForm((current) => ({ ...current, section: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none">
                  <option value="">Select Section</option>
                  {sectionOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                {isSeniorClass(form.classId) ? (
                  <select value={form.stream} onChange={(event) => setForm((current) => ({ ...current, stream: event.target.value }))} className="sm:col-span-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none">
                    <option value="">Select Stream</option>
                    {streamOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                ) : null}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="Password" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none" />
              <input type="password" value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} placeholder="Confirm password" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none" />
            </div>

            {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
            {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

            <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50">
              <UserPlus className="h-4 w-4" />
              {saving ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>

        <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-xl font-extrabold text-slate-900">User Manager</h3>
                <p className="text-sm text-slate-500">Remove users and review teacher or student accounts.</p>
              </div>
            </div>
            <div className="flex gap-2">
              {(["all", "teacher", "student"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setRoleFilter(filter)}
                  className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${roleFilter === filter ? "bg-[#36ADAA] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                >
                  {filter === "all" ? "All Users" : filter === "teacher" ? "Teachers" : "Students"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search by name, email, phone, role, subject, or class..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
          </div>

          <div className="mt-3 space-y-3">
            {loading ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">No users found for this filter.</div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{user.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{user.email} • {user.phone || "-"}</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold">
                      <span className="rounded-full bg-slate-900 px-2.5 py-1 text-white">{user.role}</span>
                      {user.role === "teacher" && user.subjects?.length ? <span className="rounded-full bg-[#36ADAA]/10 px-2.5 py-1 text-[#36ADAA]">{user.subjects.join(", ")}</span> : null}
                      {user.role === "student" && user.classId ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">Class {user.classId}{user.section ? `-${user.section}` : ""}</span> : null}
                      {user.role === "student" && user.stream ? <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700">{user.stream}</span> : null}
                      {user.employeeId ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{user.employeeId}</span> : null}
                    </div>
                  </div>
                  <button type="button" onClick={() => void handleDelete(user)} className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50">
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
