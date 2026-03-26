import type { AuthResponse, User, UserRole } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

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

async function handleAuthResponse(response: Response): Promise<AuthResponse> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error ?? `Request failed with status ${response.status}`);
  }

  return data as AuthResponse;
}

async function postAuthRequest(path: string, payload?: LoginRequest | RegisterRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: payload ? JSON.stringify(payload) : undefined
  });

  return handleAuthResponse(response);
}

export function loginPatient(payload: LoginRequest) {
  return postAuthRequest("/auth/login/patient", payload);
}

export function loginStaff(payload: LoginRequest) {
  return postAuthRequest("/auth/login/staff", payload);
}

export function registerPatient(payload: RegisterRequest) {
  return postAuthRequest("/auth/register", payload);
}

export async function getCurrentAuthenticatedUser(): Promise<User | null> {
  const response = await fetch(`${API_URL}/auth/me`, {
    credentials: "include"
  });

  if (response.status === 401) {
    return null;
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Request failed with status ${response.status}`);
  }

  return (data as AuthResponse).user;
}

export async function logoutUser(): Promise<void> {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include"
  });

  if (response.status === 401) {
    return;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? `Request failed with status ${response.status}`);
  }
}

export function hasRequiredRole(role: UserRole, allowedRoles: UserRole[]) {
  return allowedRoles.includes(role);
}

export function getDefaultRouteForRole(role: UserRole) {
  return role === "Patient" ? "/dashboard" : "/admin";
}
