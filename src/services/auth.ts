import type { AuthUser, RegisterPayload } from "../types/auth";
import { buildApiUrl } from "../utils/apiBaseUrl";

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || "Request failed.");
  }
  return response.json() as Promise<T>;
}

export async function authenticateUser(email: string, password: string) {
  const response = await fetch(buildApiUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  const data = await parseJsonResponse<{
    success: boolean;
    user: AuthUser;
  }>(response);

  return data.user;
}

export async function registerUser(payload: RegisterPayload) {
  const response = await fetch(buildApiUrl("/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await parseJsonResponse<{
    success: boolean;
    user: AuthUser;
  }>(response);

  return data.user;
}

export async function getProfile(userId: string, schoolId: string) {
  const response = await fetch(buildApiUrl(`/api/profile?userId=${encodeURIComponent(userId)}&schoolId=${encodeURIComponent(schoolId)}`));
  const data = await parseJsonResponse<{ success: boolean; user: AuthUser }>(response);
  return data.user;
}

export async function updateProfile(userId: string, schoolId: string, updates: Partial<AuthUser>) {
  const response = await fetch(buildApiUrl(`/api/profile?userId=${encodeURIComponent(userId)}&schoolId=${encodeURIComponent(schoolId)}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  const data = await parseJsonResponse<{ success: boolean; user: AuthUser }>(response);
  return data.user;
}
