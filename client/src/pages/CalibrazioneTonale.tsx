// ══════════════════════════════════════════════════════════
// UdiTest — Calibrazione per il Test dei Toni
// Step 1: Posizione e distanza
// Step 2: Misurazione rumore ambiente (microfono)
// Step 3: Calibrazione volume (tono 1000Hz)
// Al termine naviga ad 'audiometria'
// ══════════════════════════════════════════════════════════
import { useState, useRef, useEffect } from 'react';
import {
  Volume2, Play, Check, X, ChevronRight, RefreshCw,
  Mic, Smartphone, AlertTriangle, Headphones
} from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import SoundwaveBars from '@/components/SoundwaveBars';
import { useTest } from '@/contexts/TestContext';

type Step = 'posizione' | 'ambiente' | 'volume';
type StatoAmbiente = 'attesa' | 'misurando' | 'ok' | 'rumoroso' | 'errore';
type StatoVolume = 'attesa' | 'riproducendo' | 'sentito' | 'non-sentito';

// Tono di calibrazione 1000 Hz generato via Web Audio API
function riproduciTonoCalibrazioneWA(
  onEnd: () => void,
  stopRef: React.MutableRefObject<(() => void) | null>
) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.8, ctx.currentTime + 1.9);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.0);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 2.0);
    osc.onended = () => { ctx.close(); onEnd(); };
    stopRef.current = () => {
      try { osc.stop(); ctx.close(); } catch { /* già fermato */ }
      onEnd();
    };
  } catch {
    onEnd();
  }
}

