import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Import Auth components
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import AuthPage from "./pages/AuthPage.tsx";
import Index from "./pages/Index.tsx";
import ListGenerator from "./pages/ListGenerator.tsx";
import MyLists from "./pages/MyLists.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminAllLists from "./pages/AdminAllLists.tsx";
import NotFound from "./pages/NotFound.tsx";
// Create this page to handle Supabase Login/Signup
// import Login from "./pages/Login.tsx"; 

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" forcedTheme="light" disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
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
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/all-lists" element={<AdminAllLists />} />
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
