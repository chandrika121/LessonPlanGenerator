import type { PublishedStudentArtifact } from "../types/student-content";

function normalizeValue(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function normalizeTextKey(value: unknown) {
  return normalizeValue(value).replace(/[^a-z0-9]+/g, " ").trim();
}

function parsePublishedAt(value: unknown) {
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildArtifactSemanticKey(item: PublishedStudentArtifact) {
  const sessionIdentity =
    normalizeValue(item.sessionId) ||
    normalizeValue(item.generatedSessionKey) ||
    `${Number(item.sessionNumber || 0)}`;

  return [
    normalizeValue(item.kind),
    normalizeTextKey(item.subjectName || item.subject || item.subjectId),
    normalizeTextKey(item.classId || item.className || item.gradeLevel),
    normalizeTextKey(item.section),
    sessionIdentity,
    normalizeTextKey(item.sessionTitle),
  ].join("::");
}

export function dedupePublishedStudentArtifacts(items: PublishedStudentArtifact[]) {
  const deduped = new Map<string, PublishedStudentArtifact>();

  for (const item of items) {
    const key = buildArtifactSemanticKey(item);
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, item);
      continue;
    }

    const existingPublishedAt = parsePublishedAt(existing.publishedAt);
    const nextPublishedAt = parsePublishedAt(item.publishedAt);

    if (nextPublishedAt > existingPublishedAt) {
      deduped.set(key, item);
      continue;
    }

    if (nextPublishedAt === existingPublishedAt && normalizeValue(item.id) > normalizeValue(existing.id)) {
      deduped.set(key, item);
    }
  }

  return Array.from(deduped.values());
}
