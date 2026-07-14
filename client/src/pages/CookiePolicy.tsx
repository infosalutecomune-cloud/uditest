// ══════════════════════════════════════════════════════════
// UdiTest — Pagina Cookie Policy (GDPR compliant)
// Aggiornata: maggio 2026
// ══════════════════════════════════════════════════════════
import { useTest } from '../contexts/TestContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CookiePolicy() {
  const { setStep } = useTest();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#1E73BE] text-white px-4 py-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 p-1"
          onClick={() => setStep('home')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold">Cookie Policy</h1>
      </div>

      {/* Contenuto */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 text-sm text-gray-700 leading-relaxed">

        <p className="text-xs text-gray-400">Ultimo aggiornamento: maggio 2026</p>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Cosa sono i cookie?</h2>
          <p>
            I cookie sono piccoli file di testo che i siti web e le applicazioni salvano sul dispositivo dell'utente
            durante la navigazione. Vengono utilizzati per far funzionare correttamente il servizio, ricordare
            le preferenze dell'utente e raccogliere informazioni statistiche anonime.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Cookie utilizzati da UdiTest</h2>

          <div className="space-y-4">
            {/* Tecnici */}
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">TECNICI</span>
                <span className="text-xs text-green-700 font-medium">Sempre attivi — non richiedono consenso</span>
              </div>
              <table className="w-full text-xs mt-2">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left pb-1">Nome</th>
                    <th className="text-left pb-1">Finalità</th>
                    <th className="text-left pb-1">Durata</th>
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  <tr>
                    <td className="font-mono pr-3 py-1">session</td>
                    <td className="pr-3">Mantiene la sessione utente autenticata</td>
                    <td>Sessione</td>
                  </tr>
                  <tr>
                    <td className="font-mono pr-3 py-1">cookie_consent</td>
                    <td className="pr-3">Salva le preferenze cookie dell'utente</td>
                    <td>12 mesi</td>
                  </tr>
                  <tr>
                    <td className="font-mono pr-3 py-1">localStorage</td>
                    <td className="pr-3">Salva dati test e anagrafica localmente sul dispositivo</td>
                    <td>Persistente</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Analitici — nota: non attualmente implementati */}
            <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-gray-400 text-white text-xs font-bold px-2 py-0.5 rounded">ANALITICI</span>
                <span className="text-xs text-gray-500 font-medium">Attualmente non utilizzati</span>
              </div>
              <p className="text-xs text-gray-500">
                L'app <strong>non utilizza attualmente cookie analitici</strong>. Qualora venissero introdotti in futuro,
                questa policy verrà aggiornata e sarà richiesto un nuovo consenso esplicito.
              </p>
            </div>

            {/* Marketing */}
            <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded">MARKETING</span>
                <span className="text-xs text-orange-700 font-medium">Richiedono consenso</span>
              </div>
              <p className="text-xs text-gray-600">
                Attualmente l'applicazione <strong>non utilizza cookie di profilazione o marketing</strong>.
                Qualora venissero introdotti in futuro, questa policy verrà aggiornata e sarà richiesto
                un nuovo consenso esplicito.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Come gestire i cookie</h2>
          <p>
            Puoi modificare le tue preferenze sui cookie in qualsiasi momento cliccando sul pulsante
            <strong> "Gestisci preferenze cookie"</strong> presente nel footer dell'app.
          </p>
          <p className="mt-2">
            Puoi inoltre gestire i cookie direttamente dal tuo browser. Di seguito le istruzioni per i browser più comuni:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-[#1E73BE] underline">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/it/kb/Gestione-dei-cookie" target="_blank" rel="noopener noreferrer" className="text-[#1E73BE] underline">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-[#1E73BE] underline">Apple Safari</a></li>
            <li><a href="https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-[#1E73BE] underline">Microsoft Edge</a></li>
          </ul>
          <p className="mt-2 text-xs text-gray-500">
            Nota: la disabilitazione dei cookie tecnici potrebbe compromettere il corretto funzionamento dell'applicazione.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">LocalStorage</h2>
          <p>
            Oltre ai cookie, l'app utilizza il <strong>localStorage</strong> del browser per salvare
            localmente sul tuo dispositivo i dati del test (risultati, anagrafica, storico esami).
            Questi dati <strong>non vengono trasmessi a server esterni</strong> senza il tuo consenso
            esplicito e rimangono sul tuo dispositivo. Puoi cancellarli in qualsiasi momento dalla
            sezione "Profilo" dell'app o svuotando la cache del browser.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Contatti</h2>
          <p>
            Per qualsiasi domanda relativa all'uso dei cookie, scrivi a:{' '}
            <a href="mailto:info@acusticadimaio.it" className="text-[#1E73BE] underline">info@acusticadimaio.it</a>
          </p>
        </section>

        <div className="border-t pt-4 text-xs text-gray-400 text-center">
          UdiTest — di Acustica Di Maio · Torre Annunziata (NA) · P.IVA 09539631219
        </div>
      </div>
    </div>
  );
}
