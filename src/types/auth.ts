export type UserRole = "student" | "teacher" | "principal";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  phone?: string;
  classId?: string;
  section?: string;
  stream?: string;
  designation?: string;
  employeeId?: string;
  subjects?: string[];
  assignedClasses?: string[];
  assignedSections?: string[];
  address?: string;
  bio?: string;
  avatar?: string;
  status?: "active" | "inactive";
}

export interface RegisterPayload {
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  classId?: string;
  section?: string;
  stream?: string;
  subject?: string;
  designation?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}
