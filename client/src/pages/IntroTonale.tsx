// ══════════════════════════════════════════════════════════
// UdiTest — Intro Test dei Toni
// Spiegazione completa + avvio audiometria tonale
// ══════════════════════════════════════════════════════════
import { Music, Headphones, Volume2, Play, ChevronRight, AlertTriangle, Smartphone, CheckCircle, X } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { useTest } from '@/contexts/TestContext';

const FREQUENZE_INFO = [
  { hz: 500,  nome: 'Bassa',             esempio: 'Voce maschile profonda, motori',       colore: '#22C55E' },
  { hz: 750,  nome: 'Medio-bassa',       esempio: 'Voce grave, basso musicale',           colore: '#16A34A' },
  { hz: 1000, nome: 'Media',             esempio: 'Voce normale, conversazione',          colore: '#3B82F6' },
  { hz: 1500, nome: 'Media-alta',        esempio: 'Transizione vocali-consonanti',        colore: '#6366F1' },
  { hz: 2000, nome: 'Alta',              esempio: 'Consonanti, sibilanti (s, f, sh)',     colore: '#F59E0B' },
  { hz: 3000, nome: 'Molto alta',        esempio: 'Squillo telefono, strumenti acuti',    colore: '#F97316' },
  { hz: 4000, nome: 'Acutissima',        esempio: 'Campanelli, uccelli, fischi',          colore: '#EF4444' },
];

const STEPS = [
  {
    icon: Headphones,
    titolo: 'Indossa le cuffie',
    desc: 'Le cuffie migliorano molto l\'accuratezza. Se non le hai, usa lo speaker con il volume al massimo.',
  },
  {
    icon: Smartphone,
    titolo: 'Ambiente silenzioso',
    desc: 'Siediti in un posto tranquillo. Il rumore di fondo può interferire con i toni più deboli.',
  },
  {
    icon: Volume2,
    titolo: 'Volume al massimo',
    desc: 'Porta il volume del dispositivo al massimo prima di iniziare il test.',
  },
  {
    icon: Play,
    titolo: 'Premi e ascolta',
    desc: 'Per ogni frequenza, premi il pulsante e ascolta. Poi rispondi "Sì" se hai sentito il tono, "No" se non lo hai sentito.',
  },
];

export default function IntroTonale() {
  const { setStep } = useTest();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <AppHeader
        onBack={() => setStep('home')}
        title="Test dei Toni"
        subtitle="Come funziona"
      />

      <div className="flex-1 overflow-y-auto">
        <div className="container py-6 space-y-5 animate-fade-in-up">

          {/* ── HERO ── */}
          <div className="card-voicecheck text-center py-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: '#CCFBF1' }}>
              <Music size={40} color="#0D9488" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#1E293B] mb-2">
              Screening Audiometrico Tonale
            </h2>
            <p className="text-[#64748B] text-base leading-relaxed">
              Sentirai 7 toni puri a frequenze diverse. Scopri se riesci a sentirli tutti
              o se hai difficoltà alle frequenze alte, tipiche della perdita uditiva.
              Lo stesso tono può ripresentarsi più volte: è normale, il sistema lo usa per confermare la tua soglia.
            </p>
          </div>

          {/* ── LE 7 FREQUENZE ── */}
          <div className="card-voicecheck">
            <h3 className="font-extrabold text-[#1E293B] text-lg mb-4">Le 7 frequenze del test</h3>
            <div className="space-y-3">
              {FREQUENZE_INFO.map((f) => (
                <div
                  key={f.hz}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: f.colore + '15' }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-extrabold text-sm"
                    style={{ backgroundColor: f.colore + '25', color: f.colore }}
                  >
                    {f.hz}
                    <span className="text-xs ml-0.5">Hz</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#1E293B] text-sm">{f.nome}</p>
                    <p className="text-[#64748B] text-xs leading-relaxed">{f.esempio}</p>
                  </div>
                  <CheckCircle size={18} color={f.colore} className="flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* ── COME FUNZIONA ── */}
          <div className="card-voicecheck">
            <h3 className="font-extrabold text-[#1E293B] text-lg mb-4">Come prepararsi</h3>
            <div className="space-y-4">
              {STEPS.map((s, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#CCFBF1' }}
                  >
                    <s.icon size={20} color="#0D9488" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-bold text-[#1E293B] text-base">{s.titolo}</p>
                    <p className="text-[#64748B] text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── CTA ── */}
          <button
            className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-extrabold text-white text-xl shadow-lg transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #0D9488 0%, #0A7A70 100%)' }}
            onClick={() => setStep('calibrazione-tonale')}
          >
            <Music size={26} />
            Inizia il Test dei Toni
            <ChevronRight size={24} />
          </button>

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
              Questo è uno <strong>screening indicativo</strong>. I risultati dipendono dal volume
              del dispositivo e dall'ambiente. Non sostituiscono una valutazione audiologica professionale.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
