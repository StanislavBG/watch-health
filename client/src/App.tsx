import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import AuthPage from "@/pages/auth";
import OnboardingPage from "@/pages/onboarding";
import DashboardPage from "@/pages/dashboard";
import NudgeSettingsPage from "@/pages/nudge-settings";
import DietaryPreferencesPage from "@/pages/dietary-preferences";
import NotFound from "@/pages/not-found";

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/settings" component={NudgeSettingsPage} />
      <Route path="/dietary" component={DietaryPreferencesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function UnauthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route component={() => <Redirect to="/" />} />
    </Switch>
  );
}

function AppRouter() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AuthenticatedRouter /> : <UnauthenticatedRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
