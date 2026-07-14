// ══════════════════════════════════════════════════════════
// UdiTest — Audiometria Tonale Screening
// Procedura: Hughson-Westlake adattiva semplificata
// - Parte a livello medio (volume 0.3 ≈ 40 dB HL indicativo)
// - Scende di 10 dB quando sente (×0.316)
// - Sale di 5 dB quando non sente (×1.778)
// - Soglia = livello a cui risponde 2 volte su 3 ascendenti
// Frequenze: 1000, 2000, 4000, 500, 750, 1500, 3000 Hz (ordine standard audiometrico esteso)
// ══════════════════════════════════════════════════════════
import { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, ChevronRight, Loader2, FileDown, Ear, X } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { generaPDFTonale } from '@/lib/generaPDF';
import { useAnagrafica } from '@/hooks/useAnagrafica';
import ModalSbloccaReferto, { DatiLead } from '@/components/ModalSbloccaReferto';
import { useStorico } from '@/hooks/useStorico';

// Frequenze nell'ordine standard audiometrico (esteso con 750, 1500, 3000 Hz)
const FREQUENZE = [1000, 2000, 4000, 500, 750, 1500, 3000] as const;
type Frequenza = typeof FREQUENZE[number];

// Parametri Hughson-Westlake
const VOLUME_INIZIALE = 0.35;   // ~45 dB HL indicativo
const STEP_GIU = 0.316;         // -10 dB (×0.316)
const STEP_SU  = 1.778;         // +5 dB (×1.778)
const VOLUME_MIN = 0.02;        // ~10 dB HL indicativo
const VOLUME_MAX = 0.95;        // ~70 dB HL indicativo
const DURATA_TONO_MS = 1500;    // 1.5 secondi per tono
const MAX_TONI_PER_FREQ = 15;   // limite massimo toni per frequenza
const VOLUME_MIN_FLOOR = 0.025; // soglia sotto la quale consideriamo il volume al pavimento

// Converte volume lineare in dB HL approssimativo (calibrazione indicativa)
// Basato su: volume 0.35 ≈ 45 dB HL su smartphone medio
function volumeToDbHL(v: number): number {
  // dB HL = 20 * log10(v / 0.35) + 45
  return Math.round(20 * Math.log10(v / 0.35) + 45);
}

interface RisultatoFrequenza {
  hz: Frequenza;
  soglia: number;      // volume lineare alla soglia
  sogliaDbHL: number;  // dB HL indicativo
  udito: 'normale' | 'lieve' | 'moderato' | 'severo';
}

type Fase = 'intro' | 'attesa-risposta' | 'feedback' | 'risultati';

interface Props {
  onBack: () => void;
}

// Interpreta la soglia in dB HL
function interpretaSoglia(dbHL: number): RisultatoFrequenza['udito'] {
  if (dbHL <= 25) return 'normale';
  if (dbHL <= 40) return 'lieve';
  if (dbHL <= 60) return 'moderato';
  return 'severo';
}

const COLORI: Record<RisultatoFrequenza['udito'], string> = {
  normale:  '#22C55E',
  lieve:    '#F59E0B',
  moderato: '#F97316',
  severo:   '#EF4444',
};

const ETICHETTE: Record<RisultatoFrequenza['udito'], string> = {
  normale:  'Nella norma',
  lieve:    'Lieve difficoltà',
  moderato: 'Difficoltà moderata',
  severo:   'Difficoltà severa',
};

