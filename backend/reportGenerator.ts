import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

// ─── Report Data Sources (mirrors frontend ReportData) ────────────────────

export interface ReportRow {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ReportMeta {
  title: string;
  subtitle: string;
  columns: { header: string; key: string; width?: number }[];
  rows: ReportRow[];
}

function buildTeacherReport(): ReportMeta {
  return {
    title: "Teacher Report",
    subtitle: `Generated on ${new Date().toLocaleDateString()}`,
    columns: [
      { header: "Metric", key: "metric", width: 30 },
      { header: "Value", key: "value", width: 15 },
    ],
    rows: [
      { metric: "Generated", value: new Date().toISOString().split("T")[0] },
      { metric: "Total Teachers", value: 8 },
      { metric: "Active Teachers", value: 5 },
      { metric: "Offline Teachers", value: 3 },
    ],
  };
}

function buildClassReport(): ReportMeta {
  return {
    title: "Class Report",
    subtitle: `Generated on ${new Date().toLocaleDateString()}`,
    columns: [
      { header: "Metric", key: "metric", width: 30 },
      { header: "Value", key: "value", width: 15 },
    ],
    rows: [
      { metric: "Classrooms", value: 10 },
      { metric: "Total Students", value: 485 },
      { metric: "Average Class Size", value: 48 },
    ],
  };
}

function buildEvaluationReport(): ReportMeta {
  return {
    title: "Evaluation Report",
    subtitle: `Generated on ${new Date().toLocaleDateString()}`,
    columns: [
      { header: "Metric", key: "metric", width: 30 },
      { header: "Value", key: "value", width: 15 },
    ],
    rows: [
      { metric: "Total Evaluations", value: 96 },
      { metric: "Average Score", value: 74 },
      { metric: "Highest Performing Class", value: "Class 6" },
    ],
  };
}

function buildSchoolPerformanceReport(): ReportMeta {
  return {
    title: "School Performance Report",
    subtitle: `Generated on ${new Date().toLocaleDateString()}`,
    columns: [
      { header: "Metric", key: "metric", width: 30 },
      { header: "Value", key: "value", width: 15 },
    ],
    rows: [
      { metric: "Overall Score", value: 74 },
      { metric: "Curriculum Score", value: 74 },
      { metric: "Evaluation Score", value: 62 },
      { metric: "Performance Score", value: 76 },
    ],
  };
}

function buildStudentPerformanceReport(): ReportMeta {
  return {
    title: "Student Performance Report",
    subtitle: `Generated on ${new Date().toLocaleDateString()}`,
    columns: [
      { header: "Metric", key: "metric", width: 30 },
      { header: "Value", key: "value", width: 15 },
    ],
    rows: [
      { metric: "Toppers", value: 28 },
      { metric: "Average Score", value: 74 },
      { metric: "Needs Improvement", value: 32 },
    ],
  };
}

function getReportMeta(reportKey: string): ReportMeta {
  switch (reportKey) {
    case "teacherReport":
      return buildTeacherReport();
    case "classReport":
      return buildClassReport();
    case "evaluationReport":
      return buildEvaluationReport();
    case "schoolPerformanceReport":
      return buildSchoolPerformanceReport();
    case "studentPerformanceReport":
      return buildStudentPerformanceReport();
    default:
      throw new Error(`Unknown report key: ${reportKey}`);
  }
}

// ─── Excel Generation ─────────────────────────────────────────────────────

export async function generateExcel(reportKey: string, metaOverride?: ReportMeta): Promise<Buffer> {
  const meta = metaOverride || getReportMeta(reportKey);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Kamala Niketan LMS";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(meta.title.replace(/\s+/g, "_"));

  // Title row
  sheet.mergeCells(1, 1, 1, meta.columns.length);
  const titleCell = sheet.getCell("A1");
  titleCell.value = meta.title;
  titleCell.font = { size: 16, bold: true, color: { argb: "FF1F2937" } };
  sheet.getRow(1).height = 30;

  // Subtitle row
  sheet.mergeCells(2, 1, 2, meta.columns.length);
  const subCell = sheet.getCell("A2");
  subCell.value = meta.subtitle;
  subCell.font = { size: 11, color: { argb: "FF64748B" } };
  sheet.getRow(2).height = 22;

  // Header row
  const headerRow = sheet.addRow(meta.columns.map((c) => c.header));
  headerRow.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF36ADAA" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 26;

  // Data rows
  meta.rows.forEach((row, index) => {
    const dataRow = sheet.addRow(meta.columns.map((c) => row[c.key] ?? ""));
    dataRow.height = 22;
    if (index % 2 === 0) {
      dataRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1F5F9" },
      };
    }
    dataRow.alignment = { vertical: "middle" };
  });

