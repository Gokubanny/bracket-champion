import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/layout/AdminLayout";
import ViewerLayout from "@/components/layout/ViewerLayout";
import PublicLayout from "@/components/layout/PublicLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CreateTournament from "./pages/admin/CreateTournament";
import AllTournaments from "./pages/admin/AllTournaments";
import ManageTournament from "./pages/admin/ManageTournament";
import PublicBracketPage from "./pages/viewer/PublicBracketPage";
import ViewerDashboard from "./pages/viewer/ViewerDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/tournament/:inviteCode" element={<PublicBracketPage />} />
            </Route>

            {/* Admin routes */}
            <Route element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/tournaments" element={<AllTournaments />} />
              <Route path="/admin/tournaments/create" element={<CreateTournament />} />
              <Route path="/admin/tournaments/:id" element={<ManageTournament />} />
            </Route>

            {/* Viewer routes */}
            <Route element={<ProtectedRoute role="viewer"><ViewerLayout /></ProtectedRoute>}>
              <Route path="/viewer/dashboard" element={<ViewerDashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
