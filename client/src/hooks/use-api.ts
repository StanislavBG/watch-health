import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApiRequest } from "./use-auth";

async function authGet<T>(url: string): Promise<T> {
  const res = await authApiRequest("GET", url);
  return res.json();
}

// ── Dashboard ──────────────────────────────────────────────────
export function useDashboard() {
  return useQuery({
    queryKey: ["/api/dashboard"],
    queryFn: () => authGet<any>("/api/dashboard"),
    staleTime: 30000,
  });
}

// ── Onboarding ─────────────────────────────────────────────────
export function useOnboarding() {
  return useQuery({
    queryKey: ["/api/onboarding"],
    queryFn: () => authGet<any>("/api/onboarding"),
  });
}

export function useCompleteOnboardingStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ step, data }: { step: number; data?: any }) => {
      const res = await authApiRequest("POST", "/api/onboarding/complete-step", { step, data });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/onboarding"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });
}

// ── Profile ────────────────────────────────────────────────────
export function useProfile() {
  return useQuery({
    queryKey: ["/api/profile"],
    queryFn: () => authGet<any>("/api/profile"),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await authApiRequest("PUT", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/profile"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });
}

// ── Nudge Settings ─────────────────────────────────────────────
export function useNudgeSettings() {
  return useQuery({
    queryKey: ["/api/nudge-settings"],
    queryFn: () => authGet<any>("/api/nudge-settings"),
  });
}

export function useUpdateNudgeSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await authApiRequest("PUT", "/api/nudge-settings", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/nudge-settings"] });
    },
  });
}

// ── Nudges ─────────────────────────────────────────────────────
export function useNudges(limit = 20) {
  return useQuery({
    queryKey: ["/api/nudges", limit],
    queryFn: () => authGet<any[]>(`/api/nudges?limit=${limit}`),
    staleTime: 15000,
  });
}

export function useRespondToNudge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ nudgeId, action, snoozeDurationMinutes }: { nudgeId: string; action: string; snoozeDurationMinutes?: number }) => {
      const res = await authApiRequest("POST", `/api/nudges/${nudgeId}/respond`, { action, snoozeDurationMinutes });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/nudges"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });
}

// ── Recommendations ────────────────────────────────────────────
export function useRecommendations(status?: string) {
  const url = status ? `/api/recommendations?status=${status}` : "/api/recommendations";
  return useQuery({
    queryKey: ["/api/recommendations", status],
    queryFn: () => authGet<any[]>(url),
    staleTime: 30000,
  });
}

export function useGenerateRecommendations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await authApiRequest("POST", "/api/recommendations/generate");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/recommendations"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });
}

export function useAcceptRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authApiRequest("POST", `/api/recommendations/${id}/accept`);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/recommendations"] });
    },
  });
}

export function useDismissRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authApiRequest("POST", `/api/recommendations/${id}/dismiss`);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/recommendations"] });
    },
  });
}

// ── Activity ───────────────────────────────────────────────────
export function useActivity() {
  return useQuery({
    queryKey: ["/api/activity"],
    queryFn: () => authGet<any>("/api/activity"),
    staleTime: 30000,
  });
}

export function useGarminSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await authApiRequest("POST", "/api/garmin/sync");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/activity"] });
      qc.invalidateQueries({ queryKey: ["/api/recommendations"] });
      qc.invalidateQueries({ queryKey: ["/api/nudges"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });
}
