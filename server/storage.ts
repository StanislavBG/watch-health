import {
  type User,
  type InsertUser,
  type OnboardingState,
  type UserProfile,
  type NudgeSettings,
  type NudgeHistoryEntry,
  type Recommendation,
  type ActivitySession,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Onboarding
  getOnboarding(userId: string): Promise<OnboardingState | undefined>;
  upsertOnboarding(userId: string, data: Partial<OnboardingState>): Promise<OnboardingState>;

  // User profiles
  getProfile(userId: string): Promise<UserProfile | undefined>;
  upsertProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile>;

  // Nudge settings
  getNudgeSettings(userId: string): Promise<NudgeSettings | undefined>;
  upsertNudgeSettings(userId: string, data: Partial<NudgeSettings>): Promise<NudgeSettings>;

  // Nudge history
  getNudgeHistory(userId: string, limit?: number): Promise<NudgeHistoryEntry[]>;
  createNudge(nudge: Omit<NudgeHistoryEntry, "id" | "createdAt">): Promise<NudgeHistoryEntry>;
  updateNudge(id: string, data: Partial<NudgeHistoryEntry>): Promise<NudgeHistoryEntry | undefined>;
  getNudgesTodayCount(userId: string): Promise<number>;

  // Recommendations
  getRecommendations(userId: string, status?: string): Promise<Recommendation[]>;
  createRecommendation(rec: Omit<Recommendation, "id" | "createdAt">): Promise<Recommendation>;
  updateRecommendation(id: string, data: Partial<Recommendation>): Promise<Recommendation | undefined>;

  // Activity sessions
  getActivitySessions(userId: string, limit?: number): Promise<ActivitySession[]>;
  createActivitySession(session: Omit<ActivitySession, "id" | "syncedAt">): Promise<ActivitySession>;
  getRecentActivityLevel(userId: string): Promise<string>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private onboarding: Map<string, OnboardingState> = new Map();
  private profiles: Map<string, UserProfile> = new Map();
  private nudgeSettingsMap: Map<string, NudgeSettings> = new Map();
  private nudges: Map<string, NudgeHistoryEntry> = new Map();
  private recs: Map<string, Recommendation> = new Map();
  private activities: Map<string, ActivitySession> = new Map();

  // ── Users ────────────────────────────────────────────────────
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // ── Onboarding ───────────────────────────────────────────────
  async getOnboarding(userId: string): Promise<OnboardingState | undefined> {
    return Array.from(this.onboarding.values()).find((o) => o.userId === userId);
  }

  async upsertOnboarding(userId: string, data: Partial<OnboardingState>): Promise<OnboardingState> {
    const existing = await this.getOnboarding(userId);
    if (existing) {
      const updated: OnboardingState = { ...existing, ...data };
      if (data.completedSteps) {
        const merged = new Set([...existing.completedSteps, ...data.completedSteps]);
        updated.completedSteps = Array.from(merged).sort();
      }
      this.onboarding.set(existing.id, updated);
      return updated;
    }
    const id = randomUUID();
    const entry: OnboardingState = {
      id,
      userId,
      currentStep: 0,
      completedSteps: [],
      permissionsGranted: {},
      watchPaired: false,
      dataSource: null,
      completed: false,
      createdAt: new Date(),
      ...data,
    };
    this.onboarding.set(id, entry);
    return entry;
  }

  // ── Profiles ─────────────────────────────────────────────────
  async getProfile(userId: string): Promise<UserProfile | undefined> {
    return Array.from(this.profiles.values()).find((p) => p.userId === userId);
  }

  async upsertProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const existing = await this.getProfile(userId);
    if (existing) {
      const updated: UserProfile = { ...existing, ...data, updatedAt: new Date() };
      this.profiles.set(existing.id, updated);
      return updated;
    }
    const id = randomUUID();
    const entry: UserProfile = {
      id,
      userId,
      dietaryPattern: null,
      flexibleRules: [],
      allergies: [],
      intolerances: [],
      religiousRestrictions: [],
      excludedIngredients: [],
      healthGoals: [],
      activityLevel: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    this.profiles.set(id, entry);
    return entry;
  }

  // ── Nudge Settings ───────────────────────────────────────────
  async getNudgeSettings(userId: string): Promise<NudgeSettings | undefined> {
    return Array.from(this.nudgeSettingsMap.values()).find((n) => n.userId === userId);
  }

  async upsertNudgeSettings(userId: string, data: Partial<NudgeSettings>): Promise<NudgeSettings> {
    const existing = await this.getNudgeSettings(userId);
    if (existing) {
      const updated: NudgeSettings = { ...existing, ...data };
      this.nudgeSettingsMap.set(existing.id, updated);
      return updated;
    }
    const id = randomUUID();
    const entry: NudgeSettings = {
      id,
      userId,
      maxNudgesPerDay: 8,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
      autoBackoffEnabled: true,
      currentBackoffLevel: 0,
      snoozedTypes: [],
      createdAt: new Date(),
      ...data,
    };
    this.nudgeSettingsMap.set(id, entry);
    return entry;
  }

  // ── Nudge History ────────────────────────────────────────────
  async getNudgeHistory(userId: string, limit = 50): Promise<NudgeHistoryEntry[]> {
    return Array.from(this.nudges.values())
      .filter((n) => n.userId === userId)
      .sort((a, b) => {
        const ta = a.createdAt ? a.createdAt.getTime() : 0;
        const tb = b.createdAt ? b.createdAt.getTime() : 0;
        return tb - ta;
      })
      .slice(0, limit);
  }

  async createNudge(nudge: Omit<NudgeHistoryEntry, "id" | "createdAt">): Promise<NudgeHistoryEntry> {
    const id = randomUUID();
    const entry: NudgeHistoryEntry = { ...nudge, id, createdAt: new Date() };
    this.nudges.set(id, entry);
    return entry;
  }

  async updateNudge(id: string, data: Partial<NudgeHistoryEntry>): Promise<NudgeHistoryEntry | undefined> {
    const existing = this.nudges.get(id);
    if (!existing) return undefined;
    const updated: NudgeHistoryEntry = { ...existing, ...data };
    this.nudges.set(id, updated);
    return updated;
  }

  async getNudgesTodayCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from(this.nudges.values()).filter(
      (n) => n.userId === userId && n.createdAt && n.createdAt >= today,
    ).length;
  }

  // ── Recommendations ──────────────────────────────────────────
  async getRecommendations(userId: string, status?: string): Promise<Recommendation[]> {
    return Array.from(this.recs.values())
      .filter((r) => r.userId === userId && (!status || r.status === status))
      .sort((a, b) => a.priority - b.priority);
  }

  async createRecommendation(rec: Omit<Recommendation, "id" | "createdAt">): Promise<Recommendation> {
    const id = randomUUID();
    const entry: Recommendation = { ...rec, id, createdAt: new Date() };
    this.recs.set(id, entry);
    return entry;
  }

  async updateRecommendation(id: string, data: Partial<Recommendation>): Promise<Recommendation | undefined> {
    const existing = this.recs.get(id);
    if (!existing) return undefined;
    const updated: Recommendation = { ...existing, ...data };
    this.recs.set(id, updated);
    return updated;
  }

  // ── Activity Sessions ────────────────────────────────────────
  async getActivitySessions(userId: string, limit = 20): Promise<ActivitySession[]> {
    return Array.from(this.activities.values())
      .filter((a) => a.userId === userId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  async createActivitySession(session: Omit<ActivitySession, "id" | "syncedAt">): Promise<ActivitySession> {
    const id = randomUUID();
    const entry: ActivitySession = { ...session, id, syncedAt: new Date() };
    this.activities.set(id, entry);
    return entry;
  }

  async getRecentActivityLevel(userId: string): Promise<string> {
    const recent = await this.getActivitySessions(userId, 7);
    if (recent.length === 0) return "unknown";
    const totalCalories = recent.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0);
    const totalMinutes = recent.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
    const highIntensityCount = recent.filter(
      (a) => a.intensityLevel === "high" || a.intensityLevel === "very_high",
    ).length;

    if (highIntensityCount >= 3 || totalMinutes > 300 || totalCalories > 3000) return "very_active";
    if (highIntensityCount >= 1 || totalMinutes > 150 || totalCalories > 1500) return "active";
    if (totalMinutes > 60 || totalCalories > 500) return "moderate";
    return "sedentary";
  }
}

export const storage = new MemStorage();
