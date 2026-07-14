// ══════════════════════════════════════════════════════════
// UdiTest — Pagina Privacy e Consenso GDPR
// Mostrata prima di iniziare il test
// ══════════════════════════════════════════════════════════
import { useState } from 'react';
import { Shield, ChevronRight, ExternalLink } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { useTest } from '@/contexts/TestContext';

export default function Privacy() {
  const { setStep } = useTest();
  const [consensoPrivacy, setConsensoPrivacy] = useState(false);
  const [consensoMicrofono, setConsensoMicrofono] = useState(false);

  const tuttiAccettati = consensoPrivacy && consensoMicrofono;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <AppHeader
        onBack={() => setStep('home')}
        title="Privacy e Consenso"
        subtitle="Prima di iniziare"
      />

      <div className="flex-1 overflow-y-auto">
        <div className="container py-6 space-y-5 animate-fade-in-up">

          {/* ── ICONA E TITOLO ── */}
          <div className="card-voicecheck text-center py-6">
            <div className="w-16 h-16 rounded-full bg-[#EBF4FC] flex items-center justify-center mx-auto mb-3">
              <Shield size={32} color="#1E73BE" />
            </div>
            <h2 className="font-extrabold text-[#1E293B] text-xl mb-2">
              Informativa sulla Privacy
            </h2>
            <p className="text-[#64748B] text-base leading-relaxed">
              Prima di iniziare il test, leggi le informazioni su come vengono
              trattati i tuoi dati.
            </p>
          </div>

          {/* ── INFORMATIVA ── */}
          <div className="card-voicecheck">
            <h3 className="font-extrabold text-[#1E293B] text-base mb-3">
              Cosa succede durante il test
            </h3>
            <div className="space-y-3 text-sm text-[#64748B] leading-relaxed">
              <p>
                <strong className="text-[#1E293B]">Microfono:</strong> Il test utilizza il microfono del tuo dispositivo
                per registrare la tua voce. L'audio viene elaborato per riconoscere le parole che dici.
              </p>
              <p>
                <strong className="text-[#1E293B]">Dati audio:</strong> Le registrazioni audio vengono
                inviate a un servizio di trascrizione vocale (Whisper AI) per il riconoscimento delle parole.
                L'audio <strong>non viene conservato</strong> dopo l'elaborazione.
              </p>
              <p>
                <strong className="text-[#1E293B]">Risultati:</strong> I risultati del test (punteggio SRT50,
                percentuale di parole corrette) vengono mostrati solo a te. Non vengono salvati su server
                né associati alla tua identità, a meno che tu non scelga di contattarci.
              </p>
              <p>
                <strong className="text-[#1E293B]">Contatto volontario:</strong> Se scegli di contattarci
                tramite WhatsApp, condividi volontariamente i tuoi dati di contatto con Acustica Di Maio.
              </p>
            </div>
          </div>

          {/* ── TITOLARE ── */}
          <div className="card-voicecheck">
            <h3 className="font-extrabold text-[#1E293B] text-base mb-3">
              Titolare del trattamento
            </h3>
            <div className="space-y-1 text-sm text-[#64748B]">
              <p><strong className="text-[#1E293B]">Acustica Di Maio</strong></p>
              <p>Specialisti dell'udito in provincia di Napoli</p>
              <a
                href="https://www.acusticadimaio.it"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#1E73BE] font-semibold"
              >
                www.acusticadimaio.it
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* ── CHECKBOX CONSENSI ── */}
          <div className="card-voicecheck space-y-4">
            <h3 className="font-extrabold text-[#1E293B] text-base">
              Consensi richiesti
            </h3>

            {/* Consenso privacy */}
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={consensoPrivacy}
                  onChange={e => setConsensoPrivacy(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className="w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: consensoPrivacy ? '#1E73BE' : 'white',
                    borderColor: consensoPrivacy ? '#1E73BE' : '#CBD5E1',
                  }}
                >
                  {consensoPrivacy && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7L5.5 10.5L12 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <p className="text-[#1E293B] text-sm leading-relaxed">
                Ho letto e accetto l'<strong>informativa sulla privacy</strong> (D.Lgs. 196/2003 e GDPR 2016/679).
                Acconsento al trattamento dei miei dati audio per l'esecuzione del test dell'udito.
                <span className="text-[#EF4444]"> *</span>
              </p>
            </label>

            {/* Consenso microfono */}
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={consensoMicrofono}
                  onChange={e => setConsensoMicrofono(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className="w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: consensoMicrofono ? '#1E73BE' : 'white',
                    borderColor: consensoMicrofono ? '#1E73BE' : '#CBD5E1',
                  }}
                >
                  {consensoMicrofono && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7L5.5 10.5L12 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <p className="text-[#1E293B] text-sm leading-relaxed">
                Autorizzo l'accesso al <strong>microfono</strong> del mio dispositivo per la durata del test.
                <span className="text-[#EF4444]"> *</span>
              </p>
            </label>

            <p className="text-[#94A3B8] text-xs">
              <span className="text-[#EF4444]">*</span> Campi obbligatori
            </p>
          </div>

          {/* ── CTA ── */}
          <div className="pb-6">
            <button
              className="btn-primary"
              disabled={!tuttiAccettati}
              onClick={() => setStep('scelta-audio')}
              style={{
                opacity: tuttiAccettati ? 1 : 0.4,
                cursor: tuttiAccettati ? 'pointer' : 'not-allowed',
              }}
            >
              <Shield size={20} />
              Accetta e Inizia il Test
              <ChevronRight size={20} />
            </button>

            {!tuttiAccettati && (
              <p className="text-center text-[#94A3B8] text-sm mt-3">
                Accetta entrambi i consensi per continuare
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
