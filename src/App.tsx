import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import Index from "./pages/Index";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Forms from "./pages/Forms";
import CreateForm from "./pages/CreateForm";
import Submissions from "./pages/Submissions";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import ReminderSettings from "./pages/ReminderSettings";
import NotFound from "./pages/NotFound";
import ClientFormPage from "./pages/ClientFormPage";
import { SettingsLayout } from "./components/settings/SettingsLayout";
import { ProfileSettings } from "./components/settings/ProfileSettings";
import { OrganizationSettings } from "./components/settings/OrganizationSettings";
import { TeamSettings } from "./components/settings/TeamSettings";
import { NotificationSettings } from "./components/settings/NotificationSettings";
import { ApiKeysSettings } from "./components/settings/ApiKeysSettings";
import AuthCallback from "./pages/AuthCallback";
import FormDetail from "./pages/FormDetail";
import EditForm from "./pages/EditForm";

import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Plain JS for Lovable Code Component
(async () => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  console.log("👤 User:", userData);
  console.log("⚠️ User error:", userError);

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  console.log("🪪 Session:", sessionData);
  console.log("⚠️ Session error:", sessionError);
})();

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <UserProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* callback after email confirmation*/}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected Routes with Dashboard Layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Clients />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ClientDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/forms"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Forms />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/forms/create"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CreateForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/forms/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <FormDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/forms/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <EditForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/submissions"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Submissions />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SettingsLayout>
                      <Settings />
                    </SettingsLayout>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/profile"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SettingsLayout>
                      <ProfileSettings />
                    </SettingsLayout>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/organization"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SettingsLayout>
                      <OrganizationSettings />
                    </SettingsLayout>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/team"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SettingsLayout>
                      <TeamSettings />
                    </SettingsLayout>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/notifications"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SettingsLayout>
                      <NotificationSettings />
                    </SettingsLayout>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/api-keys"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SettingsLayout>
                      <ApiKeysSettings />
                    </SettingsLayout>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Billing />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reminders"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ReminderSettings />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Public client-facing form route */}
            <Route path="/forms/:slug/submit" element={<ClientFormPage />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </UserProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
