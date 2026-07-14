// ══════════════════════════════════════════════════════════
// UdiTest — Banner Cookie Consent (GDPR)
// Appare al primo accesso, salva preferenze in localStorage
// ══════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useTest } from '../contexts/TestContext';

const COOKIE_CONSENT_KEY = 'pronto_udito_cookie_consent';

export interface CookiePreferences {
  tecnici: true;       // sempre true, non modificabile
  analitici: boolean;
  marketing: boolean;
  dataConsent: string; // ISO date
}

export function useCookieConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  const savePreferences = (prefs: Omit<CookiePreferences, 'tecnici' | 'dataConsent'>) => {
    const full: CookiePreferences = {
      tecnici: true,
      analitici: prefs.analitici,
      marketing: prefs.marketing,
      dataConsent: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(full));
    setPreferences(full);
  };

  const acceptAll = () => savePreferences({ analitici: true, marketing: true });
  const rejectAll = () => savePreferences({ analitici: false, marketing: false });

  return { preferences, loaded, savePreferences, acceptAll, rejectAll };
}

export default function CookieBanner() {
  const { preferences, loaded, acceptAll, rejectAll, savePreferences } = useCookieConsent();
  const { setStep } = useTest();
  const [showCustomize, setShowCustomize] = useState(false);
  const [analitici, setAnalitici] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // Non mostrare se già scelto o non ancora caricato
  if (!loaded || preferences !== null) return null;

  if (showCustomize) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4">
          <h3 className="font-bold text-gray-900 text-base">Gestisci preferenze cookie</h3>

          {/* Tecnici — sempre attivi */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="mt-0.5">
              <div className="w-10 h-5 bg-green-500 rounded-full flex items-center justify-end px-0.5">
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-800">Cookie tecnici</p>
              <p className="text-xs text-gray-500 mt-0.5">Necessari per il funzionamento dell'app. Non possono essere disabilitati.</p>
            </div>
          </div>

            {/* Analitici — non attualmente implementati, mostrati come disabilitati */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg opacity-60">
              <div className="mt-0.5 w-10 h-5 bg-gray-300 rounded-full flex items-center justify-start px-0.5">
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800">Cookie analitici</p>
                <p className="text-xs text-gray-500 mt-0.5">Attualmente non utilizzati. Verranno introdotti solo con il tuo consenso.</p>
              </div>
            </div>

          {/* Marketing */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <button
              onClick={() => setMarketing(!marketing)}
              className={`mt-0.5 w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${marketing ? 'bg-orange-500 justify-end' : 'bg-gray-300 justify-start'}`}
            >
              <div className="w-4 h-4 bg-white rounded-full" />
            </button>
            <div>
              <p className="font-semibold text-sm text-gray-800">Cookie marketing</p>
              <p className="text-xs text-gray-500 mt-0.5">Attualmente non utilizzati. Potrebbero essere introdotti in futuro.</p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setShowCustomize(false)}
            >
              Indietro
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-[#1E73BE] hover:bg-[#155A96] text-white text-xs"
              onClick={() => savePreferences({ analitici, marketing })}
            >
              Salva preferenze
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4">
        {/* Intestazione */}
        <div className="flex items-center gap-2">
          <span className="text-xl">🍪</span>
          <h3 className="font-bold text-gray-900 text-base">Utilizziamo i cookie</h3>
        </div>

        {/* Testo */}
        <p className="text-xs text-gray-600 leading-relaxed">
          Usiamo cookie tecnici (necessari) e, con il tuo consenso, cookie analitici per migliorare l'app.
          I tuoi dati personali vengono trattati secondo la nostra{' '}
          <button
            onClick={() => setStep('privacy-policy')}
            className="text-[#1E73BE] underline font-medium"
          >
            Privacy Policy
          </button>
          {' '}e{' '}
          <button
            onClick={() => setStep('cookie-policy')}
            className="text-[#1E73BE] underline font-medium"
          >
            Cookie Policy
          </button>.
        </p>

        {/* Pulsanti */}
        <div className="space-y-2">
          <Button
            className="w-full bg-[#1E73BE] hover:bg-[#155A96] text-white font-semibold"
            onClick={acceptAll}
          >
            Accetta tutti
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs border-gray-300"
              onClick={rejectAll}
            >
              Solo necessari
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs border-gray-300"
              onClick={() => setShowCustomize(true)}
            >
              Personalizza
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
