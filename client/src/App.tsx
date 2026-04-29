import { Switch, Route } from "wouter";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import Home from "@/pages/home";
import Explore from "@/pages/explore";
import Transport from "@/pages/transport";
import POIDetails from "@/pages/poi-details";
import Bookings from "@/pages/bookings";
import TripPlanner from "@/pages/trip-planner";
import Nearby from "@/pages/nearby";
import Favorites from "@/pages/favorites";
import SmartItinerary from "@/pages/smart-itinerary";
import AdminNewsletter from "@/pages/admin-newsletter";
import UserAccount from "@/pages/user-account";
import SignUp from "@/pages/signup";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import { ChatBot } from "@/components/chatbot";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import { useAuth } from "@/contexts/auth-context";
import TicketPage from "@/pages/ticket";

function AuthStart() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (user?.role === "admin") navigate("/admin/dashboard");
    if (user?.role === "user") navigate("/home");
  }, [isLoading, navigate, user]);

  if (isLoading || user) return null;
  return <Login />;
}

function ProtectedRoute({
  component: Component,
  allowedRole,
}: {
  component: React.ComponentType;
  allowedRole: "user" | "admin";
}) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate("/");
      return;
    }
    if (user.role !== allowedRole) {
      navigate(user.role === "admin" ? "/admin/dashboard" : "/home");
    }
  }, [allowedRole, isLoading, navigate, user]);

  if (isLoading || !user || user.role !== allowedRole) return null;
  return <Component />;
}

function ChatBotGate() {
  const { user } = useAuth();
  if (!user || user.role === "admin") return null;
  return <ChatBot />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthStart} />
      <Route path="/ticket" component={TicketPage} />
      <Route path="/ticket/:bookingId" component={TicketPage} />
      <Route path="/home">{() => <ProtectedRoute component={Home} allowedRole="user" />}</Route>
      <Route path="/explore">{() => <ProtectedRoute component={Explore} allowedRole="user" />}</Route>
      <Route path="/transport">{() => <ProtectedRoute component={Transport} allowedRole="user" />}</Route>
      <Route path="/poi/:id">{() => <ProtectedRoute component={POIDetails} allowedRole="user" />}</Route>
      <Route path="/trip-planner">{() => <ProtectedRoute component={TripPlanner} allowedRole="user" />}</Route>
      <Route path="/nearby">{() => <ProtectedRoute component={Nearby} allowedRole="user" />}</Route>
      <Route path="/favorites">{() => <ProtectedRoute component={Favorites} allowedRole="user" />}</Route>
      <Route path="/smart-itinerary">{() => <ProtectedRoute component={SmartItinerary} allowedRole="user" />}</Route>
      <Route path="/admin-newsletter">{() => <ProtectedRoute component={AdminNewsletter} allowedRole="admin" />}</Route>
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin/dashboard">{() => <ProtectedRoute component={AdminDashboard} allowedRole="admin" />}</Route>
      <Route path="/admin-dashboard">{() => <ProtectedRoute component={AdminDashboard} allowedRole="admin" />}</Route>
      <Route path="/account">{() => <ProtectedRoute component={UserAccount} allowedRole="user" />}</Route>
      <Route path="/bookings">{() => <ProtectedRoute component={Bookings} allowedRole="user" />}</Route>
      <Route path="/signup" component={SignUp} />
      <Route path="/login" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
          <ChatBotGate />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