  // Column widths
  meta.columns.forEach((col, index) => {
    const colLetter = String.fromCharCode(65 + index);
    sheet.getColumn(colLetter).width = col.width || 20;
  });

  // Borders for header and data
  const borderStyle: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFE2E8F0" } },
    bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
    left: { style: "thin", color: { argb: "FFE2E8F0" } },
    right: { style: "thin", color: { argb: "FFE2E8F0" } },
  };
  headerRow.eachCell((cell) => {
    cell.border = borderStyle;
  });
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 4) {
      row.eachCell((cell) => {
        cell.border = borderStyle;
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// ─── PDF Generation ───────────────────────────────────────────────────────

export async function generatePDF(reportKey: string, metaOverride?: ReportMeta): Promise<Buffer> {
  const meta = metaOverride || getReportMeta(reportKey);

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: meta.title,
        Author: "Kamala Niketan LMS",
        Subject: meta.subtitle,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header bar
    doc.rect(0, 0, doc.page.width, 100).fill("#36ADAA");
    doc.fillColor("#FFFFFF");
    doc.fontSize(22).font("Helvetica-Bold").text("Kamala Niketan", 50, 28, { align: "left" });
    doc.fontSize(11).font("Helvetica").text("School Performance Reports", 50, 56, { align: "left" });

    // Title
    doc.fillColor("#1F2937");
    doc.fontSize(18).font("Helvetica-Bold").text(meta.title, 50, 130, { align: "left" });
    doc.fillColor("#64748B");
    doc.fontSize(11).font("Helvetica").text(meta.subtitle, 50, 158, { align: "left" });

    // Table header
    const tableTop = 200;
    const colWidth = (doc.page.width - 100) / meta.columns.length;

    doc.rect(50, tableTop, doc.page.width - 100, 28).fill("#36ADAA");
    doc.fillColor("#FFFFFF").fontSize(11).font("Helvetica-Bold");
    meta.columns.forEach((col, i) => {
      doc.text(col.header, 50 + i * colWidth + 8, tableTop + 8, {
        width: colWidth - 16,
        align: "left",
      });
    });

    // Table rows
    let yPos = tableTop + 28;
    doc.fontSize(10).font("Helvetica");
    meta.rows.forEach((row, index) => {
      const rowHeight = 24;
      if (index % 2 === 0) {
        doc.rect(50, yPos, doc.page.width - 100, rowHeight).fill("#F1F5F9");
      }
      doc.fillColor("#1F2937");
      meta.columns.forEach((col, i) => {
        const value = String(row[col.key] ?? "");
        doc.text(value, 50 + i * colWidth + 8, yPos + 6, {
          width: colWidth - 16,
          align: "left",
        });
      });
      yPos += rowHeight;
    });

    // Footer
    doc.fillColor("#94A3B8").fontSize(8).font("Helvetica");
    doc.text(
      `Generated by Kamala Niketan LMS on ${new Date().toLocaleString()}`,
      50,
      doc.page.height - 40,
      { align: "center", width: doc.page.width - 100 }
    );

    doc.end();
  });
}
