import type { AnnouncementItem } from "../types/announcements";

const ANNOUNCEMENTS_KEY = "lms:principal-announcements";

export function readAnnouncements(): AnnouncementItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ANNOUNCEMENTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as AnnouncementItem[]) : [];
    return parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export function writeAnnouncements(items: AnnouncementItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage failures to keep UX usable.
  }
}

export function addAnnouncement(item: AnnouncementItem) {
  const current = readAnnouncements();
  writeAnnouncements([item, ...current]);
}

export function updateAnnouncement(updatedItem: AnnouncementItem) {
  const current = readAnnouncements();
  writeAnnouncements(current.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
}

export function deleteAnnouncement(id: string) {
  const current = readAnnouncements();
  writeAnnouncements(current.filter((item) => item.id !== id));
}
