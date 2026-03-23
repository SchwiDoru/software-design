import type { AuthResponse, UserRole } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export const AUTH_USER_STORAGE_KEY = "queuesmart.auth-user";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

async function postAuthRequest(path: string, payload: LoginRequest | RegisterRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error ?? `Request failed with status ${response.status}`);
  }

  return data as AuthResponse;
}

export function loginUser(payload: LoginRequest) {
  return postAuthRequest("/auth/login", payload);
}

export function registerUser(payload: RegisterRequest) {
  return postAuthRequest("/auth/register", payload);
}

export function saveAuthenticatedUser(response: AuthResponse) {
  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(response.user));
}

export function getAuthenticatedUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthResponse["user"];
  } catch {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
}

export function clearAuthenticatedUser() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
}

export function hasRequiredRole(role: UserRole, allowedRoles: UserRole[]) {
  return allowedRoles.includes(role);
}

export function getDefaultRouteForRole(role: UserRole) {
  return role === "Patient" ? "/dashboard" : "/admin";
}
