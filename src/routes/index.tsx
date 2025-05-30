import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { NotFound } from "@/pages/NotFound";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { ResetPassword } from "@/pages/ResetPassword";
import { Profile } from "@/pages/Profile";
import { Users } from "@/pages/Users";
import ContactsPage from '@/pages/Contacts';
import { Companies } from "@/pages/Companies";
import { Deals } from "@/pages/Deals";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileInitializer } from "@/components/auth/ProfileInitializer";
import Calendar from '@/pages/Calendar';
import GoogleAuthCallback from '@/pages/GoogleAuthCallback';

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-full">
    <h2 className="text-2xl font-bold">{title}</h2>
    <p className="text-muted-foreground mt-2">This feature is coming soon</p>
  </div>
);

// Root layout with AuthProvider for ALL routes
function AppRoot() {
  return (
    <AuthProvider>
      <ProfileInitializer />
      <Outlet />
    </AuthProvider>
  );
}

// Layout with protection - requires auth
function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Layout>
        <Outlet />
      </Layout>
    </ProtectedRoute>
  );
}

const router = createBrowserRouter([
  {
    element: <AppRoot />, // ALL routes get AuthProvider
    children: [
      // Public auth routes (still inside AuthProvider, but not protected)
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPassword />,
      },
      {
        path: "/reset-password",
        element: <ResetPassword />,
      },
      // Google Auth callback route
      {
        path: "/auth/google/callback",
        element: <GoogleAuthCallback />,
      },
      // Protected routes
      {
        element: <ProtectedLayout />, // Apply layout and protection to all app routes
        children: [
          {
            path: "/",
            element: <Dashboard />,
          },
          {
            path: "/contacts",
            element: <ContactsPage />,
          },
          {
            path: "/companies",
            element: <Companies />,
          },
          {
            path: "/deals",
            element: <Deals />,
          },
          {
            path: "/profile",
            element: <Profile />,
          },
          {
            path: "/users",
            element: <Users />,
          },
          {
            path: "/calendar",
            element: <Calendar />,
          },
          {
            path: "/mail",
            element: <PlaceholderPage title="Email" />,
          },
          {
            path: "/tasks",
            element: <PlaceholderPage title="Tasks" />,
          },
          {
            path: "/reports",
            element: <PlaceholderPage title="Reports" />,
          },
          {
            path: "/automation",
            element: <PlaceholderPage title="Automation" />,
          },
          {
            path: "/settings",
            element: <PlaceholderPage title="Settings" />,
          },
        ],
      },
      // Catch-all for 404s
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

export function Routes() {
  return <RouterProvider router={router} fallbackElement={null} />;
}

// Also export as AppRoutes for compatibility with potential older imports
export { Routes as AppRoutes };