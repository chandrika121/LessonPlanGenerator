import { useEffect, useState } from "react";
import { BarChart3, Download, Eye, FileText, FileSpreadsheet } from "lucide-react";
import { getReports, downloadReport } from "../../services/principalServiceApi";
import type { ReportData } from "../../services/principalServiceApi";

interface ReportItem {
  id: string;
  title: string;
  description: string;
  icon: typeof FileText;
  reportKey: keyof ReportData;
}

const REPORTS: ReportItem[] = [
  { id: "teacher", title: "Teacher Report", description: "Summary of all teachers, their status, and activity metrics.", icon: FileText, reportKey: "teacherReport" },
  { id: "class", title: "Class Report", description: "Overview of all classrooms, student counts, and class performance.", icon: FileText, reportKey: "classReport" },
  { id: "evaluation", title: "Evaluation Report", description: "Evaluation results, grade distributions, and performance analytics.", icon: BarChart3, reportKey: "evaluationReport" },
  { id: "school", title: "School Performance Report", description: "Overall school performance metrics and trend analysis.", icon: FileSpreadsheet, reportKey: "schoolPerformanceReport" },
  { id: "student", title: "Student Performance Report", description: "Individual student performance data and grade summaries.", icon: FileText, reportKey: "studentPerformanceReport" },
];

export function ReportsPage() {
  const [reports, setReports] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    getReports()
      .then(setReports)
      .catch(() => setReports(null))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (reportKey: keyof ReportData, title: string, format: "pdf" | "xlsx") => {
    setDownloading(reportKey);
    try {
      const blob = await downloadReport(reportKey, format);
      // Try to extract filename from Content-Disposition header, fallback to title-based name
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, "_").toLowerCase()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert(`Failed to download report: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-6 py-4 shadow-lg">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#36ADAA] border-t-transparent" />
          <span className="text-sm font-semibold text-slate-600">Loading reports...</span>
        </div>
      </div>
    );
  }

  if (!reports) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="rounded-2xl bg-white/90 px-8 py-6 shadow-lg text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-lg font-bold text-slate-800">Reports not available</p>
          <p className="mt-2 text-sm text-slate-500">Reports will be generated once data is available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[fadeInUp_0.4s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold text-slate-900">Reports</h2>
          <p className="mt-1 text-sm text-slate-500">View and download school performance reports</p>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          const data = reports[report.reportKey];
          const dataEntries = data ? Object.entries(data as Record<string, unknown>) : [];

          return (
            <div
              key={report.id}
              className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#36ADAA]/10 p-3 text-[#36ADAA]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg font-extrabold text-slate-900">{report.title}</h3>
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">{report.description}</p>
                </div>
              </div>

              {/* Data Preview */}
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                {dataEntries.length > 0 ? (
                  <div className="space-y-2">
                    {dataEntries.slice(0, 4).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{String(value)}</span>
                      </div>
                    ))}
                    {dataEntries.length > 4 && (
                      <p className="text-[11px] font-semibold text-slate-400 text-center pt-1">
                        +{dataEntries.length - 4} more fields
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2">No data available</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(report.reportKey, report.title, "pdf")}
                  disabled={downloading === report.reportKey}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {downloading === report.reportKey ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(report.reportKey, report.title, "xlsx")}
                  disabled={downloading === report.reportKey}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {downloading === report.reportKey ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                  ) : (
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                  )}
                  Excel
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
