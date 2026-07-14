// ══════════════════════════════════════════════════════════
// UdiTest — Pagina Privacy Policy (GDPR compliant)
// Aggiornata: maggio 2026
// ══════════════════════════════════════════════════════════
import { useTest } from '../contexts/TestContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
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
        <h1 className="text-lg font-bold">Privacy Policy</h1>
      </div>

      {/* Contenuto */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 text-sm text-gray-700 leading-relaxed">

        <p className="text-xs text-gray-400">Ultimo aggiornamento: maggio 2026</p>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">1. Titolare del Trattamento</h2>
          <p>
            Il titolare del trattamento dei dati personali è <strong>Acustica Di Maio</strong>,
            con sede in Torre Annunziata (NA), P.IVA 09539631219, raggiungibile all'indirizzo
            email <a href="mailto:info@acusticadimaio.it" className="text-[#1E73BE] underline">info@acusticadimaio.it</a>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">2. Dati Raccolti</h2>
          <p>Attraverso l'applicazione <strong>UdiTest</strong>, raccogliamo i seguenti dati personali:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Dati anagrafici</strong>: nome, cognome, data di nascita (opzionale), comune (opzionale).</li>
            <li><strong>Dati di contatto</strong>: indirizzo email, numero di cellulare (opzionale).</li>
            <li><strong>Dati del test uditivo</strong>: risultati dello screening vocale e tonale, audiogramma generato.</li>
            <li><strong>Dati tecnici</strong>: indirizzo IP, tipo di dispositivo, sistema operativo, browser utilizzato, data e ora di accesso (raccolti automaticamente per finalità di sicurezza e analisi statistica anonima).</li>
            <li><strong>Cookie</strong>: si veda la sezione Cookie Policy per il dettaglio.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">3. Finalità e Base Giuridica del Trattamento</h2>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-semibold text-gray-800">a) Erogazione del servizio di screening uditivo</p>
              <p className="text-xs mt-1">Base giuridica: esecuzione di un contratto (art. 6, par. 1, lett. b GDPR). I dati sono necessari per generare il referto PDF personalizzato.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-semibold text-gray-800">b) Comunicazioni commerciali di Acustica Di Maio</p>
              <p className="text-xs mt-1">Base giuridica: consenso dell'interessato (art. 6, par. 1, lett. a GDPR). Il consenso è facoltativo e revocabile in qualsiasi momento.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-semibold text-gray-800">c) Cessione a centri acustici e audioprotesisti partner</p>
              <p className="text-xs mt-1">Base giuridica: consenso esplicito dell'interessato (art. 6, par. 1, lett. a GDPR). I dati potranno essere condivisi con centri acustici, audioprotesisti e operatori del settore audiologico presenti sul territorio nazionale, al fine di ricevere preventivi, offerte e informazioni su apparecchi acustici e servizi audiologici. Il consenso è facoltativo e revocabile in qualsiasi momento.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-semibold text-gray-800">d) Sicurezza e prevenzione frodi</p>
              <p className="text-xs mt-1">Base giuridica: legittimo interesse del titolare (art. 6, par. 1, lett. f GDPR).</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">4. Destinatari dei Dati</h2>
          <p>I dati personali potranno essere comunicati a:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Fornitori di servizi tecnici e informatici (hosting, database, email) che agiscono come responsabili del trattamento ai sensi dell'art. 28 GDPR.</li>
            <li>Centri acustici, audioprotesisti e operatori del settore audiologico, <strong>esclusivamente previo consenso esplicito dell'interessato</strong>.</li>
            <li>Autorità competenti, ove richiesto dalla legge.</li>
          </ul>
          <p className="mt-2">I dati <strong>non vengono venduti</strong> a terzi né trasferiti al di fuori dello Spazio Economico Europeo senza adeguate garanzie.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">5. Periodo di Conservazione</h2>
          <p>I dati personali sono conservati per il tempo strettamente necessario alle finalità per cui sono stati raccolti:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Dati del test e referto PDF: <strong>24 mesi</strong> dalla data del test, salvo diversa richiesta dell'interessato.</li>
            <li>Dati di contatto per comunicazioni commerciali: fino alla revoca del consenso.</li>
            <li>Dati tecnici e log: <strong>12 mesi</strong>.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">6. Diritti dell'Interessato</h2>
          <p>Ai sensi degli artt. 15-22 del GDPR, l'interessato ha il diritto di:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Accesso</strong>: ottenere conferma del trattamento e copia dei dati.</li>
            <li><strong>Rettifica</strong>: correggere dati inesatti o incompleti.</li>
            <li><strong>Cancellazione</strong> ("diritto all'oblio"): richiedere la cancellazione dei dati.</li>
            <li><strong>Limitazione</strong>: limitare il trattamento in determinati casi.</li>
            <li><strong>Portabilità</strong>: ricevere i dati in formato strutturato e leggibile da macchina.</li>
            <li><strong>Opposizione</strong>: opporsi al trattamento basato su legittimo interesse o per finalità di marketing diretto.</li>
            <li><strong>Revoca del consenso</strong>: revocare in qualsiasi momento il consenso prestato, senza pregiudizio per la liceità del trattamento precedente.</li>
          </ul>
          <p className="mt-2">Per esercitare i propri diritti, scrivere a: <a href="mailto:info@acusticadimaio.it" className="text-[#1E73BE] underline">info@acusticadimaio.it</a></p>
          <p className="mt-1">È altresì possibile proporre reclamo all'<strong>Autorità Garante per la Protezione dei Dati Personali</strong> (www.garanteprivacy.it).</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">7. Natura del Conferimento</h2>
          <p>Il conferimento dei dati contrassegnati come obbligatori (email) è necessario per la fruizione del servizio. Il mancato conferimento comporta l'impossibilità di ricevere il referto PDF. Il conferimento degli altri dati è facoltativo.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">8. Modifiche alla Privacy Policy</h2>
          <p>Il titolare si riserva il diritto di modificare la presente informativa in qualsiasi momento. Le modifiche saranno comunicate attraverso l'applicazione. Si consiglia di consultare periodicamente questa pagina.</p>
        </section>

        <div className="border-t pt-4 text-xs text-gray-400 text-center">
          UdiTest — di Acustica Di Maio · Torre Annunziata (NA) · P.IVA 09539631219
        </div>
      </div>
    </div>
  );
}
