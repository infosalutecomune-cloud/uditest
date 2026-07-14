// ══════════════════════════════════════════════════════════
// UdiTest — Intro Test Vocale
// Spiegazione completa + scelta modalità + avvio
// ══════════════════════════════════════════════════════════
import { Mic, Headphones, Volume2, Activity, ChevronRight, AlertTriangle, Smartphone, X } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { useTest } from '@/contexts/TestContext';

const STEPS_COME_FUNZIONA = [
  {
    icon: Headphones,
    titolo: 'Preparati',
    desc: 'Siediti in un posto silenzioso. Indossa le cuffie se le hai, oppure usa lo speaker del telefono.',
  },
  {
    icon: Smartphone,
    titolo: 'Tieni il telefono vicino',
    desc: 'Tieni il telefono a 30–50 cm dalla bocca: abbastanza vicino da sentire bene e da premere i tasti comodamente.',
  },
  {
    icon: Volume2,
    titolo: 'Alza il volume',
    desc: 'Porta il volume al massimo prima di iniziare.',
  },
  {
    icon: Mic,
    titolo: 'Ascolta e ripeti',
    desc: 'Sentirai una frase. Premi il microfono e ripeti le parole che hai sentito, anche se non sei sicuro.',
  },
  {
    icon: Activity,
    titolo: 'Ricevi il risultato',
    desc: 'Dopo 14 frasi vedrai il tuo punteggio SRT50 con un confronto rispetto alla norma.',
  },
];

const MODALITA = [
  {
    id: 'completo' as const,
    titolo: 'Test Completo',
    desc: 'Silenzio + Rumore — il più accurato',
    durata: '~8 min',
    consigliato: true,
    colore: '#1E73BE',
    bg: '#EBF4FC',
  },
  {
    id: 'silenzio' as const,
    titolo: 'Solo Silenzio',
    desc: 'Frasi senza rumore di fondo',
    durata: '~4 min',
    consigliato: false,
    colore: '#22C55E',
    bg: '#F0FDF4',
  },
  {
    id: 'rumore' as const,
    titolo: 'Solo Rumore',
    desc: 'Frasi con rumore di fondo',
    durata: '~4 min',
    consigliato: false,
    colore: '#F59E0B',
    bg: '#FFFBEB',
  },
];

export default function IntroVocale() {
  const { setStep, setModalitaTest, setFaseCompleto } = useTest();

  function avvia(modalita: 'silenzio' | 'rumore' | 'completo') {
    setModalitaTest(modalita);
    // In modalità completo: fase 1 = rumore, fase 2 = silenzio
    setFaseCompleto(modalita === 'completo' ? 1 : null);
    setStep('privacy');
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <AppHeader
        onBack={() => setStep('home')}
        title="Test Vocale"
        subtitle="Come funziona"
      />

      <div className="flex-1 overflow-y-auto">
        <div className="container py-6 space-y-5 animate-fade-in-up">

          {/* ── HERO ── */}
          <div className="card-voicecheck text-center py-6">
            <div className="w-20 h-20 rounded-full bg-[#EBF4FC] flex items-center justify-center mx-auto mb-3">
              <Mic size={40} color="#1E73BE" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#1E293B] mb-2">
              Test Vocale nel Rumore
            </h2>
            <p className="text-[#64748B] text-base leading-relaxed">
              Misura quanto bene capisci le parole in silenzio e in ambienti rumorosi.
              Basato sul protocollo scientifico <strong>SiIMax</strong> (Università di Milano).
            </p>
          </div>

          {/* ── COME FUNZIONA ── */}
          <div className="card-voicecheck">
            <h3 className="font-extrabold text-[#1E293B] text-lg mb-4">Come funziona</h3>
            <div className="space-y-4">
              {STEPS_COME_FUNZIONA.map((s, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#1E73BE] flex items-center justify-center flex-shrink-0">
                    <s.icon size={20} color="white" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-bold text-[#1E293B] text-base">{s.titolo}</p>
                    <p className="text-[#64748B] text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── SCEGLI MODALITÀ ── */}
          <div className="card-voicecheck">
            <h3 className="font-extrabold text-[#1E293B] text-lg mb-4">Scegli la modalità</h3>
            <div className="space-y-3">
              {MODALITA.map((m) => (
                <button
                  key={m.id}
                  onClick={() => avvia(m.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-95 text-left"
                  style={{
                    backgroundColor: m.bg,
                    borderColor: m.colore + '40',
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: m.colore + '20' }}
                  >
                    <Mic size={24} color={m.colore} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-extrabold text-[#1E293B] text-base">{m.titolo}</p>
                      {m.consigliato && (
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: m.colore }}
                        >
                          Consigliato
                        </span>
                      )}
                    </div>
                    <p className="text-[#64748B] text-sm">{m.desc}</p>
                    <p className="text-xs font-semibold mt-1" style={{ color: m.colore }}>{m.durata}</p>
                  </div>
                  <ChevronRight size={22} color={m.colore} className="flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* ── ANNULLA ── */}
          <button
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ backgroundColor: '#EF4444', color: 'white' }}
            onClick={() => setStep('home')}
          >
            <X size={18} />
            Annulla e torna alla home
          </button>

          {/* ── DISCLAIMER ── */}
          <div className="rounded-2xl border border-[#F59E0B] bg-[#FFFBEB] p-4 flex items-start gap-3 mb-6">
            <AlertTriangle size={18} color="#F59E0B" className="flex-shrink-0 mt-0.5" />
            <p className="text-[#92400E] text-xs leading-relaxed">
              Questo è uno <strong>screening indicativo</strong>. I risultati non sostituiscono
              una valutazione audiologica professionale eseguita in studio.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
