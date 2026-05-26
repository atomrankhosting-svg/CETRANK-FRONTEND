import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Import Auth components
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminPasswordGate } from "./components/AdminPasswordGate.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import Index from "./pages/Index.tsx";
import ListGenerator from "./pages/ListGenerator.tsx";
import MyLists from "./pages/MyLists.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminAllLists from "./pages/AdminAllLists.tsx";
import AdminCoupons from "./pages/AdminCoupons.tsx";
import AdminSupport from "./pages/AdminSupport.tsx";
import NotFound from "./pages/NotFound.tsx";
import { SupportTicketModal } from "@/components/dashboard/SupportTicketModal";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" forcedTheme="light" disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <SupportTicketModal />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              {/* <Route path="/login" element={<Login />} /> */}
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/list-generator" element={<ListGenerator />} />
                <Route path="/my-lists" element={<MyLists />} />
                
                {/* Admin Password Gated Routes */}
                <Route element={<AdminPasswordGate />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/all-lists" element={<AdminAllLists />} />
                  <Route path="/admin/coupons" element={<AdminCoupons />} />
                  <Route path="/admin/support" element={<AdminSupport />} />
                </Route>
              </Route>

              {/* Auth Route */}
              <Route path="/auth" element={<AuthPage />} />

              {/* Catch-all Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
