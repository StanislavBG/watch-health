import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Users ──────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ── Onboarding State ───────────────────────────────────────────
export const onboardingState = pgTable("onboarding_state", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  currentStep: integer("current_step").notNull().default(0),
  completedSteps: jsonb("completed_steps").$type<number[]>().notNull().default([]),
  permissionsGranted: jsonb("permissions_granted").$type<Record<string, boolean>>().notNull().default({}),
  watchPaired: boolean("watch_paired").notNull().default(false),
  dataSource: text("data_source"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type OnboardingState = typeof onboardingState.$inferSelect;

// ── User Profiles ──────────────────────────────────────────────
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  dietaryPattern: text("dietary_pattern"),
  flexibleRules: jsonb("flexible_rules").$type<string[]>().notNull().default([]),
  allergies: jsonb("allergies").$type<string[]>().notNull().default([]),
  intolerances: jsonb("intolerances").$type<string[]>().notNull().default([]),
  religiousRestrictions: jsonb("religious_restrictions").$type<string[]>().notNull().default([]),
  excludedIngredients: jsonb("excluded_ingredients").$type<string[]>().notNull().default([]),
  healthGoals: jsonb("health_goals").$type<string[]>().notNull().default([]),
  activityLevel: text("activity_level"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UserProfile = typeof userProfiles.$inferSelect;

// ── Nudge Settings ─────────────────────────────────────────────
export const nudgeSettings = pgTable("nudge_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  maxNudgesPerDay: integer("max_nudges_per_day").notNull().default(8),
  quietHoursStart: text("quiet_hours_start").default("22:00"),
  quietHoursEnd: text("quiet_hours_end").default("07:00"),
  autoBackoffEnabled: boolean("auto_backoff_enabled").notNull().default(true),
  currentBackoffLevel: integer("current_backoff_level").notNull().default(0),
  snoozedTypes: jsonb("snoozed_types").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export type NudgeSettings = typeof nudgeSettings.$inferSelect;

// ── Nudge History ──────────────────────────────────────────────
export const nudgeHistory = pgTable("nudge_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  recommendation: jsonb("recommendation").$type<Record<string, unknown>>(),
  status: text("status").notNull().default("pending"),
  deliveredAt: timestamp("delivered_at"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type NudgeHistoryEntry = typeof nudgeHistory.$inferSelect;

// ── Recommendations ────────────────────────────────────────────
export const recommendations = pgTable("recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
  alternatives: jsonb("alternatives").$type<Array<{ title: string; description: string }>>().notNull().default([]),
  priority: integer("priority").notNull().default(5),
  scheduledFor: timestamp("scheduled_for"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Recommendation = typeof recommendations.$inferSelect;

// ── Activity Sessions ──────────────────────────────────────────
export const activitySessions = pgTable("activity_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  durationMinutes: integer("duration_minutes"),
  caloriesBurned: integer("calories_burned"),
  heartRateAvg: integer("heart_rate_avg"),
  heartRateMax: integer("heart_rate_max"),
  stepsCount: integer("steps_count"),
  distanceMeters: real("distance_meters"),
  intensityLevel: text("intensity_level"),
  syncedAt: timestamp("synced_at").defaultNow(),
});

export type ActivitySession = typeof activitySessions.$inferSelect;

// ── Zod Validation Schemas (for API input) ─────────────────────
export const updateOnboardingSchema = z.object({
  currentStep: z.number().min(0).max(5).optional(),
  permissionsGranted: z.record(z.boolean()).optional(),
  watchPaired: z.boolean().optional(),
  dataSource: z.string().optional(),
  completed: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  dietaryPattern: z.string().optional(),
  flexibleRules: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  intolerances: z.array(z.string()).optional(),
  religiousRestrictions: z.array(z.string()).optional(),
  excludedIngredients: z.array(z.string()).optional(),
  healthGoals: z.array(z.string()).optional(),
  activityLevel: z.enum(["sedentary", "moderate", "active", "very_active"]).optional(),
});

export const updateNudgeSettingsSchema = z.object({
  maxNudgesPerDay: z.number().min(1).max(20).optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  autoBackoffEnabled: z.boolean().optional(),
  snoozedTypes: z.array(z.string()).optional(),
});

export const nudgeResponseSchema = z.object({
  action: z.enum(["accept", "dismiss", "snooze", "skip"]),
  snoozeDurationMinutes: z.number().optional(),
});
