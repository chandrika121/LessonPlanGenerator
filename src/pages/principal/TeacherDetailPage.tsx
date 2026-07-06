import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Calendar, Clock, CheckCircle2, XCircle, BookOpen, Trash2 } from "lucide-react";
import { ChartCard } from "../../components/ChartCard";
import { deletePrincipalUser, getTeacher } from "../../services/principalServiceApi";
import type { TeacherDetail } from "../../services/principalServiceApi";
import { useAuth } from "../../hooks/useAuth";

export function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getTeacher(id)
      .then(setTeacher)
      .catch(() => setTeacher(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDeleteTeacher = async () => {
    if (!teacher || !id || deleting) return;
    const confirmed = window.confirm(`Remove ${teacher.name} from this school? This will also remove linked teacher records.`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deletePrincipalUser(id);
      navigate("/principal/teachers");
    } catch (error) {
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-6 py-4 shadow-lg">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#36ADAA] border-t-transparent" />
          <span className="text-sm font-semibold text-slate-600">Loading teacher profile...</span>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate("/principal/teachers")}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Teachers
        </button>
        <div className="flex items-center justify-center py-16">
          <div className="rounded-2xl bg-white/90 px-8 py-6 shadow-lg text-center">
            <p className="text-lg font-bold text-slate-800">Teacher not found</p>
            <p className="mt-2 text-sm text-slate-500">The requested teacher profile could not be loaded.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[fadeInUp_0.4s_ease-out]">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate("/principal/teachers")}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Teachers
      </button>

      {/* Profile Header */}
      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#36ADAA] to-[#2C8F8C] text-3xl font-black text-white shadow-lg">
            {teacher.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-slate-900">{teacher.name}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">{teacher.employeeId}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold ${
                    teacher.status === "Active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {teacher.status === "Active" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {teacher.status}
                </span>
                {currentUser?.role === "principal" ? (
                  <button
                    type="button"
                    onClick={handleDeleteTeacher}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deleting ? "Removing..." : "Remove Teacher"}
                  </button>
                ) : null}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                {teacher.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                {teacher.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400" />
                Joined {new Date(teacher.joinedDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-2xl font-extrabold text-slate-900">{teacher.lessonPlansGenerated}</p>
            <p className="text-xs font-bold text-slate-500 mt-1">Lesson Plans</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-2xl font-extrabold text-slate-900">{teacher.homeworkGenerated}</p>
            <p className="text-xs font-bold text-slate-500 mt-1">Homework</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-2xl font-extrabold text-slate-900">{teacher.assessmentsGenerated}</p>
            <p className="text-xs font-bold text-slate-500 mt-1">Assessments</p>
          </div>
        </div>
      </div>

      {/* Classes */}
      <ChartCard title="Assigned Classes" subtitle="Classrooms and curriculum progress" icon={<BookOpen className="h-5 w-5" />}>
        <div className="space-y-4">
          {teacher.classes.map((cls) => (
            <div key={cls.className + cls.subject} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">{cls.className} — {cls.subject}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{cls.studentCount} students</p>
                </div>
                <span className="text-xs font-black text-[#36ADAA]">{cls.curriculumProgress}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#36ADAA] transition-all duration-700"
                  style={{ width: `${cls.curriculumProgress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Recent Activity */}
      <ChartCard title="Recent Activity" subtitle="Latest actions by this teacher" icon={<Clock className="h-5 w-5" />}>
        <div className="space-y-2">
          {teacher.recentActivity.map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-2xl bg-slate-50/80 px-4 py-3">
              <span className="text-sm text-slate-700">{activity.action}</span>
              <span className="text-xs font-semibold text-slate-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
