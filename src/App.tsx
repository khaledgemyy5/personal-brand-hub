import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layouts
import { PublicLayout } from "@/components/PublicLayout";
import { AdminLayout } from "@/components/AdminLayout";
import { AdminGuard } from "@/components/AdminGuard";

// Public Pages
import Home from "@/pages/Home";
import Resume from "@/pages/Resume";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import Writing from "@/pages/Writing";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/NotFound";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminProjects from "@/pages/admin/AdminProjects";
import EditProject from "@/pages/admin/EditProject";
import AdminWriting from "@/pages/admin/AdminWriting";
import AdminSettings from "@/pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:slug" element={<ProjectDetail />} />
            <Route path="/writing" element={<Writing />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          {/* Admin Routes - Protected */}
          <Route path="/admin" element={<AdminGuard />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="projects" element={<AdminProjects />} />
              <Route path="projects/:slug/edit" element={<EditProject />} />
              <Route path="writing" element={<AdminWriting />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
