import { ArrowLeft, Download, Eye, Search, Trash2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getTeacherClasses } from "../../services/teacherClassesService";
import { endDevTimer, startDevTimer } from "../../utils/devTiming";

type StudentActionType = "homework" | "assessments";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface SubmissionItem {
  id: string;
  studentName: string;
  rollNo: string;
  className: string;
  subject?: string;
  title: string;
  sessionId?: string;
  sessionTitle?: string;
  status: "uploaded" | "not_uploaded" | "reviewed";
  uploadedAt?: string;
  source: "student_upload" | "teacher_upload";
  fileName?: string;
  fileDataUrl?: string;
}

interface TeacherClassOption {
  id: string;
  classId: string;
  className: string;
  section: string;
}

interface SubmissionDetailsState {
  type: StudentActionType;
  item: SubmissionItem;
}

interface StudentMatrixRow {
  studentName: string;
  rollNo: string;
  className: string;
  homework: SubmissionItem | null;
  assessments: SubmissionItem | null;
}

const sectionConfig: Record<StudentActionType, { label: string }> = {
  homework: {
    label: "Homework Submission List",
  },
  assessments: {
    label: "Assessment Submission List",
  },
};

const AUTH_STORAGE_KEY = "lms:auth-session";
const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_BACKEND_PORT || "3002"}`;

function getSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { id?: string; schoolId?: string };
  } catch {
    return null;
  }
}

function formatStatus(status: SubmissionItem["status"]) {
  if (status === "not_uploaded") return "Not Uploaded";
  return "Uploaded";
}

function statusClass(status: SubmissionItem["status"]) {
  if (status === "not_uploaded") return "border-slate-200 bg-slate-50 text-slate-500";
  if (status === "reviewed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-sky-200 bg-sky-50 text-sky-700";
}

function buildMatrixRows(submissions: Record<StudentActionType, SubmissionItem[]>) {
  const studentMap = new Map<string, StudentMatrixRow>();

  (Object.keys(submissions) as StudentActionType[]).forEach((type) => {
    submissions[type].forEach((item) => {
      const key = `${item.studentName}-${item.rollNo}`;
      const existing = studentMap.get(key) || {
        studentName: item.studentName,
        rollNo: item.rollNo,
        className: item.className,
        homework: null,
        assessments: null,
      };
      existing[type] = item;
      studentMap.set(key, existing);
    });
  });

  return Array.from(studentMap.values());
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

function buildClassWithSectionLabel(className: string, section?: string) {
  return section ? `${className} - Section ${section}` : className;
}

function normalizeRomanNumeral(value: string) {
  const normalized = normalizeValue(value).replace(/\s+/g, "");
  const romanToNumber: Record<string, string> = {
    i: "1",
    ii: "2",
    iii: "3",
    iv: "4",
    v: "5",
    vi: "6",
    vii: "7",
    viii: "8",
    ix: "9",
    x: "10",
    xi: "11",
    xii: "12",
  };
  return romanToNumber[normalized] || normalized;
}

function extractSectionToken(value: string) {
  const normalized = normalizeValue(value);
  const sectionMatch = normalized.match(/section\s*([a-z0-9]+)/i) || normalized.match(/-\s*([a-z])$/i);
  return sectionMatch?.[1]?.toUpperCase() || "";
}

function extractClassToken(value: string) {
  const normalized = normalizeValue(value)
    .replace(/\bclass\b/g, " ")
    .replace(/\bsection\b\s*[a-z0-9]+\b/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = normalized.split(" ").filter(Boolean);
  for (const token of tokens) {
    const normalizedToken = normalizeRomanNumeral(token);
    if (/^\d+$/.test(normalizedToken) && Number(normalizedToken) >= 1 && Number(normalizedToken) <= 12) {
      return normalizedToken;
    }
  }
  return "";
}

function parseClassSection(value: string) {
  return {
    classToken: extractClassToken(value),
    sectionToken: extractSectionToken(value),
  };
}

function matchesClassFilter(submissionClassName: string, selectedFilter: string) {
  if (!selectedFilter) return true;

  const submission = parseClassSection(submissionClassName);
  const selected = parseClassSection(selectedFilter);
  if (!submission.classToken || !selected.classToken) {
    return normalizeValue(submissionClassName).includes(normalizeValue(selectedFilter));
  }

  if (submission.classToken !== selected.classToken) {
    return false;
  }

  if (submission.sectionToken && selected.sectionToken) {
    return submission.sectionToken === selected.sectionToken;
  }

  return true;
}

function findTeacherClassForSubmission(itemClassName: string, teacherClasses: TeacherClassOption[]) {
  return teacherClasses.find((entry) =>
    matchesClassFilter(itemClassName, buildClassWithSectionLabel(entry.className || entry.classId, entry.section)),
  ) || null;
}

function getLocalDateString(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getSessionFilterValue(item: SubmissionItem) {
  return String(item.sessionId || "").trim();
}

function buildSubmissionLabel(item: SubmissionItem) {
  const sessionLabel = String(item.sessionTitle || "").trim();
  const title = String(item.title || "").trim();
  if (sessionLabel && title) {
    return `${sessionLabel} • ${title}`;
  }
  return title || sessionLabel || "Submission";
}

function extractSessionLabel(title: string) {
  const normalizedTitle = String(title || "").trim();
  if (!normalizedTitle) return "";

  const sessionMatch = normalizedTitle.match(/session\s*[-:]?\s*(\d+[a-z]?)/i);
  if (sessionMatch) {
    return `Session ${sessionMatch[1].toUpperCase()}`;
  }

  return normalizedTitle;
}

/**
 * Open or download a file from a base64 data URL.
 * Modern browsers block top-level navigation to data: URLs from <a target="_blank">,
 * so we must handle this programmatically.
 */
async function logPdfLayoutDiagnostics(dataUrl: string, fileName?: string) {
  try {
    const base64 = dataUrl.split(",")[1] || "";
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();
    const items = textContent.items
      .filter((entry): entry is typeof textContent.items[number] & { str: string; transform: number[] } => "str" in entry && Boolean(entry.str?.trim()))
      .map((entry) => ({
        str: entry.str.trim(),
        x: Number((entry.transform?.[4] || 0).toFixed(2)),
        y: Number((entry.transform?.[5] || 0).toFixed(2)),
      }));

    const headerItems = items.filter((item) =>
      /^SAVRA - Question Paper$/i.test(item.str) ||
      /^(Subject:|Class:|Teacher:|Maximum Marks:|Time:)/i.test(item.str),
    );
    const questionItems = items.filter((item) => /^Q\d+\./i.test(item.str));
    const headerEndY = headerItems.length > 0 ? Math.min(...headerItems.map((item) => item.y)) : null;
    const questionStartY = questionItems.length > 0 ? questionItems[0].y : null;
    const marginTop = headerItems.length > 0 ? Number((viewport.height - Math.max(...headerItems.map((item) => item.y))).toFixed(2)) : null;

    console.log("[QuestionPaperPDF] layout diagnostics", {
      fileName: fileName || "unknown",
      pageSize: { width: Number(viewport.width.toFixed(2)), height: Number(viewport.height.toFixed(2)) },
      marginTop,
      headerEndY,
      questionStartY,
      questionsLength: questionItems.length,
      firstQuestion: questionItems[0]?.str || "No questions found.",
      currentYBeforeEachQuestion: questionItems.slice(0, 12).map((item) => ({ question: item.str, currentY: item.y })),
    });
  } catch (error) {
    console.error("[QuestionPaperPDF] Failed to inspect PDF layout", error);
  }
}

function dataUrlToBlob(dataUrl: string) {
  const [prefix, base64] = dataUrl.split(",");
  const mimeMatch = prefix.match(/^data:([^;]+)/i);
  const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const binary = window.atob(base64 || "");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType });
}

function downloadFile(dataUrl: string, fileName?: string) {
  const blob = dataUrlToBlob(dataUrl);
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName || "download";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

async function openFile(dataUrl: string, fileName?: string) {
  try {
    const mimeMatch = dataUrl.match(/^data:([^;]+)/);
    const mimeType = mimeMatch ? mimeMatch[1].toLowerCase() : "";

    if (mimeType.includes("pdf")) {
      await logPdfLayoutDiagnostics(dataUrl, fileName);
      const blob = dataUrlToBlob(dataUrl);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      return;
    }

    downloadFile(dataUrl, fileName);
  } catch (error) {
    console.error("Failed to open file:", error);
    alert("Unable to open this file. It may no longer be available.");
  }
}

export function TeacherStudentActionPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTypeParam = searchParams.get("view");
  const activeType =
    activeTypeParam === "homework" || activeTypeParam === "assessments"
      ? activeTypeParam
      : null;
  const [search, setSearch] = useState("");
  const [submissions, setSubmissions] = useState<Record<StudentActionType, SubmissionItem[]>>(
    {
      homework: [],
      assessments: [],
    },
  );
  const [availableSessions, setAvailableSessions] = useState<Record<string, Array<{ sessionId: string; sessionNumber: number; title: string }>>>({});
  const [teacherClasses, setTeacherClasses] = useState<TeacherClassOption[]>([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState("");
  const [selectedSessionFilter, setSelectedSessionFilter] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [details, setDetails] = useState<SubmissionDetailsState | null>(null);
  const matrixRows = useMemo(() => buildMatrixRows(submissions), [submissions]);
  const subjectOptions = useMemo(() => {
    const values = Object.values(submissions)
      .flatMap((items) => items.map((item) => String(item.subject || "").trim()))
      .filter(Boolean);
    return Array.from(new Set(values))
      .sort((left, right) => left.localeCompare(right))
      .map((value) => ({ value, label: value }));
  }, [submissions]);

  useEffect(() => {
    const paintLabel = "[page-paint] teacher-student-action";
    startDevTimer(paintLabel);

    const frame = window.requestAnimationFrame(() => {
      endDevTimer(paintLabel);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      endDevTimer(paintLabel);
    };
  }, []);

  const loadSubmissions = () => {
    const session = getSession();
    if (!session?.id) return Promise.resolve();
    return fetch(`${BACKEND_URL}/api/teacher/submissions?userId=${encodeURIComponent(session.id)}&schoolId=${encodeURIComponent(session.schoolId || "")}`)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || `Failed to load submissions (HTTP ${response.status})`);
        }
        return response.json() as Promise<{ assignments: SubmissionItem[]; homework: SubmissionItem[]; assessments: SubmissionItem[]; sessionsByClassAndSubject?: Record<string, Array<{ sessionId: string; sessionNumber: number; title: string }>> }>;
      })
      .then((data) => {
        setSubmissions({
          homework: data.homework || [],
          assessments: data.assessments || [],
        });
        setAvailableSessions(data.sessionsByClassAndSubject || {});
      })
      .catch(() => {
        setSubmissions({ homework: [], assessments: [] });
        setAvailableSessions({});
      });
  };

  useEffect(() => {
    void loadSubmissions();
  }, []);

  useEffect(() => {
    let mounted = true;
    void getTeacherClasses()
      .then((items) => {
        if (!mounted) return;
        setTeacherClasses(
          items.map((item) => ({
            id: item.id,
            classId: item.classId,
            className: item.className,
            section: item.section,
          })),
        );
      })
      .catch(() => {
        if (!mounted) return;
        setTeacherClasses([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredMatrixRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return matrixRows.filter((row) => {
      const matchesQuery = !query || [row.studentName, row.rollNo, row.className].some((value) => value.toLowerCase().includes(query));
      const matchesClass = !selectedClassFilter || matchesClassFilter(row.className, selectedClassFilter);
      const rowSubjects = [String(row.homework?.subject || "").trim(), String(row.assessments?.subject || "").trim()].filter(Boolean);
      const matchesSubject = !selectedSubjectFilter || rowSubjects.some((subject) => normalizeValue(subject) === normalizeValue(selectedSubjectFilter));
      return matchesQuery && matchesClass && matchesSubject;
    });
  }, [matrixRows, search, selectedClassFilter, selectedSubjectFilter]);

  const filteredSubmissions = useMemo(() => {
    if (!activeType) return [];
    const query = search.trim().toLowerCase();
    return submissions[activeType].filter((item) => {
      const matchesSearch =
        !query ||
        [item.studentName, item.rollNo, item.className, item.title, item.fileName || ""].some((value) => value.toLowerCase().includes(query));
      if (!matchesSearch) return false;

      const matchesClass = matchesClassFilter(item.className, selectedClassFilter);
      const matchesSubject = !selectedSubjectFilter || normalizeValue(String(item.subject || "")) === normalizeValue(selectedSubjectFilter);

      const submissionDate = getLocalDateString(item.uploadedAt);
      const matchesDate = !selectedDateFilter || submissionDate === selectedDateFilter;

      const sessionValue = getSessionFilterValue(item);
      const matchesSession = !selectedSessionFilter || selectedSessionFilter === "All Sessions" || sessionValue === selectedSessionFilter;

      return matchesClass && matchesSubject && matchesDate && matchesSession;
    });
  }, [activeType, search, selectedClassFilter, selectedSubjectFilter, selectedDateFilter, selectedSessionFilter, submissions, teacherClasses]);

  const classOptions = useMemo(
    () =>
      Array.from(
        new Map(
          teacherClasses.map((item) => {
            const label = buildClassWithSectionLabel(item.className, item.section);
            return [label, { value: label, label }];
          }),
        ).values(),
      ),
    [teacherClasses],
  );

  const sessionOptions = useMemo(() => {
    // Helper to parse key in format "ClassName:Subject"
    const parseClassSubjectKey = (key: string) => {
      const colonIndex = key.indexOf(":");
      if (colonIndex === -1) return { className: key.trim(), subject: "" };
      return {
        className: key.substring(0, colonIndex).trim(),
        subject: key.substring(colonIndex + 1).trim(),
      };
    };

    let sessionsToUse: typeof availableSessions[string] = [];
    
    if (selectedClassFilter && selectedSubjectFilter) {
      // If both class and subject are selected, find exact match
      for (const [key, sessions] of Object.entries(availableSessions)) {
        const { className: backendClass, subject: backendSubject } = parseClassSubjectKey(key);
        if (backendClass && backendSubject &&
            matchesClassFilter(backendClass, selectedClassFilter) &&
            normalizeValue(backendSubject) === normalizeValue(selectedSubjectFilter)) {
          sessionsToUse = [...sessionsToUse, ...sessions];
        }
      }
    } else if (selectedSubjectFilter) {
      // If only subject is selected, find all sessions for ONLY that subject across all classes
      Object.entries(availableSessions).forEach(([key, sessions]) => {
        const { subject: backendSubject } = parseClassSubjectKey(key);
        // STRICT match: only if subject exactly matches (after normalization)
        if (backendSubject && normalizeValue(backendSubject) === normalizeValue(selectedSubjectFilter)) {
          sessionsToUse = [...sessionsToUse, ...sessions];
        }
      });
    } else if (selectedClassFilter) {
      // If only class is selected, find all sessions for that class across all subjects
      Object.entries(availableSessions).forEach(([key, sessions]) => {
        const { className: backendClass } = parseClassSubjectKey(key);
        if (backendClass && matchesClassFilter(backendClass, selectedClassFilter)) {
          sessionsToUse = [...sessionsToUse, ...sessions];
        }
      });
    } else {
      // If nothing selected, get unique sessions from all combinations
      const allSessions = new Map<string, typeof availableSessions[string][0]>();
      Object.values(availableSessions).forEach((subjectSessions) => {
        subjectSessions.forEach((session) => {
          if (!allSessions.has(session.sessionId)) {
            allSessions.set(session.sessionId, session);
          }
        });
      });
      sessionsToUse = Array.from(allSessions.values());
    }

    // Deduplicate and sort
    const deduped = new Map<string, typeof sessionsToUse[0]>();
    sessionsToUse.forEach((session) => {
      const existing = deduped.get(session.sessionId);
      if (!existing || session.sessionNumber < existing.sessionNumber) {
        deduped.set(session.sessionId, session);
      }
    });
    
    return Array.from(deduped.values())
      .sort((left, right) => left.sessionNumber - right.sessionNumber)
      .map((session) => ({
        value: session.sessionId,
        label: session.title,
      }));
  }, [availableSessions, selectedClassFilter, selectedSubjectFilter]);

  useEffect(() => {
    if (!selectedSessionFilter) return;
    if (sessionOptions.some((item) => item.value === selectedSessionFilter)) return;
    setSelectedSessionFilter("");
  }, [selectedSessionFilter, sessionOptions]);

  const openType = (type: StudentActionType) => {
    setSearchParams({ view: type });
  };

  const openDetails = (type: StudentActionType, item: SubmissionItem) => {
    if (item.status === "not_uploaded" || !item.fileDataUrl) return;
    setDetails({ type, item });
  };

  const handleDeleteSubmission = async (type: StudentActionType, submissionId: string) => {
    const session = getSession();
    if (!session?.id) return;

    setDeletingId(submissionId);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/teacher/submissions/${encodeURIComponent(type)}/${encodeURIComponent(submissionId)}?userId=${encodeURIComponent(session.id)}&schoolId=${encodeURIComponent(session.schoolId || "")}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to delete submission (HTTP ${response.status})`);
      }
      await loadSubmissions();
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-2xl font-extrabold text-slate-900">
              {activeType ? sectionConfig[activeType].label : "Student Submission Matrix"}
            </h3>
            {activeType ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSearchParams({});
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : null}
          </div>
        </div>

        {activeType ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Class with Section</span>
              <select
                value={selectedClassFilter}
                onChange={(event) => setSelectedClassFilter(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
              >
                <option value="">All Classes</option>
                {classOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Subject</span>
              <select
                value={selectedSubjectFilter}
                onChange={(event) => setSelectedSubjectFilter(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
              >
                <option value="">All Subjects</option>
                {subjectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Day-wise / Date</span>
              <input
                type="date"
                value={selectedDateFilter}
                onChange={(event) => setSelectedDateFilter(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
              />
            </label>

          </div>
        ) : null}

        {!activeType ? (
          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex min-w-[220px] flex-col gap-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Class with Section</span>
              <select
                value={selectedClassFilter}
                onChange={(event) => setSelectedClassFilter(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
              >
                <option value="">All Classes</option>
                {classOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-w-[220px] flex-col gap-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Subject</span>
              <select
                value={selectedSubjectFilter}
                onChange={(event) => setSelectedSubjectFilter(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
              >
                <option value="">All Subjects</option>
                {subjectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        <div className={activeType ? "mt-4" : "mt-4"}>
          <label className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={activeType ? "Search by student name or roll number" : "Search the submission matrix by student name or roll number"}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
        </div>

        {!activeType ? (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs font-black uppercase tracking-[0.14em] text-slate-700">
                  <th className="rounded-l-2xl bg-[#dff3f2] px-4 py-3 shadow-sm">Student Name</th>
                  <th className="bg-[#dff3f2] px-4 py-3 shadow-sm">
                    <button type="button" onClick={() => openType("assessments")} className="font-black uppercase tracking-[0.14em] text-slate-700 transition hover:text-[#36ADAA]">
                      Assessment
                    </button>
                  </th>
                  <th className="rounded-r-2xl bg-[#dff3f2] px-4 py-3 shadow-sm">
                    <button type="button" onClick={() => openType("homework")} className="font-black uppercase tracking-[0.14em] text-slate-700 transition hover:text-[#36ADAA]">
                      Homework
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMatrixRows.map((row) => (
                  <tr key={`${row.studentName}-${row.rollNo}`} className="align-middle">
                    <td className="rounded-l-2xl bg-slate-50 px-3 py-4">
                      <div className="font-bold text-slate-800">{row.studentName}</div>
                      <div className="mt-1 text-sm text-slate-500">{row.className} | Roll No. {row.rollNo}</div>
                    </td>
                    {(["assessments", "homework"] as StudentActionType[]).map((type, index) => {
                      const item = row[type];
                      return (
                        <td key={type} className={`${index === 1 ? "rounded-r-2xl" : ""} bg-slate-50 px-3 py-4`}>
                          {item ? (
                            item.fileDataUrl && item.status !== "not_uploaded" ? (
                              <button
                                type="button"
                                onClick={() => openDetails(type, item)}
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass(item.status)}`}
                              >
                                {formatStatus(item.status)}
                              </button>
                            ) : (
                              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass(item.status)}`}>
                                {formatStatus(item.status)}
                              </span>
                            )
                          ) : (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
                              Not Uploaded
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
            No submission records match the selected filters.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs font-black uppercase tracking-[0.14em] text-slate-700">
                  <th className="rounded-l-2xl bg-[#dff3f2] px-4 py-3 shadow-sm">Student Name</th>
                  <th className="bg-[#dff3f2] px-4 py-3 shadow-sm">Submission</th>
                  <th className="bg-[#dff3f2] px-4 py-3 shadow-sm">Upload Status</th>
                  <th className="bg-[#dff3f2] px-4 py-3 shadow-sm">Uploaded File</th>
                  <th className="bg-[#dff3f2] px-4 py-3 shadow-sm">Submission Date</th>
                  <th className="rounded-r-2xl bg-[#dff3f2] px-4 py-3 shadow-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((item) => (
                  <tr key={item.id} className="align-middle">
                    <td className="rounded-l-2xl bg-slate-50 px-3 py-4">
                      <div className="font-bold text-slate-800">{item.studentName}</div>
                      <div className="mt-1 text-sm text-slate-500">{item.className} | Roll No. {item.rollNo}</div>
                    </td>
                    <td className="bg-slate-50 px-3 py-4 text-sm text-slate-600">{buildSubmissionLabel(item)}</td>
                    <td className="bg-slate-50 px-3 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass(item.status)}`}>
                        {formatStatus(item.status)}
                      </span>
                    </td>
                    <td className="bg-slate-50 px-3 py-4 text-sm text-slate-600">
                      {item.fileDataUrl ? (
                        <button
                          type="button"
                          onClick={() => void openFile(item.fileDataUrl!, item.fileName)}
                          className="font-semibold text-[#36ADAA] underline underline-offset-2 hover:text-[#2d9491]"
                        >
                          {item.fileName || "Open File"}
                        </button>
                      ) : (
                        item.fileName || "Not Uploaded"
                      )}
                    </td>
                    <td className="bg-slate-50 px-3 py-4 text-sm text-slate-600">
                      {item.uploadedAt ? new Date(item.uploadedAt).toLocaleString() : "Not Available"}
                    </td>
                    <td className="rounded-r-2xl bg-slate-50 px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        {item.fileDataUrl ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void openFile(item.fileDataUrl!, item.fileName)}
                              title="View File"
                              aria-label="View File"
                              className="inline-flex items-center rounded-2xl border border-sky-200 bg-sky-50 p-2.5 text-sky-700 transition hover:bg-sky-100"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadFile(item.fileDataUrl!, item.fileName)}
                              title="Download"
                              aria-label="Download"
                              className="inline-flex items-center rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 transition hover:bg-slate-100"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void handleDeleteSubmission(activeType, item.id)}
                          disabled={deletingId === item.id}
                          title={deletingId === item.id ? "Deleting..." : "Delete"}
                          aria-label={deletingId === item.id ? "Deleting..." : "Delete"}
                          className="inline-flex items-center rounded-2xl border border-rose-200 bg-rose-50 p-2.5 text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {details ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-[30px] border border-white/80 bg-white/95 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#36ADAA]">Submission Details</p>
                <h3 className="mt-2 font-display text-2xl font-extrabold text-slate-900">
                  {details.type === "assessments" ? "Assessment Submission Details" : "Homework Submission Details"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetails(null)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Student Name</div>
                <div className="mt-2 text-sm font-semibold text-slate-800">{details.item.studentName}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Roll Number</div>
                <div className="mt-2 text-sm font-semibold text-slate-800">{details.item.rollNo}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4 md:col-span-2">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {details.type === "assessments" ? "Assessment Title" : "Homework Title"}
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-800">{details.item.title}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Upload Status</div>
                <div className="mt-2">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass(details.item.status)}`}>
                    {formatStatus(details.item.status)}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Uploaded At</div>
                <div className="mt-2 text-sm font-semibold text-slate-800">
                  {details.item.uploadedAt ? new Date(details.item.uploadedAt).toLocaleString() : "Not Available"}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Uploaded File Name</div>
                <div className="mt-2 break-all text-sm font-semibold text-slate-800">{details.item.fileName || "Not Available"}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">File Type</div>
                <div className="mt-2 text-sm font-semibold text-slate-800">
                  {details.item.fileDataUrl?.match(/^data:([^;]+)/)?.[1] || "Not Available"}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {details.item.fileDataUrl ? (
                <>
                  <button
                    type="button"
                    onClick={() => void openFile(details.item.fileDataUrl!, details.item.fileName)}
                    className="inline-flex items-center rounded-2xl bg-[#36ADAA] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#36ADAA]/25"
                  >
                    View / Open File
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadFile(details.item.fileDataUrl!, details.item.fileName)}
                    className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm"
                  >
                    Download
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
