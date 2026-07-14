// ══════════════════════════════════════════════════════════
// UdiTest — Pagina Scelta Audio
// Cuffie (consigliato) vs Speaker
// ══════════════════════════════════════════════════════════
import { Headphones, Volume2, Check, AlertTriangle, ChevronRight } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { useTest } from '@/contexts/TestContext';

export default function SceltaAudio() {
  const { setStep, setModalitaAudio, modalitaAudio } = useTest();

  function seleziona(m: 'cuffie' | 'speaker') {
    setModalitaAudio(m);
  }

  function continua() {
    if (modalitaAudio) setStep('calibrazione');
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <AppHeader
        onBack={() => setStep('home')}
        title="Dispositivo Audio"
        subtitle="Come ascolterai il test?"
      />

      <div className="flex-1 overflow-y-auto">
        <div className="container py-6 space-y-4 animate-fade-in-up">

          <p className="text-[#64748B] text-center text-base">
            Scegli come vuoi ascoltare le frasi del test
          </p>

          {/* ── OPZIONE CUFFIE ── */}
          <button
            onClick={() => seleziona('cuffie')}
            className={`w-full text-left rounded-2xl border-2 p-5 transition-all ${
              modalitaAudio === 'cuffie'
                ? 'border-[#1E73BE] bg-[#EBF4FC]'
                : 'border-[#D6E9F8] bg-white'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                modalitaAudio === 'cuffie' ? 'bg-[#1E73BE]' : 'bg-[#EBF4FC]'
              }`}>
                <Headphones size={28} color={modalitaAudio === 'cuffie' ? 'white' : '#1E73BE'} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-extrabold text-[#1E293B] text-lg">Cuffie</span>
                  <span className="bg-[#1E73BE] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    Consigliato
                  </span>
                </div>
                <div className="space-y-1">
                  {['Risultati più precisi', 'Isola dal rumore esterno', 'Microfono non capta l\'audio'].map((v) => (
                    <div key={v} className="flex items-center gap-2">
                      <Check size={14} color="#22C55E" />
                      <span className="text-[#64748B] text-sm">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              {modalitaAudio === 'cuffie' && (
                <div className="w-6 h-6 rounded-full bg-[#1E73BE] flex items-center justify-center flex-shrink-0">
                  <Check size={14} color="white" />
                </div>
              )}
            </div>
          </button>

          {/* ── OPZIONE SPEAKER ── */}
          <button
            onClick={() => seleziona('speaker')}
            className={`w-full text-left rounded-2xl border-2 p-5 transition-all ${
              modalitaAudio === 'speaker'
                ? 'border-[#F59E0B] bg-[#FFFBEB]'
                : 'border-[#D6E9F8] bg-white'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                modalitaAudio === 'speaker' ? 'bg-[#F59E0B]' : 'bg-[#FEF3C7]'
              }`}>
                <Volume2 size={28} color={modalitaAudio === 'speaker' ? 'white' : '#F59E0B'} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-extrabold text-[#1E293B] text-lg">Speaker</span>
                </div>
                <div className="space-y-1">
                  {['Nessun accessorio necessario', 'Facile da usare'].map((v) => (
                    <div key={v} className="flex items-center gap-2">
                      <Check size={14} color="#22C55E" />
                      <span className="text-[#64748B] text-sm">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2 mt-2 p-2 rounded-xl bg-[#FEF3C7]">
                  <AlertTriangle size={14} color="#F59E0B" className="flex-shrink-0 mt-0.5" />
                  <span className="text-[#92400E] text-xs">Precisione ridotta — usa in ambiente silenzioso</span>
                </div>
              </div>
              {modalitaAudio === 'speaker' && (
                <div className="w-6 h-6 rounded-full bg-[#F59E0B] flex items-center justify-center flex-shrink-0">
                  <Check size={14} color="white" />
                </div>
              )}
            </div>
          </button>

          <div className="pb-6 pt-2">
            <button
              className="btn-primary"
              onClick={continua}
              disabled={!modalitaAudio}
            >
              Continua
              <ChevronRight size={22} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
