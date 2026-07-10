import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kamalaniketan-lms";
const shouldWrite = process.argv.includes("--write");
const PlanningWorkspaceModel = mongoose.models.PlanningWorkspace || mongoose.model(
  "PlanningWorkspace",
  new mongoose.Schema(
    {
      generationScope: { type: mongoose.Schema.Types.Mixed, default: {} },
      academicConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
      curriculumSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
      sessionAllocation: { type: mongoose.Schema.Types.Mixed, default: {} },
      classId: { type: String, default: "" },
      subjectId: { type: String, default: "" },
      sectionId: { type: String, default: "" },
    },
    { strict: false, collection: "planningworkspaces" },
  ),
);

function parseSessionNumberFromKey(value) {
  const candidate = String(value || "").trim();
  if (!candidate) return 0;
  const match = candidate.match(/session-(\d+)__/i) || candidate.match(/session-(\d+)/i);
  if (match?.[1]) {
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  const plainNumber = Number(candidate);
  return Number.isFinite(plainNumber) && plainNumber > 0 ? plainNumber : 0;
}

function normalizeKind(kind) {
  const normalized = String(kind || "").trim().toLowerCase();
  return ["notes", "homework", "assessments", "quizzes"].includes(normalized) ? normalized : "";
}

async function main() {
  await mongoose.connect(MONGODB_URI);

  const workspaces = await PlanningWorkspaceModel.find({}).lean();
  let repairedWorkspaces = 0;
  let repairedSessions = 0;
  let removedMissingPublicationEntries = 0;
  const duplicateBuckets = new Map();

  for (const workspace of workspaces) {
    const generatedSessions =
      workspace?.generationScope?.generatedSessions &&
      typeof workspace.generationScope.generatedSessions === "object"
        ? { ...workspace.generationScope.generatedSessions }
        : {};
    const studentPublications =
      workspace?.generationScope?.studentPublications &&
      typeof workspace.generationScope.studentPublications === "object"
        ? { ...workspace.generationScope.studentPublications }
        : {};

    let workspaceChanged = false;

    for (const [generatedSessionKey, session] of Object.entries(generatedSessions)) {
      const parsedSessionNumber = parseSessionNumberFromKey(generatedSessionKey);
      const currentSessionNumber = Number(session?.sessionNumber || 0);
      if (parsedSessionNumber > 0 && currentSessionNumber !== parsedSessionNumber) {
        generatedSessions[generatedSessionKey] = {
          ...(session && typeof session === "object" ? session : {}),
          sessionKey: String(session?.sessionKey || generatedSessionKey).trim() || generatedSessionKey,
          sessionNumber: parsedSessionNumber,
        };
        workspaceChanged = true;
        repairedSessions += 1;
      }
    }

    for (const [publicationSessionKey, publicationEntry] of Object.entries(studentPublications)) {
      const normalizedSessionKey = String(publicationSessionKey || "").trim();
      const session = generatedSessions[normalizedSessionKey];
      if (!normalizedSessionKey || !session) {
        delete studentPublications[publicationSessionKey];
        workspaceChanged = true;
        removedMissingPublicationEntries += 1;
        continue;
      }

      const parsedSessionNumber = parseSessionNumberFromKey(normalizedSessionKey);
      const subjectName = String(
        workspace?.academicConfig?.subject || workspace?.curriculumSnapshot?.subject || ""
      ).trim();
      const classId = String(
        workspace?.classId || workspace?.academicConfig?.className || workspace?.curriculumSnapshot?.gradeLevel || ""
      ).trim();
      const grade = String(
        workspace?.academicConfig?.className || workspace?.curriculumSnapshot?.gradeLevel || ""
      ).trim();
      const section = String(workspace?.academicConfig?.section || workspace?.sectionId || "").trim();
      const termNumber = Number(workspace?.sessionAllocation?.selectedTermSummary?.termNumber || 0) || null;

      const nextEntry = {
        ...(publicationEntry && typeof publicationEntry === "object" ? publicationEntry : {}),
      };

      for (const [kindKey, rawValue] of Object.entries(nextEntry)) {
        const kind = normalizeKind(kindKey);
        if (!kind) continue;

        const published = rawValue === true || Boolean(rawValue?.published);
        const publishedAt = String(rawValue?.publishedAt || "").trim();
        nextEntry[kind] = {
          ...(rawValue && typeof rawValue === "object" ? rawValue : {}),
          published,
          publishedAt: published ? publishedAt || null : null,
          workspaceId: String(workspace?._id || ""),
          generatedSessionKey: normalizedSessionKey,
          sessionNumber: Number(rawValue?.sessionNumber || 0) > 0 ? Number(rawValue.sessionNumber) : parsedSessionNumber,
          sessionTitle: String(rawValue?.sessionTitle || session?.title || session?.sessionTitle || "").trim(),
          subjectId: String(rawValue?.subjectId || workspace?.subjectId || "").trim(),
          subjectName: String(rawValue?.subjectName || subjectName).trim(),
          classId: String(rawValue?.classId || classId).trim(),
          grade: String(rawValue?.grade || grade).trim(),
          section: String(rawValue?.section || section).trim(),
          termNumber: Number(rawValue?.termNumber || termNumber || 0) || null,
          contentType: kind,
        };

        const duplicateKey = [
          String(workspace?._id || ""),
          subjectName.toLowerCase(),
          classId.toLowerCase(),
          String(termNumber || ""),
          normalizedSessionKey.toLowerCase(),
          kind,
        ].join("::");
        if (!duplicateBuckets.has(duplicateKey)) {
          duplicateBuckets.set(duplicateKey, []);
        }
        duplicateBuckets.get(duplicateKey).push({
          workspaceId: String(workspace?._id || ""),
          generatedSessionKey: normalizedSessionKey,
          kind,
          publishedAt,
          sessionTitle: String(session?.title || session?.sessionTitle || "").trim(),
        });
      }

      studentPublications[normalizedSessionKey] = nextEntry;
      workspaceChanged = true;
    }

    if (workspaceChanged && shouldWrite) {
      await PlanningWorkspaceModel.updateOne(
        { _id: workspace._id },
        {
          $set: {
            "generationScope.generatedSessions": generatedSessions,
            "generationScope.studentPublications": studentPublications,
          },
        },
      );
    }

    if (workspaceChanged) {
      repairedWorkspaces += 1;
    }
  }

  const duplicateReport = Array.from(duplicateBuckets.entries())
    .filter(([, entries]) => entries.length > 1)
    .map(([bucket, entries]) => ({ bucket, entries }));

  console.log(JSON.stringify({
    mode: shouldWrite ? "write" : "dry-run",
    repairedWorkspaces,
    repairedSessions,
    removedMissingPublicationEntries,
    duplicateGroups: duplicateReport.length,
    duplicateReport,
  }, null, 2));

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("[repair-student-publications] Failed:", error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
