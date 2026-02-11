import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useCompleteOnboardingStep, useOnboarding } from "@/hooks/use-api";

const STEPS = [
  { title: "Welcome", subtitle: "What WatchHealth does" },
  { title: "Permissions", subtitle: "Data access" },
  { title: "Watch Pairing", subtitle: "Connect your Garmin" },
  { title: "Data Source", subtitle: "Choose your source" },
  { title: "Your Preferences", subtitle: "Dietary & health" },
  { title: "Ready!", subtitle: "First recommendation" },
];

export default function OnboardingPage() {
  const [, navigate] = useLocation();
  const { data: onboarding } = useOnboarding();
  const completeMutation = useCompleteOnboardingStep();
  const [currentStep, setCurrentStep] = useState(onboarding?.currentStep || 0);

  // Local state for each step
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    healthData: false,
    notifications: false,
    activityTracking: false,
  });
  const [watchPaired, setWatchPaired] = useState(false);
  const [dataSource, setDataSource] = useState("garmin-connect");
  const [profile, setProfile] = useState({
    dietaryPattern: "",
    allergies: [] as string[],
    healthGoals: [] as string[],
  });
  const [nudgeFrequency, setNudgeFrequency] = useState(8);
  const [allergyInput, setAllergyInput] = useState("");

  const progress = ((currentStep) / STEPS.length) * 100;

  const completeStep = async (data?: any) => {
    await completeMutation.mutateAsync({ step: currentStep, data });
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Step {currentStep + 1} of {STEPS.length}</span>
            <span>{STEPS[currentStep]?.title}</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i <= currentStep ? "bg-emerald-600" : "bg-gray-300"}`}
              />
            ))}
          </div>
        </div>

        {/* Step 0: Welcome */}
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <CardTitle className="text-xl">Welcome to WatchHealth</CardTitle>
              <CardDescription>
                Your personal health autopilot for the Garmin Vivoactive 5
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-emerald-50 rounded-lg p-4 space-y-3">
                <p className="text-sm text-gray-700">
                  WatchHealth analyzes your watch data and provides <strong>proactive, low-friction nudges</strong> to guide your daily nutrition, hydration, and recovery.
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">&#x2713;</span>
                    <span><strong>Timed meal suggestions</strong> based on your activity level</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">&#x2713;</span>
                    <span><strong>Hydration reminders</strong> that adapt to how active you are</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">&#x2713;</span>
                    <span><strong>Recovery prompts</strong> after intense training</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">&#x2713;</span>
                    <span>Support for <strong>skin health</strong> and <strong>hormonal balance</strong> goals</span>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800">
                Recommendations depend on permissions and device connectivity. We'll walk you through setup next.
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => completeStep()}>
                Let's Get Started
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Permissions */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                We need access to specific data to provide useful recommendations. Here's why each permission matters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Health Data</div>
                    <div className="text-xs text-gray-500">Heart rate, steps, sleep, stress, body battery. Used to tailor meal timing and portion sizes.</div>
                  </div>
                  <Switch
                    checked={permissions.healthData}
                    onCheckedChange={(v) => setPermissions({ ...permissions, healthData: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Notifications</div>
                    <div className="text-xs text-gray-500">Allows us to send nudges to your phone and watch. You control frequency and quiet hours.</div>
                  </div>
                  <Switch
                    checked={permissions.notifications}
                    onCheckedChange={(v) => setPermissions({ ...permissions, notifications: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Activity Tracking</div>
                    <div className="text-xs text-gray-500">Workout history and intensity. Needed to adjust recommendations based on training load.</div>
                  </div>
                  <Switch
                    checked={permissions.activityTracking}
                    onCheckedChange={(v) => setPermissions({ ...permissions, activityTracking: v })}
                  />
                </div>
              </div>

              <div className="text-xs text-gray-400">
                You can change these permissions at any time in Settings.
              </div>

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => completeStep({ permissions })}
                disabled={!permissions.healthData}
              >
                {permissions.healthData ? "Continue" : "Health Data is required"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Watch Pairing */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Connect Your Watch</CardTitle>
              <CardDescription>
                Confirm your Garmin Vivoactive 5 is connected and syncing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-4 rounded-lg border-2 ${watchPaired ? "border-emerald-500 bg-emerald-50" : "border-gray-200"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${watchPaired ? "bg-emerald-100" : "bg-gray-100"}`}>
                    <svg className={`w-5 h-5 ${watchPaired ? "text-emerald-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      {watchPaired ? "Garmin Vivoactive 5 Connected" : "Garmin Vivoactive 5"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {watchPaired ? "Data sync is working" : "Tap to simulate pairing"}
                    </div>
                  </div>
                  {watchPaired && (
                    <Badge variant="outline" className="ml-auto text-emerald-600 border-emerald-300">Connected</Badge>
                  )}
                </div>
              </div>

              {!watchPaired && (
                <>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setWatchPaired(true)}
                  >
                    Pair Watch
                  </Button>
                  <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                    Make sure Bluetooth is enabled and your watch is nearby. Open Garmin Connect on your phone to start pairing.
                  </div>
                </>
              )}

              {watchPaired && (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => completeStep({ watchPaired: true })}
                >
                  Continue
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Data Source */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Data Source</CardTitle>
              <CardDescription>
                Choose where WatchHealth reads your health data from. This determines the source of truth for recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={dataSource} onValueChange={setDataSource}>
                <div className={`flex items-center p-3 rounded-lg border-2 ${dataSource === "garmin-connect" ? "border-emerald-500 bg-emerald-50" : "border-gray-200"}`}>
                  <RadioGroupItem value="garmin-connect" id="garmin-connect" />
                  <Label htmlFor="garmin-connect" className="ml-3 cursor-pointer flex-1">
                    <div className="font-medium text-sm">Garmin Connect</div>
                    <div className="text-xs text-gray-500">Official Garmin app. Best accuracy for Vivoactive 5 data.</div>
                  </Label>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">Recommended</Badge>
                </div>
                <div className={`flex items-center p-3 rounded-lg border-2 ${dataSource === "health-api" ? "border-emerald-500 bg-emerald-50" : "border-gray-200"}`}>
                  <RadioGroupItem value="health-api" id="health-api" />
                  <Label htmlFor="health-api" className="ml-3 cursor-pointer flex-1">
                    <div className="font-medium text-sm">Health Connect (Android)</div>
                    <div className="text-xs text-gray-500">Unified health data from multiple sources.</div>
                  </Label>
                </div>
                <div className={`flex items-center p-3 rounded-lg border-2 ${dataSource === "manual" ? "border-emerald-500 bg-emerald-50" : "border-gray-200"}`}>
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual" className="ml-3 cursor-pointer flex-1">
                    <div className="font-medium text-sm">Manual Entry</div>
                    <div className="text-xs text-gray-500">Enter activity data yourself. Less automatic, but works without sync.</div>
                  </Label>
                </div>
              </RadioGroup>

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => completeStep({ dataSource })}
              >
                Continue with {dataSource === "garmin-connect" ? "Garmin Connect" : dataSource === "health-api" ? "Health Connect" : "Manual Entry"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: User Grounding */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Preferences</CardTitle>
              <CardDescription>
                A few essential questions to avoid obviously bad suggestions. You can always update these later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Dietary Pattern */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Dietary pattern (flexible -- pick what fits best)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["omnivore", "vegetarian", "vegan", "pescatarian", "basketarian", "flexitarian"].map((d) => (
                    <Button
                      key={d}
                      variant={profile.dietaryPattern === d ? "default" : "outline"}
                      size="sm"
                      className={profile.dietaryPattern === d ? "bg-emerald-600" : ""}
                      onClick={() => setProfile({ ...profile, dietaryPattern: d })}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Allergies / Restrictions */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Allergies or ingredients to always avoid</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., peanuts, shellfish, dairy"
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && allergyInput.trim()) {
                        setProfile({ ...profile, allergies: [...profile.allergies, allergyInput.trim()] });
                        setAllergyInput("");
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (allergyInput.trim()) {
                        setProfile({ ...profile, allergies: [...profile.allergies, allergyInput.trim()] });
                        setAllergyInput("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                {profile.allergies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profile.allergies.map((a, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => setProfile({ ...profile, allergies: profile.allergies.filter((_, j) => j !== i) })}
                      >
                        {a} &times;
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Health Goals */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Health goals (select any that apply)</Label>
                <div className="space-y-2">
                  {[
                    { id: "hormonal_balance", label: "Hormonal balance" },
                    { id: "skin_health", label: "Skin health" },
                    { id: "fat_loss", label: "Fat loss" },
                    { id: "performance", label: "Athletic performance" },
                    { id: "energy", label: "Sustained energy" },
                    { id: "recovery", label: "Better recovery" },
                  ].map((goal) => (
                    <div key={goal.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={goal.id}
                        checked={profile.healthGoals.includes(goal.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setProfile({ ...profile, healthGoals: [...profile.healthGoals, goal.id] });
                          } else {
                            setProfile({ ...profile, healthGoals: profile.healthGoals.filter((g) => g !== goal.id) });
                          }
                        }}
                      />
                      <Label htmlFor={goal.id} className="text-sm cursor-pointer">{goal.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nudge frequency preference */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Nudge frequency: {nudgeFrequency} per day
                </Label>
                <Slider
                  value={[nudgeFrequency]}
                  onValueChange={(v) => setNudgeFrequency(v[0])}
                  min={1}
                  max={15}
                  step={1}
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Minimal (1)</span>
                  <span>Balanced (8)</span>
                  <span>Frequent (15)</span>
                </div>
              </div>

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => completeStep({ profile })}
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 5: First Value */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle>You're All Set!</CardTitle>
              <CardDescription>Here's what we've connected and what happens next.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Connected summary */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
                  <span className="text-emerald-600">&#x2713;</span>
                  <span className="text-sm">Garmin Vivoactive 5 paired and syncing</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
                  <span className="text-emerald-600">&#x2713;</span>
                  <span className="text-sm">Health data, notifications, and activity tracking enabled</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
                  <span className="text-emerald-600">&#x2713;</span>
                  <span className="text-sm">Dietary preferences saved</span>
                </div>
              </div>

              {/* Initial recommendation preview */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                <div className="text-sm font-medium text-emerald-800 mb-1">Your First Nudge</div>
                <p className="text-sm text-gray-700">
                  Once we collect your first day of activity data, we'll send your first personalized meal and hydration recommendation. This usually happens within a few hours.
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  You can sync your Garmin data manually from the dashboard to see recommendations right away.
                </div>
              </div>

              {/* Nudge controls reminder */}
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                Remember: you can snooze, skip, or adjust nudge frequency at any time from the dashboard. We'll also automatically reduce nudges if you dismiss them often.
              </div>

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => completeStep()}
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Skip option */}
        {currentStep > 0 && currentStep < 5 && (
          <div className="text-center mt-4">
            <button
              className="text-sm text-gray-400 hover:text-gray-600"
              onClick={() => setCurrentStep(currentStep + 1)}
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
