/**
 * bilko-flow Workflow Integration
 *
 * Defines workflow schemas for the Garmin fitness data pipeline using
 * the bilko-flow deterministic workflow framework.
 *
 * bilko-flow (https://github.com/StanislavBG/bilko-flow) provides:
 * - Deterministic workflow creation and execution
 * - Cryptographic provenance tracking
 * - Pluggable step handlers with retry/timeout policies
 * - State machine enforcement for run lifecycle
 *
 * The workflows defined here orchestrate the end-to-end pipeline:
 * Garmin sync -> data transform -> AI analysis -> recommendation generation -> nudge delivery
 */

export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  dependsOn: string[];
  inputs: Record<string, unknown>;
  policy: {
    timeoutMs: number;
    maxAttempts: number;
    backoffStrategy?: "fixed" | "exponential";
    backoffBaseMs?: number;
  };
  determinism: {
    usesExternalApis: boolean;
    usesTime: boolean;
    pureFunction: boolean;
  };
}

export interface WorkflowDefinition {
  name: string;
  description: string;
  determinismTarget: "pure" | "replayable" | "best-effort";
  entryStepId: string;
  steps: WorkflowStep[];
}

// Workflow: Daily Health Data Sync from Garmin
export const dailyHealthSyncWorkflow: WorkflowDefinition = {
  name: "Daily Health Data Sync",
  description: "Fetches health metrics from Garmin Connect, transforms the data, and stores it for analysis",
  determinismTarget: "replayable",
  entryStepId: "fetch-garmin-data",
  steps: [
    {
      id: "fetch-garmin-data",
      name: "Fetch Garmin Health Data",
      type: "http.request",
      dependsOn: [],
      inputs: {
        endpoint: "/garmin/health-summary",
        metrics: ["heart_rate", "steps", "calories", "sleep", "stress", "body_battery", "spo2"],
      },
      policy: { timeoutMs: 30000, maxAttempts: 3, backoffStrategy: "exponential", backoffBaseMs: 1000 },
      determinism: { usesExternalApis: true, usesTime: false, pureFunction: false },
    },
    {
      id: "transform-metrics",
      name: "Transform Health Metrics",
      type: "transform.map",
      dependsOn: ["fetch-garmin-data"],
      inputs: {
        mapping: {
          heartRate: "$.heartRateSummary",
          steps: "$.stepsSummary",
          calories: "$.caloriesSummary",
          sleep: "$.sleepSummary",
          stress: "$.stressSummary",
          bodyBattery: "$.bodyBatterySummary",
          spo2: "$.spo2Summary",
        },
      },
      policy: { timeoutMs: 10000, maxAttempts: 1 },
      determinism: { usesExternalApis: false, usesTime: false, pureFunction: true },
    },
    {
      id: "classify-activity-level",
      name: "Classify Activity Level",
      type: "transform.reduce",
      dependsOn: ["transform-metrics"],
      inputs: {
        reducer: "activity-level-classifier",
        thresholds: {
          very_active: { calories: 3000, minutes: 300, highIntensity: 3 },
          active: { calories: 1500, minutes: 150, highIntensity: 1 },
          moderate: { calories: 500, minutes: 60 },
        },
      },
      policy: { timeoutMs: 5000, maxAttempts: 1 },
      determinism: { usesExternalApis: false, usesTime: false, pureFunction: true },
    },
    {
      id: "store-activity-data",
      name: "Store Activity Session",
      type: "custom",
      dependsOn: ["classify-activity-level"],
      inputs: { action: "persist-activity-session" },
      policy: { timeoutMs: 5000, maxAttempts: 2, backoffStrategy: "fixed", backoffBaseMs: 500 },
      determinism: { usesExternalApis: false, usesTime: true, pureFunction: false },
    },
  ],
};

