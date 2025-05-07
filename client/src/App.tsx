import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import TopicDetailsPage from "./pages/topic-details";
import ArticleDetailsPage from "./pages/article-details";
import AuthPage from "./pages/auth-page";
import AdminPage from "./pages/admin-page";
import Header from "./components/header";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={HomePage} />
      <Route path="/topics/:slug" component={TopicDetailsPage} />
      <Route path="/articles/:slug" component={ArticleDetailsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/admin" component={AdminPage} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isAuthPage = location === '/auth';

  return (
    <div className="min-h-screen flex flex-col">
      {!isAuthPage && <Header />}
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppLayout>
            <Router />
          </AppLayout>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
