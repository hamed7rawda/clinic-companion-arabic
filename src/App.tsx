import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ClinicLayout } from "./components/layout/ClinicLayout";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RoleRoute } from "./components/auth/RoleRoute";
import Auth from "./pages/Auth";
import MainMenu from "./pages/MainMenu";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Patients from "./pages/Patients";
import Queue from "./pages/Queue";
import MedicalHistory from "./pages/MedicalHistory";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Automation from "./pages/Automation";
import Invoices from "./pages/Invoices";
import Statistics from "./pages/Statistics";
import Webhooks from "./pages/Webhooks";
import PublicBooking from "./pages/PublicBooking";
import UserRoles from "./pages/UserRoles";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" dir="rtl" />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/book" element={<PublicBooking />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<ClinicLayout />}>
                <Route path="/" element={<MainMenu />} />
                <Route path="/dashboard" element={<RoleRoute allow={["doctor", "reception"]}><Dashboard /></RoleRoute>} />
                <Route path="/appointments" element={<RoleRoute allow={["doctor", "reception"]}><Appointments /></RoleRoute>} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/queue" element={<Queue />} />
                <Route path="/medical-history" element={<RoleRoute allow={["doctor"]}><MedicalHistory /></RoleRoute>} />
                <Route path="/invoices" element={<RoleRoute allow={["doctor", "reception"]}><Invoices /></RoleRoute>} />
                <Route path="/reports" element={<RoleRoute allow={["doctor"]}><Reports /></RoleRoute>} />
                <Route path="/statistics" element={<RoleRoute allow={["doctor"]}><Statistics /></RoleRoute>} />
                <Route path="/automation" element={<RoleRoute allow={["doctor"]}><Automation /></RoleRoute>} />
                <Route path="/webhooks" element={<RoleRoute allow={["doctor"]}><Webhooks /></RoleRoute>} />
                <Route path="/settings" element={<RoleRoute allow={["doctor"]}><Settings /></RoleRoute>} />
                <Route path="/users" element={<RoleRoute allow={["doctor"]}><UserRoles /></RoleRoute>} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