export default function AudiometriaTonale({ onBack }: Props) {
  const { dati: datiAnagrafica } = useAnagrafica();
  const { aggiungiVoce } = useStorico();
  const [fase, setFase] = useState<Fase>('intro');
  const [freqIdx, setFreqIdx] = useState(0);
  const [risultati, setRisultati] = useState<RisultatoFrequenza[]>([]);
  const [mostraConfermaAnnulla, setMostraConfermaAnnulla] = useState(false);
  const [mostraModalPDF, setMostraModalPDF] = useState(false);

  // Stato Hughson-Westlake per la frequenza corrente
  // FIX: usiamo ref per i contatori critici per evitare closure stale nei setTimeout
  const [volumeCorrente, setVolumeCorrente] = useState(VOLUME_INIZIALE);
  const volumeRef = useRef(VOLUME_INIZIALE);
  const risposteAscRef = useRef(0);
  const tentativiAscRef = useRef(0);
  const direzioneRef = useRef<'su' | 'giu'>('giu');
  const toniPresentatiRef = useRef(0);
  // Manteniamo anche gli state per la UI (ma la logica usa i ref)
  const [risposteAscendenti, setRisposteAscendenti] = useState(0);
  const [tentativiAscendenti, setTentativiAscendenti] = useState(0);
  const [direzione, setDirezione] = useState<'su' | 'giu'>('giu');
  const [toniPresentati, setToniPresentati] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [attesaRisposta, setAttesaRisposta] = useState(false);
  const attesaRispostaRef = useRef(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref sempre aggiornato a avviaFrequenza per evitare closure stale
  const avviaFrequenzaRef = useRef<(vol: number, freq: Frequenza) => void>(() => {});

  const freqCorrente: Frequenza = FREQUENZE[freqIdx];

  const stopTono = useCallback(() => {
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    if (oscillatorRef.current) {
      try { oscillatorRef.current.stop(); } catch { /* già fermato */ }
      oscillatorRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => { stopTono(); };
  }, [stopTono]);

  // ── Genera tono puro con Web Audio API a volume specificato ──
  const riproduciTono = useCallback((volume: number, freq: Frequenza) => {
    stopTono();
    setIsPlaying(true);
    setAttesaRisposta(false);

    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

      // Fade in/out per evitare click
      const dur = DURATA_TONO_MS / 1000;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(volume, ctx.currentTime + dur - 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      gainRef.current = gain;
      oscillatorRef.current = oscillator;

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + dur);

      playTimeoutRef.current = setTimeout(() => {
        setIsPlaying(false);
        attesaRispostaRef.current = true;
        setAttesaRisposta(true);
      }, DURATA_TONO_MS + 100);

    } catch {
      setIsPlaying(false);
      attesaRispostaRef.current = true;
      setAttesaRisposta(true);
    }
  }, [stopTono]);

  // ── Avanza alla frequenza successiva o ai risultati ──
  // Usa avviaFrequenzaRef per evitare closure stale con freqIdx
  const avanzaFrequenza = useCallback((
    nuoviRisultati: RisultatoFrequenza[],
    nextFreqIdx: number,
  ) => {
    setTimeout(() => {
      if (nextFreqIdx >= FREQUENZE.length) {
        setFase('risultati');
      } else {
        const nextFreq = FREQUENZE[nextFreqIdx];
        setFreqIdx(nextFreqIdx);
        avviaFrequenzaRef.current(VOLUME_INIZIALE, nextFreq);
      }
    }, 600);
  }, []);

  // ── Avvia il test per la frequenza corrente ──
  const avviaFrequenza = useCallback((vol: number, freq: Frequenza) => {
    // Reset sia state (UI) che ref (logica)
    volumeRef.current = vol;
    risposteAscRef.current = 0;
    tentativiAscRef.current = 0;
    direzioneRef.current = 'giu';
    toniPresentatiRef.current = 0;
    setVolumeCorrente(vol);
    setRisposteAscendenti(0);
    setTentativiAscendenti(0);
    setDirezione('giu');
    setToniPresentati(0);
    setFase('attesa-risposta');
    // Piccolo delay prima del primo tono
    setTimeout(() => riproduciTono(vol, freq), 800);
  }, [riproduciTono]);

  // Aggiorna il ref ogni volta che avviaFrequenza cambia
  useEffect(() => {
    avviaFrequenzaRef.current = avviaFrequenza;
  }, [avviaFrequenza]);

  // ── Salta la frequenza corrente (pulsante di emergenza) ──
  const saltaFrequenza = useCallback(() => {
    stopTono();
    setAttesaRisposta(false);
    setFase('feedback');

    // Registra la frequenza come "non determinata" al volume corrente
    const sogliaVolume = volumeCorrente;
    const dbHL = volumeToDbHL(sogliaVolume);
    const nuovoRisultato: RisultatoFrequenza = {
      hz: freqCorrente,
      soglia: sogliaVolume,
      sogliaDbHL: dbHL,
      udito: interpretaSoglia(dbHL),
    };
    const nuoviRisultati = [...risultati, nuovoRisultato];
    setRisultati(nuoviRisultati);

    const nextFreqIdx = freqIdx + 1;
      avanzaFrequenza(nuoviRisultati, nextFreqIdx);
  }, [stopTono, volumeCorrente, freqCorrente, risultati, freqIdx, avanzaFrequenza]);

  // ── Gestione risposta utente ──
  // FIX: usa ref per i contatori per evitare closure stale nei setTimeout annidati
  const gestisciRisposta = useCallback((haSentito: boolean) => {
    if (!attesaRispostaRef.current) return;
    attesaRispostaRef.current = false;
    setAttesaRisposta(false);
    setFase('feedback');

    // Leggi dai ref (valori sempre aggiornati)
    const volCorr = volumeRef.current;
    const dir = direzioneRef.current;
    const risAsc = risposteAscRef.current;
    const tentAsc = tentativiAscRef.current;
    const toniTot = toniPresentatiRef.current + 1;
    toniPresentatiRef.current = toniTot;
    setToniPresentati(toniTot);

    let nuovoVolume = volCorr;
    let nuovaDirezione = dir;
    let nuoveRisposteAsc = risAsc;
    let nuoviTentAsc = tentAsc;

    if (haSentito) {
      // Scende di 10 dB
      nuovoVolume = Math.max(VOLUME_MIN, volCorr * STEP_GIU);
      nuovaDirezione = 'giu';
      // Conta la risposta positiva SEMPRE (non solo se stavamo salendo)
      // Questo permette di accettare il secondo SÌ alla stessa intensità
      // anche se la direzione era già 'giu' per via del primo SÌ
      nuoveRisposteAsc = risAsc + 1;
      nuoviTentAsc = tentAsc + 1;
    } else {
      // Sale di 5 dB
      nuovoVolume = Math.min(VOLUME_MAX, volCorr * STEP_SU);
      if (dir === 'su') {
        nuoviTentAsc = tentAsc + 1;
      } else {
        // Inversione: da discendente a ascendente — reset contatori
        nuovaDirezione = 'su';
        nuoviTentAsc = 1;
        nuoveRisposteAsc = 0;
      }
    }

    // Aggiorna i ref immediatamente (prima dei setTimeout)
    volumeRef.current = nuovoVolume;
    direzioneRef.current = nuovaDirezione;
    risposteAscRef.current = nuoveRisposteAsc;
    tentativiAscRef.current = nuoviTentAsc;

    // ── Condizioni di terminazione per questa frequenza ──
    // 1. Soglia classica: 2 risposte positive consecutive (anche alla stessa intensità)
    // 2. Volume al pavimento E ha sentito (non può scendere oltre)
    // 3. Limite massimo toni raggiunto
    // 4. Volume al massimo (non sente nemmeno al massimo)
    const alPavimento = haSentito && nuovoVolume <= VOLUME_MIN_FLOOR;
    const sogliaTrovata =
      (haSentito && nuoveRisposteAsc >= 2) ||
      alPavimento ||
      toniTot >= MAX_TONI_PER_FREQ ||
      nuovoVolume >= VOLUME_MAX;

    if (sogliaTrovata) {
      const sogliaVolume = haSentito ? volCorr : nuovoVolume;
      const dbHL = volumeToDbHL(sogliaVolume);
      const nuovoRisultato: RisultatoFrequenza = {
        hz: freqCorrente,
        soglia: sogliaVolume,
        sogliaDbHL: dbHL,
        udito: interpretaSoglia(dbHL),
      };

      setRisultati(prev => {
        const nuoviRisultati = [...prev, nuovoRisultato];
        const nextFreqIdx = freqIdx + 1;
        avanzaFrequenza(nuoviRisultati, nextFreqIdx);
        return nuoviRisultati;
      });
    } else {
      // Aggiorna state (UI) e presenta il prossimo tono
      setVolumeCorrente(nuovoVolume);
      setDirezione(nuovaDirezione);
      setRisposteAscendenti(nuoveRisposteAsc);
      setTentativiAscendenti(nuoviTentAsc);

      setTimeout(() => {
        setFase('attesa-risposta');
        attesaRispostaRef.current = true;
        setTimeout(() => riproduciTono(nuovoVolume, freqCorrente), 600);
      }, 500);
    }
  }, [
    freqCorrente, freqIdx,
    avanzaFrequenza, riproduciTono,
  ]);

  // ── Risultato globale ──
  const risultatoGlobale = (): RisultatoFrequenza['udito'] => {
    if (risultati.length === 0) return 'normale';
    const peggiore = risultati.reduce((p, c) => {
      const ord = ['normale', 'lieve', 'moderato', 'severo'];
      return ord.indexOf(c.udito) > ord.indexOf(p.udito) ? c : p;
    });
    return peggiore.udito;
  };

  // Salva nello storico quando il test è completato
  useEffect(() => {
    if (fase !== 'risultati' || risultati.length === 0) return;
    const globale = risultatoGlobale();
    const etichetta = globale === 'normale' ? 'Udito nella norma'
      : globale === 'lieve' ? 'Lieve difficoltà uditiva'
      : globale === 'moderato' ? 'Difficoltà moderata'
      : 'Difficoltà severa';
    const colore = globale === 'normale' ? 'verde' : globale === 'lieve' ? 'giallo' : 'rosso';
    const dettaglio = risultati
      .map(r => `${r.hz}Hz: ${r.sogliaDbHL}dB`)
      .join(', ');
    aggiungiVoce({
      tipo: 'tonale',
      data: Date.now(),
      risultato: etichetta,
      colore,
      dettaglio,
      datiPDFTonale: {
        risultati: risultati.map(r => ({
          hz: r.hz,
          sentito: r.sogliaDbHL <= 25,
          sogliaDbHL: r.sogliaDbHL,
          udito: r.udito,
        })),
        interpretazioneGlobale: etichetta,
        coloreGlobale: colore,
        dataTest: new Date(),
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  const progresso = fase === 'risultati' ? 100 : Math.round((freqIdx / FREQUENZE.length) * 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <AppHeader
        onBack={onBack}
        title="Test dei Toni"
        subtitle={fase === 'risultati' ? 'Completato' : `Frequenza ${freqIdx + 1} di ${FREQUENZE.length}`}
      />

      {/* Barra progresso */}
      <div className="h-1.5 bg-[#D6E9F8]">
        <div
          className="h-full bg-[#1E73BE] transition-all duration-500"
          style={{ width: `${progresso}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container py-6 space-y-5 max-w-[480px] mx-auto animate-fade-in-up">

          {/* ══ INTRO ══ */}
          {fase === 'intro' && (
            <>
              <div className="card-voicecheck">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#1E73BE] flex items-center justify-center flex-shrink-0">
                    <Ear size={26} color="white" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-[#1E293B] text-xl">Test dei Toni</h2>
                    <p className="text-[#64748B] text-sm">Screening uditivo adattivo</p>
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#EBF4FC]">
                    <span className="text-[#1E73BE] font-extrabold text-lg mt-0.5">1</span>
                    <p className="text-[#1E293B] text-sm leading-relaxed">
                      Sentirai dei <strong>toni puri</strong> a 7 frequenze diverse (500, 750, 1000, 1500, 2000, 3000, 4000 Hz).
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#EBF4FC]">
                    <span className="text-[#1E73BE] font-extrabold text-lg mt-0.5">2</span>
                    <p className="text-[#1E293B] text-sm leading-relaxed">
                      Premi <strong>"Sì, ho sentito"</strong> appena percepisci il suono, anche se è debolissimo.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#EBF4FC]">
                    <span className="text-[#1E73BE] font-extrabold text-lg mt-0.5">3</span>
                    <p className="text-[#1E293B] text-sm leading-relaxed">
                      Lo <strong>stesso tono può ripresentarsi più volte</strong>: il sistema lo ripropone per confermare la tua soglia. È normale, non preoccuparti.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#EBF4FC]">
                    <span className="text-[#1E73BE] font-extrabold text-lg mt-0.5">4</span>
                    <p className="text-[#1E293B] text-sm leading-relaxed">
                      Il volume si adatta automaticamente per trovare la tua soglia uditiva.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
                  <p className="text-[#92400E] text-xs leading-relaxed">
                    <strong>Consiglio:</strong> usa le cuffie e siediti in un posto silenzioso.
                    Il volume del telefono deve essere al massimo.
                  </p>
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={() => avviaFrequenza(VOLUME_INIZIALE, FREQUENZE[0])}
              >
                Inizia il test
                <ChevronRight size={22} />
              </button>

              {/* Pulsante Annulla rosso in basso */}
              <button
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ backgroundColor: '#EF4444', color: 'white' }}
                onClick={onBack}
              >
                <X size={18} />
                Annulla e torna alla home
              </button>
            </>
          )}

          {/* ══ TEST IN CORSO ══ */}
          {(fase === 'attesa-risposta' || fase === 'feedback') && (
            <>
              <div className="card-voicecheck text-center">
                {/* Frequenza corrente */}
                <div className="mb-4">
                  <p className="text-[#64748B] text-sm mb-1">Frequenza in corso</p>
                  <p className="font-extrabold text-[#1E73BE] text-3xl">{freqCorrente} Hz</p>
                  <p className="text-[#94A3B8] text-xs mt-1">
                    {freqCorrente === 500 ? 'Voce bassa' :
                     freqCorrente === 1000 ? 'Voce media' :
                     freqCorrente === 2000 ? 'Consonanti' : 'Fischi / sibili'}
                  </p>
                </div>

                {/* Indicatore volume */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Volume2 size={16} className="text-[#94A3B8]" />
                  <div className="flex gap-1">
                    {[...Array(10)].map((_, i) => {
                      const soglia = i / 10;
                      const attivo = volumeCorrente > soglia;
                      return (
                        <div
                          key={i}
                          className="w-2 rounded-sm transition-all"
                          style={{
                            height: `${8 + i * 2}px`,
                            backgroundColor: attivo
                              ? (volumeCorrente > 0.6 ? '#EF4444' : volumeCorrente > 0.3 ? '#F59E0B' : '#22C55E')
                              : '#E2E8F0',
                          }}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[#94A3B8] text-xs">
                    ~{volumeToDbHL(volumeCorrente)} dB HL
                  </span>
                </div>

                {/* Animazione tono */}
                <div className="flex justify-center mb-6">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300"
                    style={{
                      backgroundColor: isPlaying ? '#EBF4FC' : '#F8FAFC',
                      border: `3px solid ${isPlaying ? '#1E73BE' : '#D6E9F8'}`,
                      boxShadow: isPlaying ? '0 0 0 8px rgba(30,115,190,0.15), 0 0 0 16px rgba(30,115,190,0.07)' : 'none',
                    }}
                  >
                    {isPlaying ? (
                      <Volume2 size={36} color="#1E73BE" className="animate-pulse" />
                    ) : attesaRisposta ? (
                      <span className="text-3xl">🎧</span>
                    ) : (
                      <Loader2 size={32} color="#94A3B8" className="animate-spin" />
                    )}
                  </div>
                </div>

                {isPlaying && (
                  <p className="text-[#1E73BE] font-bold text-base animate-pulse">
                    Ascolta attentamente...
                  </p>
                )}
                {attesaRisposta && (
                  <p className="text-[#1E293B] font-bold text-base">
                    Hai sentito il tono?
                  </p>
                )}
                {fase === 'feedback' && !attesaRisposta && !isPlaying && (
                  <p className="text-[#64748B] text-sm">Preparazione prossimo tono...</p>
                )}
              </div>

              {/* Bottoni risposta */}
              {attesaRisposta && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    className="py-5 rounded-2xl font-extrabold text-lg flex flex-col items-center gap-2 transition-all active:scale-95"
                    style={{ backgroundColor: '#DCFCE7', color: '#15803D', border: '2px solid #86EFAC' }}
                    onClick={() => gestisciRisposta(true)}
                  >
                    <span className="text-3xl">✓</span>
                    Sì, ho sentito
                  </button>
                  <button
                    className="py-5 rounded-2xl font-extrabold text-lg flex flex-col items-center gap-2 transition-all active:scale-95"
                    style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', border: '2px solid #FECACA' }}
                    onClick={() => gestisciRisposta(false)}
                  >
                    <span className="text-3xl">✗</span>
                    Non ho sentito
                  </button>
                </div>
              )}

              {/* Pulsanti di controllo: salta frequenza */}
              <button
                className="w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ backgroundColor: '#FFF7ED', color: '#C2410C', border: '1.5px solid #FED7AA' }}
                onClick={saltaFrequenza}
              >
                <ChevronRight size={16} />
                Salta questa frequenza
              </button>

              {/* Pulsante Interrompi rosso in basso al centro */}
              <button
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ backgroundColor: '#EF4444', color: 'white' }}
                onClick={() => setMostraConfermaAnnulla(true)}
              >
                <X size={18} />
                Interrompi il test
              </button>
            </>
          )}

          {/* ══ RISULTATI ══ */}
          {fase === 'risultati' && (
            <>
              {/* Semaforo globale */}
              <div className="card-voicecheck text-center">
                <h3 className="font-extrabold text-[#1E293B] text-xl mb-4">Risultato Screening</h3>

                {/* Semaforo orizzontale */}
                <div className="flex justify-center gap-4 mb-4">
                  {(['normale', 'lieve', 'moderato', 'severo'] as const).map((livello) => {
                    const globale = risultatoGlobale();
                    const attivo = globale === livello;
                    return (
                      <div key={livello} className="flex flex-col items-center gap-1">
                        <div
                          className="w-12 h-12 rounded-full transition-all duration-500"
                          style={{
                            backgroundColor: attivo ? COLORI[livello] : '#E2E8F0',
                            boxShadow: attivo ? `0 0 0 4px ${COLORI[livello]}40` : 'none',
                            transform: attivo ? 'scale(1.15)' : 'scale(1)',
                          }}
                        />
                        <span className="text-[#64748B] text-xs text-center leading-tight" style={{ maxWidth: 52 }}>
                          {livello === 'normale' ? 'Normale' :
                           livello === 'lieve' ? 'Lieve' :
                           livello === 'moderato' ? 'Moderato' : 'Severo'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="font-extrabold text-xl mb-1" style={{ color: COLORI[risultatoGlobale()] }}>
                  {ETICHETTE[risultatoGlobale()]}
                </p>
              </div>

              {/* Dettaglio per frequenza */}
              <div className="card-voicecheck">
                <h4 className="font-extrabold text-[#1E293B] text-base mb-3">Dettaglio per frequenza</h4>
                <div className="space-y-3">
                  {risultati.map((r) => (
                    <div key={r.hz} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC]">
                      <div>
                        <p className="font-bold text-[#1E293B] text-sm">{r.hz} Hz</p>
                        <p className="text-[#64748B] text-xs">
                          {r.hz === 500  ? 'Suoni gravi' :
                           r.hz === 750  ? 'Voce grave' :
                           r.hz === 1000 ? 'Voce parlata' :
                           r.hz === 1500 ? 'Transizione vocali-consonanti' :
                           r.hz === 2000 ? 'Consonanti' :
                           r.hz === 3000 ? 'Consonanti acute' : 'Sibili / fischi'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-sm" style={{ color: COLORI[r.udito] }}>
                          {ETICHETTE[r.udito]}
                        </p>
                        <p className="text-[#94A3B8] text-xs">~{r.sogliaDbHL} dB HL*</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[#94A3B8] text-xs mt-3 leading-relaxed">
                  * I valori in dB HL sono indicativi e dipendono dal dispositivo e dalle cuffie utilizzate.
                  Non sostituiscono un esame audiometrico clinico.
                </p>
              </div>

              {/* ── Card di Conversione: Prenota + WhatsApp ── */}
              <div
                className="rounded-2xl overflow-hidden shadow-md"
                style={{ background: 'linear-gradient(135deg, #1E73BE 0%, #0F4C81 100%)' }}
              >
                <div className="px-5 pt-4 pb-3">
                  <p className="font-extrabold text-white text-base leading-tight">Valutazione professionale</p>
                  <p className="text-blue-200 text-sm mt-0.5">Con strumentazione audiometrica calibrata</p>
                </div>
                <div className="px-4 pb-4">
                  <a
                    href="https://www.acusticadimaio.it/contatta-e-prenota/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-[#0F4C81] text-base bg-white transition-all active:scale-95"
                  >
                    Prenota Ora
                    <ChevronRight size={18} />
                  </a>
                </div>
                <a
                  href={`https://wa.me/393341990307?text=${encodeURIComponent('Ciao, ho appena fatto il test audiometrico tonale su UdiTest di Acustica Di Maio. Vorrei prenotare una visita o ricevere informazioni.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-white/10 px-5 py-2.5 transition-all active:opacity-80"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  <span className="text-white/80 text-sm">Hai domande? <span className="font-semibold text-white">+39 334 199 0307</span></span>
                </a>
              </div>

              {/* ── Sezione Documenti: Scarica + Condividi affiancati ── */}
              <div className="grid grid-cols-2 gap-3">
                {/* Primario: Scarica Risultati */}
                <button
                  className="py-4 rounded-2xl font-extrabold text-base flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                  style={{ backgroundColor: '#1E73BE', color: 'white' }}
                  onClick={() => setMostraModalPDF(true)}
                >
                  <FileDown size={22} />
                   <span className="text-sm leading-tight text-center">Sblocca il referto</span>
                </button>

                {/* Secondario: Condividi Referto */}
                <button
                  className="py-4 rounded-2xl font-extrabold text-base flex flex-col items-center justify-center gap-2 transition-all active:scale-95 bg-white"
                  style={{ color: '#25D366', border: '2px solid #25D366' }}
                  onClick={() => {
                    const dataStr = new Date().toLocaleDateString('it-IT');
                    const nomeP = datiAnagrafica.nome || datiAnagrafica.cognome
                      ? `${datiAnagrafica.nome} ${datiAnagrafica.cognome}`.trim() : '';
                    const peggiore = risultati.reduce((acc, r) => {
                      const ord = ['normale','lieve','moderato','severo'];
                      return ord.indexOf(r.udito ?? 'normale') > ord.indexOf(acc) ? (r.udito ?? 'normale') : acc;
                    }, 'normale');
                    const etichetta = peggiore === 'normale' ? 'Udito nella norma'
                      : peggiore === 'lieve' ? 'Lieve difficoltà uditiva' : 'Difficoltà uditiva significativa';
                    let testo = `Ho fatto il test audiometrico tonale su UdiTest di Acustica Di Maio.`;
                    if (nomeP) testo += `\n${nomeP}`;
                    testo += `\n\nRisultato (${dataStr}): ${etichetta}\n\nPer una valutazione professionale: https://www.acusticadimaio.it/contatta-e-prenota/`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(testo)}`, '_blank');
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  <span className="text-sm leading-tight text-center">Condividi Referto</span>
                </button>
              </div>

              {/* ── Torna alla home: link testuale ── */}
              <button
                className="w-full py-3 text-center text-sm font-medium text-[#64748B] hover:text-[#1E293B] transition-colors"
                onClick={onBack}
              >
                ← Torna alla home
              </button>
            </>
          )}

        </div>
      </div>

      {/* ══ MODAL SBLOCCA REFERTO ══ */}
      {mostraModalPDF && (
        <ModalSbloccaReferto
          tipoTest="tonale"
          risultatoSintetico={risultati.length > 0
            ? (risultatoGlobale() === 'normale' ? 'Udito nella norma'
              : risultatoGlobale() === 'lieve' ? 'Lieve difficoltà uditiva'
              : risultatoGlobale() === 'moderato' ? 'Difficoltà moderata'
              : 'Difficoltà severa')
            : 'Tonale'
          }
          datiPrecompilati={{
            nome: datiAnagrafica.nome,
            cognome: datiAnagrafica.cognome,
            cellulare: datiAnagrafica.cellulare,
          }}
          onAnnulla={() => setMostraModalPDF(false)}
          onConferma={(datiLead: DatiLead) => {
            setMostraModalPDF(false);
            generaPDFTonale({
              risultati: risultati.map(r => ({
                hz: r.hz,
                sentito: r.udito !== 'severo',
                sogliaDbHL: r.sogliaDbHL,
                udito: r.udito,
              })),
              dataTest: new Date(),
              paziente: {
                nome: datiLead.nome,
                cognome: datiLead.cognome,
                dataNascita: datiAnagrafica.dataNascita,
                comune: datiAnagrafica.comune,
                cellulare: datiLead.cellulare,
              },
            });
          }}
        />
      )}

      {/* ══ DIALOG CONFERMA ANNULLA ══ */}
      {mostraConfermaAnnulla && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-extrabold text-[#1E293B] text-lg mb-2">Vuoi uscire dal test?</h3>
            <p className="text-[#64748B] text-sm mb-6 leading-relaxed">
              Il test verrà interrotto e i risultati parziali andranno persi. Potrai ricominciare dalla home.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                className="py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
                style={{ backgroundColor: '#F1F5F9', color: '#64748B', border: '1.5px solid #E2E8F0' }}
                onClick={() => setMostraConfermaAnnulla(false)}
              >
                Continua test
              </button>
              <button
                className="py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
                style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', border: '1.5px solid #FECACA' }}
                onClick={() => { stopTono(); onBack(); }}
              >
                Esci dal test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
