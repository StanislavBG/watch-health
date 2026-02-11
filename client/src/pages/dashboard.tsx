import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  useDashboard,
  useRecommendations,
  useAcceptRecommendation,
  useDismissRecommendation,
  useGarminSync,
  useRespondToNudge,
} from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";

function ActivityLevelBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    very_active: "bg-red-100 text-red-700",
    active: "bg-orange-100 text-orange-700",
    moderate: "bg-yellow-100 text-yellow-700",
    sedentary: "bg-blue-100 text-blue-700",
    unknown: "bg-gray-100 text-gray-500",
  };
  const labels: Record<string, string> = {
    very_active: "Very Active",
    active: "Active",
    moderate: "Moderate",
    sedentary: "Sedentary",
    unknown: "No Data Yet",
  };
  return <Badge className={`${colors[level] || colors.unknown} border-0`}>{labels[level] || level}</Badge>;
}

function NudgeTypeIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    meal: "M12 6v6m0 0v6m0-6h6m-6 0H6",
    hydration: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    recovery: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    training_adjustment: "M13 10V3L4 14h7v7l9-11h-7z",
  };
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[type] || icons.meal} />
    </svg>
  );
}

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const { logout } = useAuth();
  const { data: dashboard, isLoading } = useDashboard();
  const { data: recs } = useRecommendations("pending");
  const acceptRec = useAcceptRecommendation();
  const dismissRec = useDismissRecommendation();
  const garminSync = useGarminSync();
  const respondNudge = useRespondToNudge();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="animate-pulse text-emerald-600">Loading your dashboard...</div>
      </div>
    );
  }

  if (dashboard && !dashboard.onboardingComplete) {
    navigate("/onboarding");
    return null;
  }

  const activityLevel = dashboard?.activityLevel || "unknown";
  const recentActivity = dashboard?.recentActivity || [];
  const recentNudges = dashboard?.recentNudges || [];
  const pendingRecs = recs || dashboard?.pendingRecommendations || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">WatchHealth</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/settings")}>Settings</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/dietary")}>Diet</Button>
            <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Status Bar */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Current Activity Level</div>
                <div className="flex items-center gap-2 mt-1">
                  <ActivityLevelBadge level={activityLevel} />
                  <span className="text-xs text-gray-400">
                    Based on {recentActivity.length} recent session{recentActivity.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => garminSync.mutate()}
                disabled={garminSync.isPending}
              >
                {garminSync.isPending ? "Syncing..." : "Sync Garmin"}
              </Button>
            </div>
            {garminSync.isSuccess && (
              <div className="mt-2 text-xs text-emerald-600 bg-emerald-50 rounded p-2">
                Synced! {(garminSync.data as any)?.recommendationsGenerated || 0} new recommendations generated.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Recommendations */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Recommendations for You</h2>
          {pendingRecs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-400 text-sm">
                No pending recommendations. Sync your Garmin to generate new ones.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingRecs.map((rec: any) => (
                <Card key={rec.id} className="overflow-hidden">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        rec.type === "hydration" ? "bg-blue-100 text-blue-600" :
                        rec.type === "recovery" ? "bg-purple-100 text-purple-600" :
                        rec.type === "training_adjustment" ? "bg-orange-100 text-orange-600" :
                        "bg-emerald-100 text-emerald-600"
                      }`}>
                        <NudgeTypeIcon type={rec.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{rec.title}</span>
                          <Badge variant="outline" className="text-xs capitalize">{rec.type}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{rec.description}</p>

                        {/* Alternatives */}
                        {rec.alternatives && rec.alternatives.length > 0 && (
                          <div className="mt-2 pl-3 border-l-2 border-gray-100">
                            <div className="text-xs text-gray-400 mb-1">Alternatives:</div>
                            {rec.alternatives.map((alt: any, i: number) => (
                              <div key={i} className="text-xs text-gray-500">
                                <span className="font-medium">{alt.title}</span> -- {alt.description}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs"
                            onClick={() => acceptRec.mutate(rec.id)}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => dismissRec.mutate(rec.id)}
                          >
                            Not now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Nudges */}
        {recentNudges.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Recent Nudges</h2>
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {recentNudges.slice(0, 5).map((nudge: any) => (
                    <div key={nudge.id} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        nudge.status === "accepted" ? "bg-emerald-100 text-emerald-600" :
                        nudge.status === "dismissed" || nudge.status === "skipped" ? "bg-gray-100 text-gray-400" :
                        nudge.status === "snoozed" ? "bg-amber-100 text-amber-600" :
                        "bg-blue-100 text-blue-600"
                      }`}>
                        <NudgeTypeIcon type={nudge.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{nudge.title}</div>
                        <div className="text-xs text-gray-400">
                          {nudge.createdAt ? new Date(nudge.createdAt).toLocaleTimeString() : ""}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize flex-shrink-0">
                        {nudge.status}
                      </Badge>
                      {nudge.status === "delivered" && (
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={() => respondNudge.mutate({ nudgeId: nudge.id, action: "accept" })}
                          >
                            OK
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs text-gray-400"
                            onClick={() => respondNudge.mutate({ nudgeId: nudge.id, action: "snooze", snoozeDurationMinutes: 30 })}
                          >
                            Later
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Recent Activity</h2>
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {recentActivity.map((session: any) => (
                    <div key={session.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium capitalize">{session.type}</div>
                        <div className="text-xs text-gray-400">
                          {session.durationMinutes}min
                          {session.caloriesBurned ? ` / ${session.caloriesBurned} cal` : ""}
                          {session.heartRateAvg ? ` / ${session.heartRateAvg} bpm avg` : ""}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {session.intensityLevel || "n/a"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Button variant="outline" className="h-auto py-3" onClick={() => navigate("/settings")}>
            <div className="text-center">
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="text-xs">Nudge Settings</div>
            </div>
          </Button>
          <Button variant="outline" className="h-auto py-3" onClick={() => navigate("/dietary")}>
            <div className="text-center">
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <div className="text-xs">Dietary Preferences</div>
            </div>
          </Button>
          <Button variant="outline" className="h-auto py-3" onClick={() => navigate("/app")}>
            <div className="text-center">
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <div className="text-xs">Get the Apps</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
