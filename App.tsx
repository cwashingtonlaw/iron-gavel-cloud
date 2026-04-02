import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AIChatbot from './components/AIChatbot';
import OnboardingTour from './components/OnboardingTour';
import { CommandPalette } from './components/CommandPalette';
import Breadcrumbs from './components/Breadcrumbs';
import { ToastContainer } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load page components
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Matters = React.lazy(() => import('./components/Matters'));
const Tasks = React.lazy(() => import('./components/Tasks'));
const Activities = React.lazy(() => import('./components/Activities'));
const Contacts = React.lazy(() => import('./components/Contacts'));
const Documents = React.lazy(() => import('./components/Documents'));
const Communication = React.lazy(() => import('./components/Communication'));
const Billing = React.lazy(() => import('./components/Billing'));
const Bills = React.lazy(() => import('./components/Bills'));
const Intake = React.lazy(() => import('./components/Intake'));
const ClientPortal = React.lazy(() => import('./components/ClientPortal'));
const Calendar = React.lazy(() => import('./components/Calendar'));
const Reports = React.lazy(() => import('./components/Reports'));
const Settings = React.lazy(() => import('./components/Settings'));
const EditMatter = React.lazy(() => import('./components/EditMatter'));
const WorkflowsPage = React.lazy(() => import('./components/workflows/WorkflowsPage').then(module => ({ default: module.WorkflowsPage })));

// Phase 1-3 Advanced Features
const DeadlineCalculator = React.lazy(() => import('./components/DeadlineCalculator').then(m => ({ default: m.DeadlineCalculator })));
const AuditLog = React.lazy(() => import('./components/AuditLog').then(m => ({ default: m.AuditLog })));
const SecuritySettings = React.lazy(() => import('./components/SecuritySettings').then(m => ({ default: m.SecuritySettings })));
const AdvancedSearch = React.lazy(() => import('./components/AdvancedSearch').then(m => ({ default: m.AdvancedSearch })));
const AutoInvoice = React.lazy(() => import('./components/AutoInvoice').then(m => ({ default: m.AutoInvoice })));
const ConflictVisualizer = React.lazy(() => import('./components/ConflictVisualizer').then(m => ({ default: m.ConflictVisualizer })));
const WorkflowBuilder = React.lazy(() => import('./components/WorkflowBuilder').then(m => ({ default: m.WorkflowBuilder })));
const PredictiveDashboard = React.lazy(() => import('./components/PredictiveDashboard').then(m => ({ default: m.PredictiveDashboard })));


const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);
  const { currentUser } = useStore();
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  React.useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleCompleteOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  const LoadingFallback = () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      {showOnboarding && <OnboardingTour onClose={handleCompleteOnboarding} />}
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 bg-slate-100 dark:bg-slate-900">
          <Breadcrumbs />
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              {children}
            </Suspense>
          </ErrorBoundary>
        </main>
        <AIChatbot />
        <ToastContainer />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { currentUser, setCurrentUser } = useStore();

  // Simple mock login for client portal if needed, 
  // but for now we assume the main app is for the firm user.
  // If we need to support client portal, we'd check currentUser.role or similar.

  if (currentUser.role === 'Client') {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
        <ClientPortal client={currentUser as any} onLogout={() => window.location.reload()} />
      </Suspense>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/matters" element={<Layout><Matters /></Layout>} />
        <Route path="/matters/edit/:id" element={<Layout><EditMatter /></Layout>} />
        <Route path="/tasks" element={<Layout><Tasks /></Layout>} />
        <Route path="/activities" element={<Layout><Activities /></Layout>} />
        <Route path="/contacts" element={<Layout><Contacts /></Layout>} />
        <Route path="/documents" element={<Layout><Documents /></Layout>} />
        <Route path="/communication" element={<Layout><Communication /></Layout>} />
        <Route path="/billing" element={<Layout><Billing /></Layout>} />
        <Route path="/bills" element={<Layout><Bills /></Layout>} />
        <Route path="/intake" element={<Layout><Intake /></Layout>} />

        {/* Placeholder routes for new pages */}
        <Route path="/calendar" element={<Layout><Calendar /></Layout>} />
        <Route path="/reports" element={<Layout><Reports /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        <Route path="/workflows" element={<Layout><WorkflowsPage /></Layout>} />

        {/* Phase 1-3 Advanced Feature Routes */}
        <Route path="/deadlines" element={<Layout><DeadlineCalculator /></Layout>} />
        <Route path="/audit" element={<Layout><AuditLog /></Layout>} />
        <Route path="/security" element={<Layout><SecuritySettings /></Layout>} />
        <Route path="/search" element={<Layout><AdvancedSearch /></Layout>} />
        <Route path="/automation" element={<Layout><AutoInvoice /></Layout>} />
        <Route path="/conflicts" element={<Layout><ConflictVisualizer /></Layout>} />
        <Route path="/workflow-builder" element={<Layout><WorkflowBuilder /></Layout>} />
        <Route path="/analytics" element={<Layout><PredictiveDashboard /></Layout>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;