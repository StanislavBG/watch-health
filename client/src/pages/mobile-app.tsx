import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function MobileAppPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">WatchHealth</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            Sign In
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Hero */}
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Get the WatchHealth Apps</h1>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            Download the companion mobile app and the Garmin watch app to get personalized health nudges on your wrist.
          </p>
        </div>

        {/* Mobile Companion App */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <CardTitle>WatchHealth Companion App</CardTitle>
                <CardDescription>Required for syncing your watch data</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              The WatchHealth companion app runs on your phone and bridges data between your Garmin Vivoactive 5 and the WatchHealth platform. It syncs activity, heart rate, sleep, and stress data in the background.
            </p>

            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-emerald-600 mt-0.5 flex-shrink-0">&#x2713;</span>
                <span>Background sync with Garmin Connect</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-emerald-600 mt-0.5 flex-shrink-0">&#x2713;</span>
                <span>Push notifications for meal, hydration, and recovery nudges</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-emerald-600 mt-0.5 flex-shrink-0">&#x2713;</span>
                <span>Quick actions to accept, snooze, or dismiss nudges</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-emerald-600 mt-0.5 flex-shrink-0">&#x2713;</span>
                <span>Works with Android (via Health Connect) and iOS</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button className="bg-gray-900 hover:bg-gray-800 h-14">
                <div className="text-left">
                  <div className="text-[10px] leading-tight opacity-80">Download on the</div>
                  <div className="text-sm font-semibold">App Store</div>
                </div>
              </Button>
              <Button className="bg-gray-900 hover:bg-gray-800 h-14">
                <div className="text-left">
                  <div className="text-[10px] leading-tight opacity-80">Get it on</div>
                  <div className="text-sm font-semibold">Google Play</div>
                </div>
              </Button>
            </div>

            <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800">
              Requires iOS 16+ or Android 10+. The app uses Garmin Connect for data access -- make sure you have Garmin Connect installed first.
            </div>
          </CardContent>
        </Card>

        {/* Watch App */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <CardTitle>WatchHealth for Garmin</CardTitle>
                <CardDescription>Garmin Vivoactive 5 watch app</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              The WatchHealth watch face and widget for your Garmin Vivoactive 5 displays nudges directly on your wrist. Accept or snooze recommendations without reaching for your phone.
            </p>

            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-teal-600 mt-0.5 flex-shrink-0">&#x2713;</span>
                <span>Nudge notifications with haptic feedback on your watch</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-teal-600 mt-0.5 flex-shrink-0">&#x2713;</span>
                <span>Glanceable widget showing your next recommendation</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-teal-600 mt-0.5 flex-shrink-0">&#x2713;</span>
                <span>One-tap accept or snooze directly from the watch</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-teal-600 mt-0.5 flex-shrink-0">&#x2713;</span>
                <span>Low battery impact -- runs as a lightweight background service</span>
              </div>
            </div>

            <Button variant="outline" className="w-full h-14 border-teal-200 hover:bg-teal-50">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <div className="text-left">
                  <div className="text-sm font-semibold text-teal-700">Install from Garmin Connect IQ</div>
                  <div className="text-xs text-gray-500">Search "WatchHealth" in the Connect IQ store</div>
                </div>
              </div>
            </Button>

            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
              You can also install the watch app directly from the Garmin Connect IQ app on your phone. Go to the Connect IQ store and search for "WatchHealth".
            </div>
          </CardContent>
        </Card>

        {/* Setup Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Setup in 3 Steps</CardTitle>
            <CardDescription>Get syncing in just a few minutes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-semibold text-sm">1</div>
              <div>
                <div className="font-medium text-sm">Install the companion app on your phone</div>
                <div className="text-xs text-gray-500">Download from the App Store or Google Play, then sign in with your WatchHealth account.</div>
              </div>
            </div>
            <Separator />
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-semibold text-sm">2</div>
              <div>
                <div className="font-medium text-sm">Install the watch app from Connect IQ</div>
                <div className="text-xs text-gray-500">Open the Connect IQ store on your phone or watch and install the WatchHealth widget.</div>
              </div>
            </div>
            <Separator />
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-semibold text-sm">3</div>
              <div>
                <div className="font-medium text-sm">Pair and sync</div>
                <div className="text-xs text-gray-500">Make sure Bluetooth is on and your watch is nearby. The companion app will auto-detect your Garmin Vivoactive 5 and start syncing data.</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0">
          <CardContent className="pt-6 text-center space-y-3">
            <h3 className="font-semibold text-lg">Ready to get started?</h3>
            <p className="text-sm text-emerald-100">Create a free account to pair your watch and start receiving personalized health nudges.</p>
            <Button
              variant="secondary"
              className="bg-white text-emerald-700 hover:bg-emerald-50"
              onClick={() => navigate("/")}
            >
              Create Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