export default function CalibrazioneTonale() {
  const { setStep } = useTest();
  const [currentStep, setCurrentStep] = useState<Step>('posizione');

  // ── Step 2: Ambiente ──
  const [statoAmbiente, setStatoAmbiente] = useState<StatoAmbiente>('attesa');
  const [dbLevel, setDbLevel] = useState(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // ── Step 3: Volume ──
  const [statoVolume, setStatoVolume] = useState<StatoVolume>('attesa');
  const stopTonoRef = useRef<(() => void) | null>(null);

  const pulisciMic = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      pulisciMic();
      stopTonoRef.current?.();
    };
  }, []);

  // ── Misurazione rumore ambiente ──
  async function misuraAmbiente() {
    setStatoAmbiente('misurando');
    setDbLevel(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      let samples: number[] = [];
      const startTime = Date.now();

      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sumSq = 0;
        for (let i = 0; i < data.length; i++) {
          const normalized = (data[i] - 128) / 128;
          sumSq += normalized * normalized;
        }
        const rms = Math.sqrt(sumSq / data.length);
        const dBFS = rms > 0 ? 20 * Math.log10(rms) : -60;
        const dBEst = Math.round(Math.max(30, Math.min(80, 80 + dBFS)));
        samples.push(dBEst);
        setDbLevel(dBEst);

        if (Date.now() - startTime < 3000) {
          animFrameRef.current = requestAnimationFrame(tick);
        } else {
          const sorted = [...samples].sort((a, b) => a - b);
          const p75 = sorted[Math.floor(sorted.length * 0.75)];
          pulisciMic();
          if (p75 <= 45) {
            setDbLevel(p75);
            setStatoAmbiente('ok');
          } else {
            setDbLevel(p75);
            setStatoAmbiente('rumoroso');
          }
        }
      };
      tick();
    } catch {
      setStatoAmbiente('errore');
    }
  }

  function avviaRiproduzioneVolume() {
    stopTonoRef.current?.();
    setStatoVolume('riproducendo');
    riproduciTonoCalibrazioneWA(() => setStatoVolume('attesa'), stopTonoRef);
  }

  function stopTono() {
    stopTonoRef.current?.();
    stopTonoRef.current = null;
    setStatoVolume('attesa');
  }

  const semaforoAmbiente =
    statoAmbiente === 'ok' ? '#22C55E' :
    statoAmbiente === 'rumoroso' ? '#EF4444' :
    statoAmbiente === 'misurando' ? '#F59E0B' : '#D6E9F8';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <AppHeader
        onBack={() => {
          pulisciMic();
          stopTono();
          if (currentStep === 'posizione') setStep('intro-tonale');
          else if (currentStep === 'ambiente') setCurrentStep('posizione');
          else setCurrentStep('ambiente');
        }}
        title="Preparazione al Test"
        subtitle={`Passo ${currentStep === 'posizione' ? 1 : currentStep === 'ambiente' ? 2 : 3} di 3`}
      />

      {/* Progress steps */}
      <div className="bg-white border-b border-[#D6E9F8] px-4 py-3">
        <div className="flex items-center justify-center gap-2 max-w-[480px] mx-auto">
          {(['posizione', 'ambiente', 'volume'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold"
                style={{
                  backgroundColor: currentStep === s ? '#1E73BE' :
                    (['posizione', 'ambiente', 'volume'].indexOf(currentStep) > i) ? '#22C55E' : '#D6E9F8',
                  color: currentStep === s || (['posizione', 'ambiente', 'volume'].indexOf(currentStep) > i) ? 'white' : '#94A3B8',
                }}
              >
                {(['posizione', 'ambiente', 'volume'].indexOf(currentStep) > i) ? '✓' : i + 1}
              </div>
              {i < 2 && <div className="w-8 h-0.5 bg-[#D6E9F8]" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container py-6 space-y-5 animate-fade-in-up">

          {/* ══ STEP 1: POSIZIONE ══ */}
          {currentStep === 'posizione' && (
            <>
              <div className="card-voicecheck">
                <h3 className="font-extrabold text-[#1E293B] text-xl mb-4 text-center">
                  Preparati per il test
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#EBF4FC]">
                    <div className="w-12 h-12 rounded-full bg-[#1E73BE] flex items-center justify-center flex-shrink-0">
                      <Smartphone size={24} color="white" />
                    </div>
                    <div>
                      <p className="font-extrabold text-[#1E293B] text-base mb-1">Tieni il telefono vicino</p>
                      <p className="text-[#64748B] text-sm leading-relaxed">
                        Tienilo a <strong>30–50 cm</strong> dal viso, abbastanza vicino da sentire
                        i toni chiaramente.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#F0FDF4]">
                    <div className="w-12 h-12 rounded-full bg-[#22C55E] flex items-center justify-center flex-shrink-0">
                      <Headphones size={24} color="white" />
                    </div>
                    <div>
                      <p className="font-extrabold text-[#1E293B] text-base mb-1">Cuffie consigliate</p>
                      <p className="text-[#64748B] text-sm leading-relaxed">
                        Se hai le cuffie, indossale. Migliorano molto la precisione del test tonale.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#FFFBEB]">
                    <div className="w-12 h-12 rounded-full bg-[#F59E0B] flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={24} color="white" />
                    </div>
                    <div>
                      <p className="font-extrabold text-[#1E293B] text-base mb-1">Posto silenzioso</p>
                      <p className="text-[#64748B] text-sm leading-relaxed">
                        Siediti in un posto tranquillo. I toni più deboli sono difficili da sentire con rumore di fondo.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#EBF4FC]">
                    <div className="w-12 h-12 rounded-full bg-[#1E73BE] flex items-center justify-center flex-shrink-0">
                      <Volume2 size={24} color="white" />
                    </div>
                    <div>
                      <p className="font-extrabold text-[#1E293B] text-base mb-1">Volume al massimo</p>
                      <p className="text-[#64748B] text-sm leading-relaxed">
                        Alza il volume del telefono al massimo con i tasti laterali.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={() => setCurrentStep('ambiente')}
              >
                Sono pronto
                <ChevronRight size={22} />
              </button>

              {/* Pulsante Annulla rosso in basso */}
              <button
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ backgroundColor: '#EF4444', color: 'white' }}
                onClick={() => setStep('home')}
              >
                <X size={18} />
                Annulla e torna alla home
              </button>
            </>
          )}

          {/* ══ STEP 2: AMBIENTE ══ */}
          {currentStep === 'ambiente' && (
            <>
              <div className="card-voicecheck text-center">
                <div className="flex items-center gap-3 mb-4 justify-center">
                  <div className="w-10 h-10 rounded-full bg-[#1E73BE] flex items-center justify-center flex-shrink-0">
                    <Mic size={22} color="white" />
                  </div>
                  <h3 className="font-extrabold text-[#1E293B] text-lg">
                    Misuriamo il rumore intorno a te
                  </h3>
                </div>
                <p className="text-[#64748B] text-base mb-6">
                  Premi il pulsante e stai in silenzio per 3 secondi.
                </p>

                <div className="flex justify-center mb-6">
                  <div
                    className="w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-500"
                    style={{ backgroundColor: semaforoAmbiente + '20', border: `4px solid ${semaforoAmbiente}` }}
                  >
                    {statoAmbiente === 'misurando' ? (
                      <div className="flex gap-1 items-end h-10">
                        {[1,2,3,4,5].map(i => (
                          <div
                            key={i}
                            className="w-2 rounded-full animate-pulse"
                            style={{
                              height: 8 + (dbLevel / 255) * 24 * (i % 3 === 0 ? 1.5 : 1),
                              backgroundColor: '#F59E0B',
                              animationDelay: `${i * 0.1}s`,
                            }}
                          />
                        ))}
                      </div>
                    ) : statoAmbiente === 'ok' ? (
                      <Check size={40} color="#22C55E" />
                    ) : statoAmbiente === 'rumoroso' ? (
                      <AlertTriangle size={40} color="#EF4444" />
                    ) : (
                      <Mic size={40} color="#94A3B8" />
                    )}
                    {statoAmbiente !== 'misurando' && statoAmbiente !== 'attesa' && (
                      <p className="text-xs font-bold mt-1" style={{ color: semaforoAmbiente }}>
                        ~{dbLevel} dB
                      </p>
                    )}
                  </div>
                </div>

                {statoAmbiente === 'attesa' && (
                  <button className="btn-primary" onClick={misuraAmbiente}>
                    <Mic size={20} />
                    Misura il rumore
                  </button>
                )}
                {statoAmbiente === 'misurando' && (
                  <div className="py-4">
                    <p className="text-[#F59E0B] font-extrabold text-lg animate-pulse">Silenzio... misuro...</p>
                    <p className="text-[#64748B] text-sm mt-1">3 secondi</p>
                  </div>
                )}
                {statoAmbiente === 'ok' && (
                  <div className="space-y-4">
                    <div className="bg-[#F0FDF4] rounded-2xl p-4">
                      <p className="font-extrabold text-[#166534] text-lg">Ambiente silenzioso ✓</p>
                      <p className="text-[#64748B] text-sm mt-1">Ottimo per il test!</p>
                    </div>
                    <button className="btn-primary" onClick={() => setCurrentStep('volume')}>
                      Continua <ChevronRight size={22} />
                    </button>
                  </div>
                )}
                {statoAmbiente === 'rumoroso' && (
                  <div className="space-y-4">
                    <div className="bg-[#FEF2F2] rounded-2xl p-4">
                      <p className="font-extrabold text-[#991B1B] text-lg">Ambiente rumoroso</p>
                      <p className="text-[#64748B] text-sm mt-1">
                        C'è troppo rumore. I risultati potrebbero essere meno precisi.
                      </p>
                    </div>
                    <button className="btn-primary" onClick={misuraAmbiente}>
                      <RefreshCw size={20} /> Riprova
                    </button>
                    <button className="btn-secondary text-sm" onClick={() => setCurrentStep('volume')}>
                      Continua comunque
                    </button>
                  </div>
                )}
                {statoAmbiente === 'errore' && (
                  <div className="space-y-4">
                    <div className="bg-[#FFFBEB] rounded-2xl p-4">
                      <p className="font-extrabold text-[#92400E] text-base">Microfono non accessibile</p>
                      <p className="text-[#64748B] text-sm mt-1">Abilita il permesso microfono nelle impostazioni.</p>
                    </div>
                    <button className="btn-secondary" onClick={() => setCurrentStep('volume')}>
                      Salta questo passo
                    </button>
                  </div>
                )}
              </div>

              {/* Pulsante Annulla rosso in basso */}
              <button
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ backgroundColor: '#EF4444', color: 'white' }}
                onClick={() => { pulisciMic(); setStep('home'); }}
              >
                <X size={18} />
                Annulla e torna alla home
              </button>
            </>
          )}

          {/* ══ STEP 3: VOLUME ══ */}
          {currentStep === 'volume' && (
            <>
              {statoVolume !== 'sentito' && statoVolume !== 'non-sentito' && (
                <>
                  <div className="card-voicecheck">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-[#1E73BE] flex items-center justify-center flex-shrink-0">
                        <Volume2 size={22} color="white" />
                      </div>
                      <h3 className="font-extrabold text-[#1E293B] text-lg">Alza il volume al massimo</h3>
                    </div>
                    <p className="text-[#64748B] text-base mb-4">
                      Usa i tasti laterali del telefono per portare il volume al massimo.
                    </p>
                    <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-[#EBF4FC]">
                      <Volume2 size={32} color="#1E73BE" />
                      <div className="flex gap-1">
                        {[1,2,3,4,5,6,7,8].map(i => (
                          <div
                            key={i}
                            className="w-3 rounded-sm"
                            style={{ height: 8 + i * 3, backgroundColor: i <= 6 ? '#1E73BE' : '#D6E9F8' }}
                          />
                        ))}
                      </div>
                      <span className="font-extrabold text-[#1E73BE] text-lg">MAX</span>
                    </div>
                  </div>

                  <div className="card-voicecheck">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-[#1E73BE] flex items-center justify-center flex-shrink-0">
                        <Play size={22} color="white" />
                      </div>
                      <h3 className="font-extrabold text-[#1E293B] text-lg">Ascolta il tono di prova</h3>
                    </div>
                    <p className="text-[#64748B] text-base mb-5">
                      Premi il pulsante e ascolta il tono (1000 Hz). Poi dimmi se lo hai sentito chiaramente.
                    </p>
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        {statoVolume === 'riproducendo' && (
                          <div className="absolute inset-0 rounded-full bg-[#1E73BE] opacity-20 animate-ping" />
                        )}
                        <button
                          onClick={statoVolume === 'riproducendo' ? stopTono : avviaRiproduzioneVolume}
                          className="w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg"
                          style={{ backgroundColor: statoVolume === 'riproducendo' ? '#155A96' : '#1E73BE' }}
                        >
                          {statoVolume === 'riproducendo'
                            ? <SoundwaveBars active={true} color="white" size="md" />
                            : <Play size={40} color="white" fill="white" />
                          }
                        </button>
                      </div>
                      <p className="text-[#64748B] text-sm text-center">
                        {statoVolume === 'riproducendo' ? 'Tono in riproduzione...' : 'Tocca per ascoltare il tono'}
                      </p>
                    </div>
                  </div>

                  {statoVolume === 'attesa' && (
                    <div className="card-voicecheck">
                      <p className="font-extrabold text-[#1E293B] text-lg text-center mb-4">
                        Hai sentito il tono chiaramente?
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setStatoVolume('sentito')}
                          className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-[#22C55E] bg-[#F0FDF4]"
                        >
                          <Check size={32} color="#22C55E" />
                          <span className="font-extrabold text-[#166534] text-lg">Sì</span>
                        </button>
                        <button
                          onClick={() => setStatoVolume('non-sentito')}
                          className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-[#EF4444] bg-[#FEF2F2]"
                        >
                          <X size={32} color="#EF4444" />
                          <span className="font-extrabold text-[#991B1B] text-lg">No</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {statoVolume === 'sentito' && (
                <div className="card-voicecheck text-center py-8 animate-fade-in-up">
                  <div className="w-20 h-20 rounded-full bg-[#DCFCE7] flex items-center justify-center mx-auto mb-4">
                    <Check size={40} color="#22C55E" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-[#166534] mb-2">Tutto pronto!</h3>
                  <p className="text-[#64748B] text-base mb-6">
                    Sei pronto per iniziare il test dei toni.
                  </p>
                  <div className="space-y-2 text-left mb-6">
                    {[
                      { label: 'Posizione', val: 'Corretta ✓' },
                      { label: 'Ambiente', val: statoAmbiente === 'ok' ? 'Silenzioso ✓' : 'Verificato ✓' },
                      { label: 'Volume', val: 'Massimo ✓' },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between p-3 rounded-xl bg-[#F0FDF4]">
                        <span className="text-[#64748B]">{r.label}</span>
                        <span className="font-bold text-[#166534]">{r.val}</span>
                      </div>
                    ))}
                  </div>
                  <button className="btn-primary" onClick={() => setStep('audiometria')}>
                    <Play size={22} />
                    Inizia il Test dei Toni!
                    <ChevronRight size={22} />
                  </button>
                </div>
              )}

              {statoVolume === 'non-sentito' && (
                <div className="card-voicecheck text-center py-8 animate-fade-in-up">
                  <div className="w-20 h-20 rounded-full bg-[#FEF3C7] flex items-center justify-center mx-auto mb-4">
                    <Volume2 size={40} color="#F59E0B" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-[#92400E] mb-2">Volume troppo basso</h3>
                  <p className="text-[#64748B] text-base mb-6">Segui questi passi per alzare il volume:</p>
                  <div className="space-y-3 text-left mb-6">
                    {[
                      'Premi il tasto + del volume sul lato del telefono',
                      'Vai in Impostazioni → Suono → Volume Media',
                      'Porta il cursore al massimo',
                      'Se usi cuffie Bluetooth, controlla il volume sull\'auricolare',
                    ].map((s, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#FFFBEB]">
                        <span className="w-6 h-6 rounded-full bg-[#F59E0B] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-[#92400E] text-sm">{s}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <button className="btn-primary" onClick={() => setStatoVolume('attesa')}>
                      <RefreshCw size={20} /> Riprova la Calibrazione
                    </button>
                    <button className="btn-secondary text-sm" onClick={() => setStep('audiometria')}>
                      Continua comunque (risultati meno precisi)
                    </button>
                  </div>
                </div>
              )}

              {/* Pulsante Annulla rosso in basso */}
              <button
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ backgroundColor: '#EF4444', color: 'white' }}
                onClick={() => { stopTono(); setStep('home'); }}
              >
                <X size={18} />
                Annulla e torna alla home
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
