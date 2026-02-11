import { useState, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";

interface AuthUser {
  id: string;
  username: string;
}

let storedToken: string | null = null;
let storedUser: AuthUser | null = null;

export function getAuthHeaders(): Record<string, string> {
  if (storedToken) {
    return { "x-session-token": storedToken };
  }
  if (storedUser) {
    return { "x-user-id": storedUser.id };
  }
  return {};
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };
  return fetch(url, { ...options, headers, credentials: "include" });
}

export async function authApiRequest(method: string, url: string, data?: unknown): Promise<Response> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(data ? { "Content-Type": "application/json" } : {}),
  };
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  return res;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(storedUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest("POST", "/api/auth/register", { username, password });
      const data = await res.json();
      storedToken = data.token;
      storedUser = data.user;
      setUser(data.user);
      return data.user;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      const data = await res.json();
      storedToken = data.token;
      storedUser = data.user;
      setUser(data.user);
      return data.user;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    storedToken = null;
    storedUser = null;
    setUser(null);
  }, []);

  return { user, loading, error, register, login, logout, isAuthenticated: !!user };
}
