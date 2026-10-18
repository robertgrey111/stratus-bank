import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import VerifyEmail from '@/pages/VerifyEmail';
import MfaSetup from '@/pages/MfaSetup';
import MfaChallenge from '@/pages/MfaChallenge';
import BankingShell from '@/components/BankingShell';
import { AccountsPage, DashboardPage, DepositPage, ProfilePage, TransactionsPage, TransferPage, UnavailablePage } from '@/pages/BankingPages';

const queryClient = new QueryClient();

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Login} />
        <Route path="/login" component={Login} />
        <Route path="/welcome" component={Home} />
        <Route path="/signup" component={Signup} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/mfa-setup" component={MfaSetup} />
        <Route path="/mfa-challenge" component={MfaChallenge} />
        <Route path="/dashboard"><BankingShell><DashboardPage /></BankingShell></Route>
        <Route path="/accounts"><BankingShell><AccountsPage /></BankingShell></Route>
        <Route path="/deposit"><BankingShell><DepositPage /></BankingShell></Route>
        <Route path="/transfer"><BankingShell><TransferPage /></BankingShell></Route>
        <Route path="/transactions"><BankingShell><TransactionsPage /></BankingShell></Route>
        <Route path="/statements"><BankingShell><UnavailablePage section="Statements" /></BankingShell></Route>
        <Route path="/cards"><BankingShell><UnavailablePage section="Cards" /></BankingShell></Route>
        <Route path="/beneficiaries"><BankingShell><UnavailablePage section="Beneficiaries" /></BankingShell></Route>
        <Route path="/security"><BankingShell><UnavailablePage section="Security" /></BankingShell></Route>
        <Route path="/support"><BankingShell><UnavailablePage section="Support" /></BankingShell></Route>
        <Route path="/profile"><BankingShell><ProfilePage /></BankingShell></Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
