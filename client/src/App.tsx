// ══════════════════════════════════════════════════════════
// UdiTest — App principale
// Lazy loading di tutte le pagine tranne Home per ridurre
// il bundle iniziale da 1.4 MB a ~200 KB
// ══════════════════════════════════════════════════════════
import { lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TestProvider, useTest } from "./contexts/TestContext";
import CookieBanner from "./components/CookieBanner";
import { useServiceWorker } from "./hooks/useServiceWorker";

// Home caricata subito (è la prima pagina vista)
import Home from "./pages/Home";

// Route URL-based (non step-based) per pagine admin
const AdminLeads = lazy(() => import("./pages/AdminLeads"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminConfig = lazy(() => import("./pages/AdminConfig"));

// Tutte le altre pagine in lazy loading — vengono scaricate solo quando servono
const IntroVocale        = lazy(() => import("./pages/IntroVocale"));
const IntroTonale        = lazy(() => import("./pages/IntroTonale"));
const Privacy            = lazy(() => import("./pages/Privacy"));
const Anagrafica         = lazy(() => import("./pages/Anagrafica"));
const SceltaAudio        = lazy(() => import("./pages/SceltaAudio"));
const Calibrazione       = lazy(() => import("./pages/Calibrazione"));
const CalibrazioneTonale = lazy(() => import("./pages/CalibrazioneTonale"));
const Test               = lazy(() => import("./pages/Test"));
const Risultati          = lazy(() => import("./pages/Risultati"));
const AudiometriaTonale  = lazy(() => import("./pages/AudiometriaTonale"));
const Storico            = lazy(() => import("./pages/Storico"));
const PrivacyPolicy      = lazy(() => import("./pages/PrivacyPolicy"));
const CookiePolicy       = lazy(() => import("./pages/CookiePolicy"));

// Spinner leggero usato durante il caricamento lazy
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-[#1E73BE] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Caricamento...</p>
      </div>
    </div>
  );
}

function AppRouter() {
  const { step, setStep } = useTest();

  return (
    <Suspense fallback={<PageLoader />}>
      {(() => {
        switch (step) {
          case 'home':
            return <Home />;
          case 'intro-vocale':
            return <IntroVocale />;
          case 'intro-tonale':
            return <IntroTonale />;
          case 'privacy':
            return <Privacy />;
          case 'anagrafica':
            return <Anagrafica />;
          case 'scelta-audio':
            return <SceltaAudio />;
          case 'calibrazione':
            return <Calibrazione />;
          case 'calibrazione-tonale':
            return <CalibrazioneTonale />;
          case 'test':
            return <Test />;
          case 'risultati':
            return <Risultati />;
          case 'audiometria':
            return <AudiometriaTonale onBack={() => setStep('home')} />;
          case 'storico':
            return <Storico />;
          case 'privacy-policy':
            return <PrivacyPolicy />;
          case 'cookie-policy':
            return <CookiePolicy />;
          default:
            return <Home />;
        }
      })()}
    </Suspense>
  );
}

function FooterWithLinks() {
  const { setStep } = useTest();
  return (
    <footer className="text-center py-2 text-xs text-gray-400 bg-white border-t border-gray-100 space-y-1">
      <div>
        © {new Date().getFullYear()} Acustica Di Maio — Tutti i diritti riservati
      </div>
      <div className="flex justify-center gap-3">
        <button
          onClick={() => setStep('privacy-policy')}
          className="underline hover:text-gray-600 transition-colors"
        >
          Privacy Policy
        </button>
        <span>·</span>
        <button
          onClick={() => setStep('cookie-policy')}
          className="underline hover:text-gray-600 transition-colors"
        >
          Cookie Policy
        </button>
        <span>·</span>
        <button
          onClick={() => {
            localStorage.removeItem('pronto_udito_cookie_consent');
            window.location.reload();
          }}
          className="underline hover:text-gray-600 transition-colors"
        >
          Gestisci cookie
        </button>
        <span>·</span>
        <a
          href="/admin/login"
          className="underline hover:text-gray-600 transition-colors opacity-40 hover:opacity-70"
        >
          Admin
        </a>
      </div>
    </footer>
  );
}

function App() {
  // Registra Service Worker e monitora connessione
  const { isOnline } = useServiceWorker();

  // Routing URL-based reattivo: usa useLocation di wouter per aggiornare il rendering
  const [location] = useLocation();
  const isAdminLeads = location === '/admin/leads';
  const isAdminLogin = location === '/admin/login';
  const isAdminConfig = location === '/admin/config';

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          {/* Banner offline */}
          {!isOnline && (
            <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center text-sm py-2 px-4 flex items-center justify-center gap-2">
              <span>📡</span>
              <span>Sei offline — il test funziona, ma il PDF sarà disponibile quando torni online.</span>
            </div>
          )}
          {isAdminLogin ? (
            <Suspense fallback={<PageLoader />}>
              <AdminLogin />
            </Suspense>
          ) : isAdminLeads ? (
            <Suspense fallback={<PageLoader />}>
              <AdminLeads />
            </Suspense>
          ) : isAdminConfig ? (
            <Suspense fallback={<PageLoader />}>
              <AdminConfig />
            </Suspense>
          ) : (
            <TestProvider>
              <CookieBanner />
              <div className="flex flex-col min-h-screen">
                <div className="flex-1">
                  <AppRouter />
                </div>
                <FooterWithLinks />
              </div>
            </TestProvider>
          )}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
