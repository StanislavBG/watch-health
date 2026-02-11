import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNudgeSettings, useUpdateNudgeSettings } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

export default function NudgeSettingsPage() {
  const [, navigate] = useLocation();
  const { data: settings, isLoading } = useNudgeSettings();
  const updateSettings = useUpdateNudgeSettings();
  const { toast } = useToast();

  const [maxPerDay, setMaxPerDay] = useState(8);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");
  const [autoBackoff, setAutoBackoff] = useState(true);

  useEffect(() => {
    if (settings) {
      setMaxPerDay(settings.maxNudgesPerDay || 8);
      setQuietStart(settings.quietHoursStart || "22:00");
      setQuietEnd(settings.quietHoursEnd || "07:00");
      setAutoBackoff(settings.autoBackoffEnabled ?? true);
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings.mutateAsync({
      maxNudgesPerDay: maxPerDay,
      quietHoursStart: quietStart,
      quietHoursEnd: quietEnd,
      autoBackoffEnabled: autoBackoff,
    });
    toast({ title: "Settings saved", description: "Your nudge preferences have been updated." });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="animate-pulse text-emerald-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
          <span className="font-semibold text-gray-900">Nudge Settings</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Frequency Cap */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Frequency Cap</CardTitle>
            <CardDescription>
              Set the maximum number of nudges you want to receive per day.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Max nudges per day</Label>
                <span className="text-sm font-medium text-emerald-600">{maxPerDay}</span>
              </div>
              <Slider
                value={[maxPerDay]}
                onValueChange={(v) => setMaxPerDay(v[0])}
                min={1}
                max={20}
                step={1}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Minimal (1)</span>
                <span>Default (8)</span>
                <span>Maximum (20)</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
              {maxPerDay <= 3
                ? "You'll receive only the most important nudges. Hydration and critical meal timing."
                : maxPerDay <= 8
                ? "A balanced mix of meal suggestions, hydration reminders, and recovery prompts."
                : "More frequent guidance including snack suggestions and training adjustments."}
            </div>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quiet Hours</CardTitle>
            <CardDescription>
              No nudges will be sent during this time window. Good for sleep and personal time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm">Start (silence begins)</Label>
                <Input
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">End (nudges resume)</Label>
                <Input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
              Currently silent from {quietStart} to {quietEnd}. Nudges scheduled during quiet hours will be held until the window ends.
            </div>
          </CardContent>
        </Card>

        {/* Auto-Backoff */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adaptive Backoff</CardTitle>
            <CardDescription>
              When enabled, the system automatically reduces nudge frequency if you repeatedly dismiss or skip suggestions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Auto-reduce when ignored</Label>
                <p className="text-xs text-gray-500 mt-0.5">
                  3+ consecutive dismissals triggers a frequency reduction
                </p>
              </div>
              <Switch checked={autoBackoff} onCheckedChange={setAutoBackoff} />
            </div>

            {settings?.currentBackoffLevel > 0 && (
              <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800">
                Current backoff level: {settings.currentBackoffLevel}/5. Your effective max is reduced by {settings.currentBackoffLevel * 2} nudges.
                Accept a nudge to gradually restore normal frequency.
              </div>
            )}

            {settings?.snoozedTypes?.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Currently snoozed types:</Label>
                <div className="flex flex-wrap gap-1">
                  {settings.snoozedTypes.map((type: string) => (
                    <Badge key={type} variant="secondary" className="text-xs capitalize">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How Nudge Controls Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div className="flex gap-2">
              <span className="font-medium text-gray-900 w-16 flex-shrink-0">Snooze</span>
              <span>Temporarily pauses a specific nudge type. It'll come back after the snooze period.</span>
            </div>
            <Separator />
            <div className="flex gap-2">
              <span className="font-medium text-gray-900 w-16 flex-shrink-0">Skip</span>
              <span>Skips a single suggestion. The system notes your preference and adjusts future recommendations.</span>
            </div>
            <Separator />
            <div className="flex gap-2">
              <span className="font-medium text-gray-900 w-16 flex-shrink-0">Dismiss</span>
              <span>Closes a nudge. Multiple dismissals of the same type trigger automatic backoff.</span>
            </div>
            <Separator />
            <div className="flex gap-2">
              <span className="font-medium text-gray-900 w-16 flex-shrink-0">Accept</span>
              <span>Confirms a suggestion was helpful. Gradually restores nudge frequency if it was reduced.</span>
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          onClick={handleSave}
          disabled={updateSettings.isPending}
        >
          {updateSettings.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
