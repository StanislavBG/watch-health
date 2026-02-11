import type { IStorage } from "../storage";
import type { NudgeHistoryEntry, NudgeSettings } from "@shared/schema";

export class NudgeEngine {
  constructor(private storage: IStorage) {}

  async canSendNudge(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const settings = await this.storage.getNudgeSettings(userId);
    if (!settings) {
      return { allowed: true };
    }

    // Check quiet hours
    if (this.isQuietHours(settings)) {
      return { allowed: false, reason: "quiet_hours" };
    }

    // Check frequency cap
    const todayCount = await this.storage.getNudgesTodayCount(userId);
    const effectiveMax = this.getEffectiveMax(settings);
    if (todayCount >= effectiveMax) {
      return { allowed: false, reason: "frequency_cap" };
    }

    return { allowed: true };
  }

  async sendNudge(
    userId: string,
    type: string,
    title: string,
    message: string,
    recommendation?: Record<string, unknown>,
  ): Promise<NudgeHistoryEntry | null> {
    const settings = await this.storage.getNudgeSettings(userId);

    // Check if this type is snoozed
    if (settings?.snoozedTypes.includes(type)) {
      return null;
    }

    const check = await this.canSendNudge(userId);
    if (!check.allowed) {
      return null;
    }

    return this.storage.createNudge({
      userId,
      type,
      title,
      message,
      recommendation: recommendation || null,
      status: "delivered",
      deliveredAt: new Date(),
      respondedAt: null,
    });
  }

  async handleNudgeResponse(
    nudgeId: string,
    action: "accept" | "dismiss" | "snooze" | "skip",
    snoozeDurationMinutes?: number,
  ): Promise<NudgeHistoryEntry | undefined> {
    const updated = await this.storage.updateNudge(nudgeId, {
      status: action === "snooze" ? "snoozed" : action === "skip" ? "skipped" : action === "accept" ? "accepted" : "dismissed",
      respondedAt: new Date(),
    });

    if (!updated) return undefined;

    // Auto-backoff: track consecutive dismissals
    if (action === "dismiss" || action === "skip") {
      await this.incrementBackoff(updated.userId, updated.type);
    } else if (action === "accept") {
      await this.resetBackoff(updated.userId);
    }

    // Handle snooze for this nudge type
    if (action === "snooze" && snoozeDurationMinutes) {
      await this.snoozeType(updated.userId, updated.type, snoozeDurationMinutes);
    }

    return updated;
  }

  private async incrementBackoff(userId: string, type: string): Promise<void> {
    const settings = await this.storage.getNudgeSettings(userId);
    if (!settings?.autoBackoffEnabled) return;

    const history = await this.storage.getNudgeHistory(userId, 10);
    const recentOfType = history.filter((n) => n.type === type);
    const consecutiveDismissals = this.countConsecutiveDismissals(recentOfType);

    if (consecutiveDismissals >= 3) {
      const newLevel = Math.min((settings.currentBackoffLevel || 0) + 1, 5);
      await this.storage.upsertNudgeSettings(userId, {
        currentBackoffLevel: newLevel,
      });
    }
  }

  private async resetBackoff(userId: string): Promise<void> {
    const settings = await this.storage.getNudgeSettings(userId);
    if (settings && settings.currentBackoffLevel > 0) {
      await this.storage.upsertNudgeSettings(userId, {
        currentBackoffLevel: Math.max(0, settings.currentBackoffLevel - 1),
      });
    }
  }

  private async snoozeType(userId: string, type: string, durationMinutes: number): Promise<void> {
    const settings = await this.storage.getNudgeSettings(userId);
    const snoozed = new Set(settings?.snoozedTypes || []);
    snoozed.add(type);
    await this.storage.upsertNudgeSettings(userId, {
      snoozedTypes: Array.from(snoozed),
    });

    // Auto-unsnooze after duration
    setTimeout(async () => {
      const current = await this.storage.getNudgeSettings(userId);
      if (current) {
        const updated = current.snoozedTypes.filter((t) => t !== type);
        await this.storage.upsertNudgeSettings(userId, { snoozedTypes: updated });
      }
    }, durationMinutes * 60 * 1000);
  }

  private countConsecutiveDismissals(history: NudgeHistoryEntry[]): number {
    let count = 0;
    for (const entry of history) {
      if (entry.status === "dismissed" || entry.status === "skipped") {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  private isQuietHours(settings: NudgeSettings): boolean {
    if (!settings.quietHoursStart || !settings.quietHoursEnd) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = settings.quietHoursStart.split(":").map(Number);
    const [endH, endM] = settings.quietHoursEnd.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
    // Wraps midnight (e.g., 22:00 to 07:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  private getEffectiveMax(settings: NudgeSettings): number {
    const backoffReduction = settings.currentBackoffLevel * 2;
    return Math.max(1, settings.maxNudgesPerDay - backoffReduction);
  }
}
