import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ClinicLayout } from "./components/layout/ClinicLayout";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
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
            <Route element={<ProtectedRoute />}>
              <Route element={<ClinicLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/queue" element={<Queue />} />
                <Route path="/medical-history" element={<MedicalHistory />} />
                <Route path="/prescriptions" element={<Prescriptions />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/automation" element={<Automation />} />
                <Route path="/webhooks" element={<Webhooks />} />
                <Route path="/settings" element={<Settings />} />
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
