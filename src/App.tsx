import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import { ThemeProvider } from "@/components/theme-provider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ClientProtectedRoute } from "@/components/ClientProtectedRoute";
import { AgencyProtectedRoute } from "@/components/AgencyProtectedRoute";
import { OrgRedirect } from "@/components/OrgRedirect";
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
import Pricing from "./pages/Pricing";
import ReminderSettings from "./pages/ReminderSettings";
import NotFound from "./pages/NotFound";
import ClientFormPage from "./pages/ClientFormPage";
import ClientPortal from "./pages/ClientPortal";
import ClientPortalFiles from "./pages/ClientPortalFiles";
import ClientPortalContracts from "./pages/ClientPortalContracts";
import ClientPortalBilling from "./pages/ClientPortalBilling";
import ClientPortalMeetings from "./pages/ClientPortalMeetings";
import ClientPortalFeedback from "./pages/ClientPortalFeedback";
import ClientPortalTasks from "./pages/ClientPortalTasks";
import ClientIntake from "./pages/ClientIntake";
import { SettingsLayout } from "./components/settings/SettingsLayout";
import { ProfileSettings } from "./components/settings/ProfileSettings";
import { OrganizationSettings } from "./components/settings/OrganizationSettings";
import { TeamSettings } from "./components/settings/TeamSettings";
import { NotificationSettings } from "./components/settings/NotificationSettings";
import AuthCallback from "./pages/AuthCallback";
import FormDetail from "./pages/FormDetail";
import EditForm from "./pages/EditForm";
import Tasks from "./pages/Tasks";
import EarlyAccessAdmin from "./pages/EarlyAccessAdmin";
import ClientDashboard from "./pages/ClientDashboard";
import SelectOrganization from "./pages/SelectOrganization";
import NoOrganization from "./pages/NoOrganization";

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
    <ThemeProvider defaultTheme="light" storageKey="kenly-ui-theme">
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
            
            {/* Organization selection for multi-org users */}
            <Route path="/select-organization" element={<ProtectedRoute><SelectOrganization /></ProtectedRoute>} />
            
            {/* No organization access page */}
            <Route path="/no-organization" element={<ProtectedRoute><NoOrganization /></ProtectedRoute>} />

            {/* Protected Agency Routes with Dashboard Layout - Support orgId parameter */}
            <Route
              path="/dashboard/:orgId"
              element={
                <AgencyProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            <Route
              path="/clients/:orgId"
              element={
                <AgencyProtectedRoute>
                  <DashboardLayout>
                    <Clients />
                  </DashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            <Route
              path="/clients/:orgId/:id"
              element={
                <AgencyProtectedRoute>
                  <DashboardLayout>
                    <ClientDetail />
                  </DashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            <Route
              path="/forms/:orgId"
              element={
                <AgencyProtectedRoute>
                  <DashboardLayout>
                    <Forms />
                  </DashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            <Route
              path="/forms/:orgId/create"
              element={
                <AgencyProtectedRoute>
                  <DashboardLayout>
                    <CreateForm />
                  </DashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            <Route
              path="/forms/:orgId/:id"
              element={
                <AgencyProtectedRoute>
                  <DashboardLayout>
                    <FormDetail />
                  </DashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            <Route
              path="/forms/:orgId/:id/edit"
              element={
                <AgencyProtectedRoute>
                  <DashboardLayout>
                    <EditForm />
                  </DashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            <Route
              path="/submissions/:orgId"
              element={
                <AgencyProtectedRoute>
                  <DashboardLayout>
                    <Submissions />
                  </DashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            <Route
              path="/settings/:orgId"
              element={
                <AgencyProtectedRoute>
                  <DashboardLayout>
                    <SettingsLayout>
                      <Settings />
                    </SettingsLayout>
                  </DashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            <Route
              path="/settings/:orgId/profile"
              element={
                <AgencyProtectedRoute>
                  <DashboardLayout>
                    <SettingsLayout>
                      <ProfileSettings />
                    </SettingsLayout>
                  </DashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            <Route
              path="/settings/:orgId/organization"
              element={
                <AgencyProtectedRoute>
                  <DashboardLayout>
                    <SettingsLayout>
                      <OrganizationSettings />
                    </SettingsLayout>
                  </DashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            <Route
              path="/settings/:orgId/team"
              element={
                <AgencyProtectedRoute>
                  <DashboardLayout>
                    <SettingsLayout>
                      <TeamSettings />
                    </SettingsLayout>
                  </DashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            <Route
              path="/settings/:orgId/notifications"
              element={
                <AgencyProtectedRoute>
                  <DashboardLayout>
                    <SettingsLayout>
                      <NotificationSettings />
                    </SettingsLayout>
                  </DashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            <Route
              path="/billing/:orgId"
              element={
                <AgencyProtectedRoute>
                  <DashboardLayout>
                    <Billing />
                  </DashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            <Route path="/pricing" element={<Pricing />} />
            <Route
              path="/reminders/:orgId"
              element={
                <AgencyProtectedRoute>
                  <DashboardLayout>
                    <ReminderSettings />
                  </DashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            <Route
              path="/tasks/:orgId"
              element={
                <AgencyProtectedRoute>
                  <DashboardLayout>
                    <Tasks />
                  </DashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            
            {/* Admin Routes - No orgId required */}
            <Route path="/admin/early-access" element={<ProtectedRoute><EarlyAccessAdmin /></ProtectedRoute>} />

            {/* Legacy routes without orgId - redirect to orgId routes */}
            <Route path="/dashboard" element={<OrgRedirect />} />
            <Route path="/clients" element={<OrgRedirect />} />
            <Route path="/clients/:id" element={<OrgRedirect />} />
            <Route path="/forms" element={<OrgRedirect />} />
            <Route path="/forms/create" element={<OrgRedirect />} />
            <Route path="/forms/:id" element={<OrgRedirect />} />
            <Route path="/forms/:id/edit" element={<OrgRedirect />} />
            <Route path="/submissions" element={<OrgRedirect />} />
            <Route path="/settings" element={<OrgRedirect />} />
            <Route path="/settings/profile" element={<OrgRedirect />} />
            <Route path="/settings/organization" element={<OrgRedirect />} />
            <Route path="/settings/team" element={<OrgRedirect />} />
            <Route path="/settings/notifications" element={<OrgRedirect />} />
            <Route path="/billing" element={<OrgRedirect />} />
            <Route path="/reminders" element={<OrgRedirect />} />
            <Route path="/tasks" element={<OrgRedirect />} />

            {/* Public client-facing form route */}
            <Route path="/forms/:slug/submit" element={<ClientFormPage />} />

            {/* Client intake route (validates token and sends magic link) */}
            <Route path="/intake/:token" element={<ClientIntake />} />

            {/* Client Dashboard - Shows all organizations client belongs to */}
            <Route 
              path="/client-dashboard" 
              element={
                <ProtectedRoute>
                  <ClientDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Client Portal Routes with orgId - Protected */}
            <Route 
              path="/client-portal/:orgId" 
              element={
                <ClientProtectedRoute>
                  <ClientPortal />
                </ClientProtectedRoute>
              } 
            />
            <Route 
              path="/client-portal/:orgId/files" 
              element={
                <ClientProtectedRoute>
                  <ClientPortalFiles />
                </ClientProtectedRoute>
              } 
            />
            <Route 
              path="/client-portal/:orgId/contracts" 
              element={
                <ClientProtectedRoute>
                  <ClientPortalContracts />
                </ClientProtectedRoute>
              } 
            />
            <Route 
              path="/client-portal/:orgId/billing" 
              element={
                <ClientProtectedRoute>
                  <ClientPortalBilling />
                </ClientProtectedRoute>
              } 
            />
            <Route 
              path="/client-portal/:orgId/meetings" 
              element={
                <ClientProtectedRoute>
                  <ClientPortalMeetings />
                </ClientProtectedRoute>
              } 
            />
            <Route 
              path="/client-portal/:orgId/feedback" 
              element={
                <ClientProtectedRoute>
                  <ClientPortalFeedback />
                </ClientProtectedRoute>
              } 
            />
            <Route 
              path="/client-portal/:orgId/tasks" 
              element={
                <ClientProtectedRoute>
                  <ClientPortalTasks />
                </ClientProtectedRoute>
              } 
            />

            {/* Legacy client portal routes without orgId */}
            <Route path="/client-portal" element={<ProtectedRoute><ClientPortal /></ProtectedRoute>} />
            <Route path="/portal" element={<ProtectedRoute><ClientPortal /></ProtectedRoute>} />
            <Route path="/client-portal/files" element={<ProtectedRoute><ClientPortalFiles /></ProtectedRoute>} />
            <Route path="/client-portal/contracts" element={<ProtectedRoute><ClientPortalContracts /></ProtectedRoute>} />
            <Route path="/client-portal/billing" element={<ProtectedRoute><ClientPortalBilling /></ProtectedRoute>} />
            <Route path="/client-portal/meetings" element={<ProtectedRoute><ClientPortalMeetings /></ProtectedRoute>} />
            <Route path="/client-portal/feedback" element={<ProtectedRoute><ClientPortalFeedback /></ProtectedRoute>} />
            <Route path="/client-portal/tasks" element={<ProtectedRoute><ClientPortalTasks /></ProtectedRoute>} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </UserProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