// Workflow: Generate Personalized Recommendations
export const recommendationWorkflow: WorkflowDefinition = {
  name: "Generate Personalized Recommendations",
  description: "Analyzes health data and user profile to generate meal, hydration, and recovery recommendations",
  determinismTarget: "best-effort",
  entryStepId: "load-user-context",
  steps: [
    {
      id: "load-user-context",
      name: "Load User Profile & Preferences",
      type: "custom",
      dependsOn: [],
      inputs: { action: "load-user-context" },
      policy: { timeoutMs: 5000, maxAttempts: 1 },
      determinism: { usesExternalApis: false, usesTime: false, pureFunction: false },
    },
    {
      id: "analyze-activity-trend",
      name: "Analyze Activity Trend",
      type: "transform.reduce",
      dependsOn: ["load-user-context"],
      inputs: { windowDays: 7, metrics: ["calories", "duration", "intensity"] },
      policy: { timeoutMs: 10000, maxAttempts: 1 },
      determinism: { usesExternalApis: false, usesTime: true, pureFunction: false },
    },
    {
      id: "generate-meal-recommendations",
      name: "Generate Meal Recommendations",
      type: "ai.generate-text",
      dependsOn: ["analyze-activity-trend"],
      inputs: {
        promptTemplate: "Based on {activityLevel} activity, {healthGoals} goals, and {dietaryRestrictions} restrictions, suggest appropriate meals",
        model: "nutritional-advisor",
      },
      policy: { timeoutMs: 30000, maxAttempts: 2, backoffStrategy: "exponential", backoffBaseMs: 2000 },
      determinism: { usesExternalApis: true, usesTime: false, pureFunction: false },
    },
    {
      id: "generate-hydration-plan",
      name: "Generate Hydration Plan",
      type: "ai.generate-text",
      dependsOn: ["analyze-activity-trend"],
      inputs: {
        promptTemplate: "Based on {activityLevel} activity and {climate} conditions, recommend hydration schedule",
        model: "hydration-advisor",
      },
      policy: { timeoutMs: 15000, maxAttempts: 2, backoffStrategy: "fixed", backoffBaseMs: 1000 },
      determinism: { usesExternalApis: true, usesTime: false, pureFunction: false },
    },
    {
      id: "apply-dietary-filters",
      name: "Apply Dietary Filters",
      type: "transform.filter",
      dependsOn: ["generate-meal-recommendations", "generate-hydration-plan"],
      inputs: {
        filterBy: ["allergies", "intolerances", "religious_restrictions", "excluded_ingredients"],
        action: "substitute-alternatives",
      },
      policy: { timeoutMs: 5000, maxAttempts: 1 },
      determinism: { usesExternalApis: false, usesTime: false, pureFunction: true },
    },
    {
      id: "schedule-nudges",
      name: "Schedule Nudge Delivery",
      type: "notification.send",
      dependsOn: ["apply-dietary-filters"],
      inputs: {
        channel: "watch-push",
        respectQuietHours: true,
        respectFrequencyCaps: true,
      },
      policy: { timeoutMs: 10000, maxAttempts: 3, backoffStrategy: "exponential", backoffBaseMs: 1000 },
      determinism: { usesExternalApis: true, usesTime: true, pureFunction: false },
    },
  ],
};

// Workflow: Adaptive Backoff (responds to user behavior patterns)
export const adaptiveBackoffWorkflow: WorkflowDefinition = {
  name: "Adaptive Nudge Backoff",
  description: "Monitors nudge response patterns and adjusts delivery frequency and content to prevent fatigue",
  determinismTarget: "replayable",
  entryStepId: "analyze-response-patterns",
  steps: [
    {
      id: "analyze-response-patterns",
      name: "Analyze Response Patterns",
      type: "transform.reduce",
      dependsOn: [],
      inputs: {
        windowDays: 7,
        metrics: ["acceptance_rate", "dismissal_rate", "snooze_rate", "response_time"],
      },
      policy: { timeoutMs: 10000, maxAttempts: 1 },
      determinism: { usesExternalApis: false, usesTime: true, pureFunction: false },
    },
    {
      id: "compute-backoff-adjustment",
      name: "Compute Backoff Adjustment",
      type: "transform.map",
      dependsOn: ["analyze-response-patterns"],
      inputs: {
        rules: {
          highDismissal: { threshold: 0.6, action: "reduce_frequency", amount: 2 },
          lowEngagement: { threshold: 0.2, action: "change_timing" },
          typeRejection: { threshold: 0.8, action: "suppress_type" },
        },
      },
      policy: { timeoutMs: 5000, maxAttempts: 1 },
      determinism: { usesExternalApis: false, usesTime: false, pureFunction: true },
    },
    {
      id: "apply-settings-update",
      name: "Update Nudge Settings",
      type: "custom",
      dependsOn: ["compute-backoff-adjustment"],
      inputs: { action: "update-nudge-settings" },
      policy: { timeoutMs: 5000, maxAttempts: 2, backoffStrategy: "fixed", backoffBaseMs: 500 },
      determinism: { usesExternalApis: false, usesTime: false, pureFunction: false },
    },
  ],
};

export function getWorkflowDefinitions(): WorkflowDefinition[] {
  return [dailyHealthSyncWorkflow, recommendationWorkflow, adaptiveBackoffWorkflow];
}

export function getWorkflowByName(name: string): WorkflowDefinition | undefined {
  return getWorkflowDefinitions().find((w) => w.name === name);
}
