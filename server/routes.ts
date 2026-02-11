import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { NudgeEngine } from "./services/nudge-engine";
import { RecommendationEngine } from "./services/recommendation-engine";
import { getWorkflowDefinitions, getWorkflowByName } from "./services/workflow-integration";
import {
  updateOnboardingSchema,
  updateProfileSchema,
  updateNudgeSettingsSchema,
  nudgeResponseSchema,
  insertUserSchema,
} from "@shared/schema";

const nudgeEngine = new NudgeEngine(storage);
const recommendationEngine = new RecommendationEngine(storage);

// Simple session: store userId in a map keyed by session token.
// In production, replace with proper session middleware.
const sessions = new Map<string, string>();

function getUserId(req: any): string | null {
  const token = req.headers["x-session-token"] as string;
  if (token && sessions.has(token)) {
    return sessions.get(token)!;
  }
  // For demo purposes, accept x-user-id header directly
  return (req.headers["x-user-id"] as string) || null;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {

  // ── Auth (simplified) ────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const existing = await storage.getUserByUsername(parsed.data.username);
    if (existing) {
      return res.status(409).json({ error: "Username already taken" });
    }
    const user = await storage.createUser(parsed.data);
    // Create default nudge settings and empty onboarding
    await storage.upsertNudgeSettings(user.id, {});
    await storage.upsertOnboarding(user.id, { currentStep: 0 });
    const token = crypto.randomUUID();
    sessions.set(token, user.id);
    res.json({ user: { id: user.id, username: user.username }, token });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await storage.getUserByUsername(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = crypto.randomUUID();
    sessions.set(token, user.id);
    res.json({ user: { id: user.id, username: user.username }, token });
  });

  // ── Onboarding ───────────────────────────────────────────────
  app.get("/api/onboarding", async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const state = await storage.getOnboarding(userId);
    res.json(state || { currentStep: 0, completedSteps: [], completed: false });
  });

  app.put("/api/onboarding", async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const parsed = updateOnboardingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const state = await storage.upsertOnboarding(userId, parsed.data);
    res.json(state);
  });

  app.post("/api/onboarding/complete-step", async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const { step, data } = req.body;
    if (typeof step !== "number" || step < 0 || step > 5) {
      return res.status(400).json({ error: "Invalid step number (0-5)" });
    }

    const current = await storage.getOnboarding(userId);
    const stepSet = new Set([...(current?.completedSteps || []), step]);
    const completedSteps = Array.from(stepSet).sort();
    const updates: Record<string, any> = {
      currentStep: step + 1,
      completedSteps,
    };

    // Process step-specific data
    if (step === 1 && data?.permissions) {
      updates.permissionsGranted = data.permissions;
    }
    if (step === 2 && data?.watchPaired !== undefined) {
      updates.watchPaired = data.watchPaired;
    }
    if (step === 3 && data?.dataSource) {
      updates.dataSource = data.dataSource;
    }
    if (step === 4 && data?.profile) {
      await storage.upsertProfile(userId, data.profile);
    }
    if (step === 5) {
      updates.completed = true;
      // Generate initial recommendations on onboarding completion
      await recommendationEngine.generateRecommendations(userId);
    }

    const state = await storage.upsertOnboarding(userId, updates);
    res.json(state);
  });

  // ── User Profile ─────────────────────────────────────────────
  app.get("/api/profile", async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const profile = await storage.getProfile(userId);
    res.json(profile || {});
  });

  app.put("/api/profile", async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const profile = await storage.upsertProfile(userId, parsed.data);
    res.json(profile);
  });

  // ── Nudge Settings ───────────────────────────────────────────
  app.get("/api/nudge-settings", async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const settings = await storage.getNudgeSettings(userId);
    res.json(settings || { maxNudgesPerDay: 8, quietHoursStart: "22:00", quietHoursEnd: "07:00", autoBackoffEnabled: true });
  });

  app.put("/api/nudge-settings", async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const parsed = updateNudgeSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const settings = await storage.upsertNudgeSettings(userId, parsed.data);
    res.json(settings);
  });

  // ── Nudge History & Responses ────────────────────────────────
  app.get("/api/nudges", async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await storage.getNudgeHistory(userId, limit);
    res.json(history);
  });

  app.post("/api/nudges/:id/respond", async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const parsed = nudgeResponseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const updated = await nudgeEngine.handleNudgeResponse(
      req.params.id,
      parsed.data.action,
      parsed.data.snoozeDurationMinutes,
    );
    if (!updated) {
      return res.status(404).json({ error: "Nudge not found" });
    }
    res.json(updated);
  });

  app.get("/api/nudges/can-send", async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const result = await nudgeEngine.canSendNudge(userId);
    res.json(result);
  });

  // ── Recommendations ──────────────────────────────────────────
  app.get("/api/recommendations", async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const status = req.query.status as string | undefined;
    const recs = await storage.getRecommendations(userId, status);
    res.json(recs);
  });

  app.post("/api/recommendations/generate", async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const recs = await recommendationEngine.generateRecommendations(userId);
    res.json(recs);
  });

  app.post("/api/recommendations/:id/accept", async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const rec = await storage.updateRecommendation(req.params.id, { status: "accepted" });
    if (!rec) return res.status(404).json({ error: "Recommendation not found" });
    res.json(rec);
  });

  app.post("/api/recommendations/:id/dismiss", async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const rec = await storage.updateRecommendation(req.params.id, { status: "dismissed" });
    if (!rec) return res.status(404).json({ error: "Recommendation not found" });
    res.json(rec);
  });

  // ── Activity Sessions ────────────────────────────────────────
  app.get("/api/activity", async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const limit = parseInt(req.query.limit as string) || 20;
    const sessions = await storage.getActivitySessions(userId, limit);
    const currentLevel = await storage.getRecentActivityLevel(userId);
    res.json({ sessions, currentLevel });
  });

  app.post("/api/activity/sync", async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const { type, startTime, endTime, durationMinutes, caloriesBurned, heartRateAvg, heartRateMax, stepsCount, distanceMeters, intensityLevel } = req.body;
    if (!type || !startTime) {
      return res.status(400).json({ error: "type and startTime are required" });
    }
    const session = await storage.createActivitySession({
      userId,
      type,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      durationMinutes: durationMinutes || null,
      caloriesBurned: caloriesBurned || null,
      heartRateAvg: heartRateAvg || null,
      heartRateMax: heartRateMax || null,
      stepsCount: stepsCount || null,
      distanceMeters: distanceMeters || null,
      intensityLevel: intensityLevel || null,
    });

    // Auto-generate fresh recommendations after syncing activity
    await recommendationEngine.generateRecommendations(userId);

    res.json(session);
  });

  // ── Garmin Sync (simulated) ──────────────────────────────────
  app.post("/api/garmin/sync", async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    // Simulate Garmin data sync with realistic sample data
    const now = new Date();
    const sampleActivities = [
      {
        type: "running",
        startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 1.5 * 60 * 60 * 1000),
        durationMinutes: 30,
        caloriesBurned: 320,
        heartRateAvg: 145,
        heartRateMax: 172,
        stepsCount: 4200,
        distanceMeters: 5000,
        intensityLevel: "high" as const,
      },
    ];

    const created = [];
    for (const activity of sampleActivities) {
      const session = await storage.createActivitySession({
        userId,
        ...activity,
      });
      created.push(session);
    }

    // Generate recommendations based on new data
    const recs = await recommendationEngine.generateRecommendations(userId);

    // Send nudges for top recommendations
    for (const rec of recs.slice(0, 2)) {
      await nudgeEngine.sendNudge(userId, rec.type, rec.title, rec.description, rec.details);
    }

    res.json({
      synced: true,
      activitiesRecorded: created.length,
      recommendationsGenerated: recs.length,
      message: "Garmin data synced successfully",
    });
  });

  // ── bilko-flow Workflows ─────────────────────────────────────
  app.get("/api/workflows", async (_req, res) => {
    const workflows = getWorkflowDefinitions();
    res.json(workflows);
  });

  app.get("/api/workflows/:name", async (req, res) => {
    const workflow = getWorkflowByName(req.params.name);
    if (!workflow) return res.status(404).json({ error: "Workflow not found" });
    res.json(workflow);
  });

  // ── Dashboard Summary ────────────────────────────────────────
  app.get("/api/dashboard", async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const [onboarding, profile, settings, nudges, recs, activityData] = await Promise.all([
      storage.getOnboarding(userId),
      storage.getProfile(userId),
      storage.getNudgeSettings(userId),
      storage.getNudgeHistory(userId, 10),
      storage.getRecommendations(userId, "pending"),
      storage.getActivitySessions(userId, 5),
    ]);

    const activityLevel = await storage.getRecentActivityLevel(userId);

    res.json({
      onboardingComplete: onboarding?.completed || false,
      currentStep: onboarding?.currentStep || 0,
      profile: profile || null,
      nudgeSettings: settings || null,
      recentNudges: nudges,
      pendingRecommendations: recs,
      recentActivity: activityData,
      activityLevel,
    });
  });

  return httpServer;
}
