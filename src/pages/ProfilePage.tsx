import { Camera, Check, Loader2, Mail, MapPin, Phone, Save, User, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { updateProfile } from "../services/auth";
import type { AuthUser } from "../types/auth";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  bio: string;
  avatar: string;
  classId: string;
  section: string;
  stream: string;
  subject: string;
  assignedClasses: string;
  assignedSections: string;
  designation: string;
}

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const buildProfileState = (nextUser: AuthUser | null): ProfileData => ({
    name: nextUser?.name ?? "User",
    email: nextUser?.email ?? "",
    phone: nextUser?.phone ?? "",
    address: nextUser?.address ?? "",
    bio: nextUser?.bio ?? "",
    avatar: nextUser?.avatar ?? "",
    classId: nextUser?.classId ?? "",
    section: nextUser?.section ?? "",
    stream: nextUser?.stream ?? "",
    subject: nextUser?.subjects?.[0] ?? "",
    assignedClasses: (nextUser?.assignedClasses || []).join(", "),
    assignedSections: (nextUser?.assignedSections || []).join(", "),
    designation: nextUser?.designation ?? "",
  });
  const [profile, setProfile] = useState<ProfileData>(() => buildProfileState(user));
  const [draft, setDraft] = useState<ProfileData>(() => buildProfileState(user));

  useEffect(() => {
    const nextProfile = buildProfileState(user);
    setProfile(nextProfile);
    setDraft(nextProfile);
  }, [user]);

  useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [saved]);

  const handleEditToggle = () => {
    if (editing) {
      setDraft(profile);
    }
    setEditing(!editing);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!user?.id || !user.schoolId) return;
    setSaving(true);
    setSaved(false);
    try {
      const updatedUser = await updateProfile(user.id, user.schoolId, {
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        address: draft.address,
        bio: draft.bio,
        avatar: draft.avatar,
        classId: draft.classId,
        section: draft.section,
        stream: draft.stream,
        subjects: draft.subject ? [draft.subject] : [],
        assignedClasses: draft.assignedClasses.split(",").map((item) => item.trim()).filter(Boolean),
        assignedSections: draft.assignedSections.split(",").map((item) => item.trim()).filter(Boolean),
        designation: draft.designation,
      });
      const nextProfile = buildProfileState(updatedUser);
      setProfile(nextProfile);
      setDraft(nextProfile);
      setEditing(false);
      setSaved(true);
      await refreshUser();
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDraft((prev) => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const current = editing ? draft : profile;
  const seniorStudent = user?.role === "student" && (current.classId === "XI" || current.classId === "XII" || current.classId === "Class XI" || current.classId === "Class XII");

  const fields: { label: string; key: keyof ProfileData; icon: typeof User; type?: string }[] = [
    { label: "Full Name", key: "name", icon: User },
    { label: "Email Address", key: "email", icon: Mail, type: "email" },
    { label: "Phone Number", key: "phone", icon: Phone, type: "tel" },
    { label: "Address", key: "address", icon: MapPin },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
            <User className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-extrabold text-slate-900">Profile</h2>
            <p className="mt-1 text-sm text-slate-500">Manage your personal information, contact details, and account preferences.</p>
          </div>
          {saved && (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              <Check className="h-4 w-4" />
              Saved
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_2.1fr]">
        {/* Avatar Card */}
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {current.avatar ? (
                <img
                  src={current.avatar}
                  alt="Avatar"
                  className="h-28 w-28 rounded-3xl object-cover ring-4 ring-[#36ADAA]/20"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-[#36ADAA] to-[#2C8F8C] text-4xl font-black text-white ring-4 ring-[#36ADAA]/20">
                  {initials}
                </div>
              )}
              {editing && (
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="absolute -bottom-1 -right-1 rounded-xl border-2 border-white bg-[#36ADAA] p-2 text-white shadow-lg transition hover:bg-[#2C8F8C]"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div className="text-center">
              <p className="font-display text-xl font-extrabold text-slate-900">{profile.name}</p>
              <p className="mt-0.5 text-xs font-black uppercase tracking-[0.2em] text-[#36ADAA]">
                {user?.role ?? "User"}
              </p>
            </div>
            <div className="w-full rounded-2xl bg-slate-50 p-3 text-center">
              <p className="text-xs font-semibold text-slate-400">Role</p>
              <p className="mt-0.5 text-sm font-bold text-slate-800 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-display text-lg font-extrabold text-slate-900">Personal Information</h3>
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <button
                    type="button"
                    onClick={handleEditToggle}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSave()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#36ADAA] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#36ADAA]/25 transition disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <User className="h-4 w-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="space-y-5">
            {fields.map((field) => {
              const Icon = field.icon;
              const value = current[field.key] as string;
              return (
                <div key={field.key}>
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    {field.label}
                  </label>
                  {editing ? (
                    <input
                      type={field.type ?? "text"}
                      value={value}
                      onChange={(e) => setDraft((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#36ADAA] focus:ring-2 focus:ring-[#36ADAA]/20"
                    />
                  ) : (
                    <div className="mt-1.5 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                      <Icon className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-800">{value}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bio */}
            <div>
              <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Bio</label>
              {editing ? (
                <textarea
                  value={current.bio}
                  onChange={(e) => setDraft((prev) => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#36ADAA] focus:ring-2 focus:ring-[#36ADAA]/20"
                />
              ) : (
                <div className="mt-1.5 rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm leading-7 text-slate-600">{current.bio}</p>
                </div>
              )}
            </div>

            {user?.role === "student" ? (
              <>
                <div>
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Class</label>
                  {editing ? (
                    <input value={current.classId} onChange={(e) => setDraft((prev) => ({ ...prev, classId: e.target.value }))} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#36ADAA] focus:ring-2 focus:ring-[#36ADAA]/20" />
                  ) : (
                    <div className="mt-1.5 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">{current.classId || "-"}</div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Section</label>
                  {editing ? (
                    <input value={current.section} onChange={(e) => setDraft((prev) => ({ ...prev, section: e.target.value }))} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#36ADAA] focus:ring-2 focus:ring-[#36ADAA]/20" />
                  ) : (
                    <div className="mt-1.5 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">{current.section || "-"}</div>
                  )}
                </div>
                {seniorStudent ? (
                  <div>
                    <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Stream</label>
                    {editing ? (
                      <input value={current.stream} onChange={(e) => setDraft((prev) => ({ ...prev, stream: e.target.value }))} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#36ADAA] focus:ring-2 focus:ring-[#36ADAA]/20" />
                    ) : (
                      <div className="mt-1.5 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">{current.stream || "-"}</div>
                    )}
                  </div>
                ) : null}
              </>
            ) : null}

            {user?.role === "teacher" ? (
              <>
                <div>
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Subject</label>
                  {editing ? (
                    <input value={current.subject} onChange={(e) => setDraft((prev) => ({ ...prev, subject: e.target.value }))} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#36ADAA] focus:ring-2 focus:ring-[#36ADAA]/20" />
                  ) : (
                    <div className="mt-1.5 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">{current.subject || "-"}</div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Assigned Classes</label>
                  {editing ? (
                    <input value={current.assignedClasses} onChange={(e) => setDraft((prev) => ({ ...prev, assignedClasses: e.target.value }))} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#36ADAA] focus:ring-2 focus:ring-[#36ADAA]/20" />
                  ) : (
                    <div className="mt-1.5 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">{current.assignedClasses || "-"}</div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Assigned Sections</label>
                  {editing ? (
                    <input value={current.assignedSections} onChange={(e) => setDraft((prev) => ({ ...prev, assignedSections: e.target.value }))} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#36ADAA] focus:ring-2 focus:ring-[#36ADAA]/20" />
                  ) : (
                    <div className="mt-1.5 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">{current.assignedSections || "-"}</div>
                  )}
                </div>
              </>
            ) : null}

            {user?.role === "principal" ? (
              <div>
                <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Designation</label>
                {editing ? (
                  <input value={current.designation} onChange={(e) => setDraft((prev) => ({ ...prev, designation: e.target.value }))} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#36ADAA] focus:ring-2 focus:ring-[#36ADAA]/20" />
                ) : (
                  <div className="mt-1.5 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">{current.designation || "-"}</div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
