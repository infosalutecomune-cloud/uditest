// ══════════════════════════════════════════════════════════
// Test dell'Udito Vocale — Pagina Test
// STT: MediaRecorder → /api/transcribe (Whisper) — funziona su Opera Android
// Audio: 3 token WAV concatenati in sequenza (matrice 3×7 SiIMax)
// ══════════════════════════════════════════════════════════
import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Mic, MicOff, Check, RefreshCw, Square, Loader2, X } from 'lucide-react';
import SoundwaveBars from '@/components/SoundwaveBars';
import { useTest, RisultatoFrase } from '@/contexts/TestContext';
import {
  FraseMatrice,
  generaListaFrasi,
  SNR_CONFIG,
  BABBLE_NOISE_URL,
  calcolaSRT50,
  parolaCorretta,
} from '@/lib/testData';

type FaseTest = 'ascolto' | 'pronto-mic' | 'registrazione' | 'elaborazione' | 'conferma' | 'feedback';

export default function Test() {
  const { setStep, setRisultati, modalitaTest, faseCompleto } = useTest();

  // In modalità completo: fase 1 = rumore, fase 2 = silenzio
  const modalitaEffettiva = modalitaTest === 'completo'
    ? (faseCompleto === 2 ? 'silenzio' : 'rumore')
    : (modalitaTest ?? 'silenzio');

  // ── Lista frasi generata una volta sola ──
  const [frasi] = useState<FraseMatrice[]>(() => generaListaFrasi());
  const [fraseIdx, setFraseIdx] = useState(0);
  const [fase, setFase] = useState<FaseTest>('ascolto');
  const [snrCorrente, setSnrCorrente] = useState(SNR_CONFIG.iniziale);
  const [snrHistory, setSnrHistory] = useState<number[]>([]);
  const [risultatiFrasi, setRisultatiFrasi] = useState<RisultatoFrase[]>([]);
  const [paroleDette, setParoleDette] = useState<string[]>([]);
  const [trascrizione, setTrascrizione] = useState('');
  const [errorePermesso, setErrorePermesso] = useState(false);
  const [erroreNoSpeech, setErroreNoSpeech] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [mostraConfermaAnnulla, setMostraConfermaAnnulla] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const babbleRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // AudioContext PERSISTENTE: creato una sola volta, mai chiuso durante il test.
  // Creare/chiudere un AudioContext per ogni frase esaurisce il limite del browser su mobile.
  const audioCtxRef = useRef<AudioContext | null>(null);
  // Cache dei buffer audio pre-decodificati per tutte le frasi
  const audioBufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());

  const frase: FraseMatrice = frasi[fraseIdx];
  const totale = frasi.length;
  const progresso = (fraseIdx / totale) * 100;

  // ── Ottieni o crea l'AudioContext persistente ──
  const getAudioCtx = useCallback(async (): Promise<AudioContext> => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // ── Pre-fetch e decodifica tutti i buffer audio all'avvio del test ──
  useEffect(() => {
    let cancelled = false;
    const prefetch = async () => {
      try {
        const ctx = await getAudioCtx();
        const allUrls = frasi.flatMap(f => [...f.audioTokens]);
        const unique = Array.from(new Set(allUrls));
        await Promise.all(unique.map(async (url) => {
          if (audioBufferCacheRef.current.has(url)) return;
          try {
            const resp = await fetch(url);
            const arrayBuf = await resp.arrayBuffer();
            if (cancelled) return;
            const decoded = await ctx.decodeAudioData(arrayBuf);
            audioBufferCacheRef.current.set(url, decoded);
          } catch { /* ignora errori singoli */ }
        }));
      } catch { /* ignora */ }
    };
    prefetch();
    return () => { cancelled = true; };
  }, [frasi, getAudioCtx]);

  // ── Pulizia risorse microfono ──
  const pulisciMic = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    analyserRef.current = null;
    setVolumeLevel(0);
  }, []);

  // ── Volume meter via Web Audio API ──
  const avviaVolumeMeter = useCallback((stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setVolumeLevel(Math.min(100, Math.round(avg * 2.5)));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // silenzioso
    }
  }, []);

  // ── Avvia/ferma babble noise ──
  const avviaBabble = useCallback(() => {
    if (babbleRef.current) { babbleRef.current.pause(); babbleRef.current = null; }
    const b = new Audio(BABBLE_NOISE_URL);
    b.loop = true;
    // Volume babble: SNR corrente determina quanto è alto il rumore rispetto alla voce
    // SNR alto (+15) = rumore basso (0.15), SNR basso (-15) = rumore alto (0.95)
    // Mappiamo SNR [-15, +15] su volume babble [0.95, 0.15] — differenza ampia e percettibile
    const snrNorm = Math.max(-15, Math.min(15, snrCorrente));
    const vol = 0.95 - ((snrNorm + 15) / 30) * 0.80;
    b.volume = Math.max(0.15, Math.min(0.95, vol));
    b.play().catch(() => {});
    babbleRef.current = b;
  }, [snrCorrente]);

  const fermaBabble = useCallback(() => {
    if (babbleRef.current) {
      babbleRef.current.pause();
      babbleRef.current = null;
    }
  }, []);

  // ── Riproduzione audio: usa AudioContext PERSISTENTE + buffer cache ──
  const riproduciAudio = useCallback(async () => {
    const fraseCorrente = frasi[fraseIdx];
    if (!fraseCorrente || isPlaying) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsPlaying(true);
    if (modalitaEffettiva === 'rumore') {
      avviaBabble();
    }

    try {
      // Usa l'AudioContext persistente (mai chiuso tra le frasi)
      const ctx = await getAudioCtx();

      // Recupera i buffer dalla cache (pre-decodificati all'avvio) o li decodifica al volo
      const buffers = await Promise.all(
        fraseCorrente.audioTokens.map(async (url) => {
          const cached = audioBufferCacheRef.current.get(url);
          if (cached) return cached;
          const resp = await fetch(url);
          const arrayBuf = await resp.arrayBuffer();
          const decoded = await ctx.decodeAudioData(arrayBuf);
          audioBufferCacheRef.current.set(url, decoded);
          return decoded;
        })
      );

      // Taglia il silenzio finale di ogni buffer (soglia -40 dBFS)
      const trimSilence = (buf: AudioBuffer): AudioBuffer => {
        const ch = buf.getChannelData(0);
        const threshold = 0.01;
        let end = ch.length - 1;
        while (end > 0 && Math.abs(ch[end]) < threshold) end--;
        const keepSamples = Math.min(end + Math.round(buf.sampleRate * 0.08), ch.length);
        const trimmed = ctx.createBuffer(buf.numberOfChannels, keepSamples, buf.sampleRate);
        for (let c = 0; c < buf.numberOfChannels; c++) {
          trimmed.copyToChannel(buf.getChannelData(c).slice(0, keepSamples), c);
        }
        return trimmed;
      };

      // Concatena i buffer con 150ms di pausa naturale tra le parole
      const gapSamples = Math.round(buffers[0].sampleRate * 0.15);
      const trimmed = buffers.map((b, i) => i < buffers.length - 1 ? trimSilence(b) : b);
      const totalLength = trimmed.reduce((s, b) => s + b.length, 0) + gapSamples * (trimmed.length - 1);
      const merged = ctx.createBuffer(1, totalLength, buffers[0].sampleRate);
      let offset = 0;
      trimmed.forEach((b, i) => {
        merged.copyToChannel(b.getChannelData(0), 0, offset);
        offset += b.length;
        if (i < trimmed.length - 1) offset += gapSamples;
      });

      const source = ctx.createBufferSource();
      source.buffer = merged;
      source.connect(ctx.destination);

      // Safety timer: se onended non scatta (bug mobile), forziamo l'avanzamento
      const durataMs = (merged.length / merged.sampleRate) * 1000;
      const safetyTimer = setTimeout(() => {
        fermaBabble();
        setIsPlaying(false);
        setFase('pronto-mic');
      }, durataMs + 3000);

      source.onended = () => {
        clearTimeout(safetyTimer);
        // NON chiudiamo ctx — viene riusato per le frasi successive
        fermaBabble();
        setIsPlaying(false);
        setFase('pronto-mic');
      };
      source.start(0);
    } catch {
      // Fallback: riproduzione sequenziale con HTMLAudioElement
      const tokens = [...fraseCorrente.audioTokens];
      let idx = 0;
      const playNext = () => {
        if (idx >= tokens.length) { fermaBabble(); setIsPlaying(false); setFase('pronto-mic'); return; }
        const audio = new Audio(tokens[idx]);
        audioRef.current = audio;
        audio.play().catch(() => { idx++; playNext(); });
        audio.onended = () => { idx++; playNext(); };
      };
      playNext();
    }
  }, [frasi, fraseIdx, isPlaying, avviaBabble, fermaBabble, modalitaTest, getAudioCtx]);

  // ── Invia audio a Whisper e ottieni trascrizione ──
  const trascriviAudio = useCallback(async (blob: Blob): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      const resp = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      if (!resp.ok) return '';
      const data = await resp.json() as { text?: string };
      return (data.text || '').trim();
    } catch {
      return '';
    }
  }, []);

  // ── Ferma la registrazione e invia a Whisper ──
  // FIX: onstop viene impostato PRIMA di stop() per evitare race condition su Android/mobile
  // dove onstop può scattare immediatamente durante la chiamata a stop()
  const fermaRegistrazione = useCallback(async () => {
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      // Se il recorder non è attivo ma siamo in fase registrazione, forziamo conferma
      setFase('conferma');
      return;
    }

    // Imposta onstop PRIMA di chiamare stop() — evita race condition su mobile
    recorder.onstop = async () => {
      pulisciMic();
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      audioChunksRef.current = [];

      setFase('elaborazione');

      // Timeout di sicurezza: se Whisper non risponde in 20s, vai comunque a conferma
      const timeoutId = setTimeout(() => {
        setParoleDette([]);
        setTrascrizione('');
        setFase('conferma');
      }, 20000);

      try {
        const testo = await trascriviAudio(blob);
        clearTimeout(timeoutId);
        setTrascrizione(testo);
        const parole = testo.trim().toLowerCase().split(/\s+/).filter(p => p.length > 0);
        setParoleDette(parole);
      } catch {
        clearTimeout(timeoutId);
        setParoleDette([]);
        setTrascrizione('');
      } finally {
        setFase('conferma');
      }
    };

    // Richiede un ultimo chunk prima di fermarsi
    recorder.requestData();
    recorder.stop();
  }, [pulisciMic, trascriviAudio]);

  // ── Avvio registrazione con MediaRecorder ──
  const avviaRegistrazione = useCallback(async () => {
    setFase('registrazione');
    setTrascrizione('');
    setErroreNoSpeech(false);
    setErrorePermesso(false);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micStreamRef.current = stream;
      avviaVolumeMeter(stream);

      // Scegli il formato supportato dal browser
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
            ? 'audio/ogg;codecs=opus'
            : '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start(200); // chunk ogni 200ms

      // Timeout automatico 15 secondi
      recordingTimeoutRef.current = setTimeout(() => {
        fermaRegistrazione();
      }, 15000);

    } catch (err) {
      setErrorePermesso(true);
      setParoleDette([]);
      setFase('conferma');
    }
  }, [avviaVolumeMeter, fermaRegistrazione]);

  // ── Riascolta ──
  function riascolta() {
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    mediaRecorderRef.current?.stop();
    pulisciMic();
    setFase('ascolto');
    setParoleDette([]);
    setTrascrizione('');
    setErroreNoSpeech(false);
    audioChunksRef.current = [];
  }

  // ── Valutazione risposta ──
  function valutaRisposta(paroleUtente: string[]) {
    const fraseAtt = frasi[fraseIdx];
    if (!fraseAtt) return { corrette: 0, totale: 0 };
    let corrette = 0;
    fraseAtt.parole.forEach(pc => {
      if (paroleUtente.some(pd => parolaCorretta(pd, pc))) corrette++;
    });
    return { corrette, totale: fraseAtt.parole.length };
  }

  // ── Conferma risposta ──
  function confermaRisposta() {
    const fraseAtt = frasi[fraseIdx];
    if (!fraseAtt) return;
    const { corrette, totale: tot } = valutaRisposta(paroleDette);
    const nuovoRisultato: RisultatoFrase = {
      fraseIndex: fraseIdx,
      snrDb: snrCorrente,
      paroleDette,
      paroleCorrette: [...fraseAtt.parole],
      corrette,
      totale: tot,
    };

    const nuoviRisultati = [...risultatiFrasi, nuovoRisultato];
    setRisultatiFrasi(nuoviRisultati);
    setSnrHistory(prev => [...prev, snrCorrente]);

    const nuovoSnr = corrette === tot
      ? Math.max(SNR_CONFIG.min, snrCorrente - SNR_CONFIG.step)
      : Math.min(SNR_CONFIG.max, snrCorrente + SNR_CONFIG.step);
    setSnrCorrente(nuovoSnr);

    setFase('feedback');
    setTimeout(() => {
      if (fraseIdx + 1 >= totale) {
        const srt50 = calcolaSRT50([...snrHistory, snrCorrente]);
        const percCorrette = Math.round(
          (nuoviRisultati.reduce((s, r) => s + r.corrette, 0) /
            nuoviRisultati.reduce((s, r) => s + r.totale, 0)) * 100
        );
        setRisultati({
          modalita: modalitaEffettiva as 'silenzio' | 'rumore',
          srt50,
          percentualeCorrette: percCorrette,
          risultatiFrasi: nuoviRisultati,
          dataTest: new Date(),
        });
        setStep('risultati');
      } else {
        setFraseIdx(prev => prev + 1);
        setFase('ascolto');
        setParoleDette([]);
        setTrascrizione('');
        setErroreNoSpeech(false);
      }
    }, 1200);
  }

  // ── Cleanup al dismount ──
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (babbleRef.current) { babbleRef.current.pause(); babbleRef.current = null; }
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
      mediaRecorderRef.current?.stop();
      pulisciMic();
    };
  }, [pulisciMic]);

  const { corrette: correttePreview } = valutaRisposta(paroleDette);

  // Barre volume animate
  const barCount = 9;
  const volumeBars = Array.from({ length: barCount }, (_, i) => {
    const center = Math.floor(barCount / 2);
    const dist = Math.abs(i - center);
    const maxH = 60 - dist * 6;
    const active = volumeLevel > (dist * 10);
    return { height: active ? maxH : 8, active };
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">

      {/* ── HEADER ── */}
      <div className="bg-white border-b border-[#D6E9F8] sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3 w-full max-w-[480px] mx-auto px-4 py-3">
          <img
            src="/manus-storage/logo_acustica_dimaio_b5729c4d.png"
            alt="Acustica Di Maio"
            className="h-10 w-auto object-contain flex-shrink-0"
          />
          <div className="flex-1">
            <p className="font-extrabold text-[#1E293B] text-base leading-tight">
              Frase {fraseIdx + 1} di {totale}
            </p>
            <p className="text-[#64748B] text-sm">Test in corso</p>
          </div>
        </div>
        <div className="max-w-[480px] mx-auto px-4 pb-2">
          <div className="w-full bg-[#D6E9F8] rounded-full h-2">
            <div
              className="bg-[#1E73BE] h-2 rounded-full transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container py-6 animate-fade-in-up">

          {/* ── FASE ASCOLTO ── */}
          {fase === 'ascolto' && (
            <div className="space-y-5">
              <div className="card-voicecheck text-center py-10">
                <p className="text-[#64748B] text-lg mb-8 leading-relaxed">
                  Premi il pulsante e ascolta la frase
                </p>
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    {isPlaying && (
                      <div className="absolute inset-0 rounded-full bg-[#1E73BE] opacity-20 animate-ping" />
                    )}
                    <button
                      onClick={riproduciAudio}
                      disabled={isPlaying}
                      className="w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95"
                      style={{ backgroundColor: isPlaying ? '#155A96' : '#1E73BE' }}
                    >
                      {isPlaying
                        ? <SoundwaveBars active={true} color="white" size="lg" />
                        : <Play size={56} color="white" fill="white" />
                      }
                    </button>
                  </div>
                  <p className="text-[#64748B] text-lg font-semibold">
                    {isPlaying ? 'Ascolta con attenzione...' : 'Tocca per ascoltare'}
                  </p>
                </div>
              </div>
              {/* Pulsante Annulla rosso in basso */}
              <button
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ backgroundColor: '#EF4444', color: 'white' }}
                onClick={() => { audioRef.current?.pause(); if (babbleRef.current) { babbleRef.current.pause(); } setMostraConfermaAnnulla(true); }}
              >
                <X size={18} />
                Interrompi il test
              </button>
            </div>
          )}

          {/* ── FASE PRONTO-MIC ── */}
          {fase === 'pronto-mic' && (
            <div className="space-y-5">
              <div className="card-voicecheck text-center py-10">
                <p className="text-[#1E293B] text-2xl font-extrabold mb-3">
                  Hai sentito la frase?
                </p>
                <p className="text-[#64748B] text-lg mb-10 leading-relaxed">
                  Premi il microfono e ripeti le parole che hai sentito
                </p>
                <div className="flex flex-col items-center gap-5">
                  <button
                    onClick={avviaRegistrazione}
                    className="w-36 h-36 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 bg-[#1E73BE] hover:bg-[#155A96]"
                  >
                    <Mic size={64} color="white" />
                  </button>
                  <p className="text-[#1E73BE] text-lg font-bold">Tocca per parlare</p>
                </div>
              </div>
              <button
                onClick={riascolta}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-[#D6E9F8] bg-white text-[#64748B] text-base font-semibold"
              >
                <RefreshCw size={20} />
                Riascolta la frase
              </button>
              {/* Pulsante Annulla rosso in basso */}
              <button
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ backgroundColor: '#EF4444', color: 'white' }}
                onClick={() => { audioRef.current?.pause(); if (babbleRef.current) { babbleRef.current.pause(); } setMostraConfermaAnnulla(true); }}
              >
                <X size={18} />
                Interrompi il test
              </button>
            </div>
          )}

          {/* ── FASE REGISTRAZIONE ── */}
          {fase === 'registrazione' && (
            <div className="space-y-5">
              <div className="card-voicecheck text-center py-8">
                {erroreNoSpeech ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-4">
                      <MicOff size={40} color="#EF4444" />
                    </div>
                    <p className="text-[#1E293B] text-2xl font-extrabold mb-2">Non ho sentito nulla</p>
                    <p className="text-[#64748B] text-lg mb-8">
                      Parla più vicino al microfono e premi di nuovo
                    </p>
                    <button
                      onClick={avviaRegistrazione}
                      className="w-32 h-32 rounded-full flex items-center justify-center shadow-2xl mx-auto bg-[#1E73BE] active:scale-95"
                    >
                      <Mic size={56} color="white" />
                    </button>
                    <p className="text-[#1E73BE] text-lg font-bold mt-4">Riprova</p>
                  </>
                ) : (
                  <>
                    <p className="text-[#1E293B] text-2xl font-extrabold mb-2">Parla ora!</p>
                    <p className="text-[#64748B] text-lg mb-6">
                      Ripeti le parole che hai sentito
                    </p>

                    {/* Volume meter visivo */}
                    <div className="flex items-center justify-center gap-1 h-16 mb-4">
                      {volumeBars.map((bar, i) => (
                        <div
                          key={i}
                          className="w-2 rounded-full transition-all duration-75"
                          style={{
                            height: bar.height,
                            backgroundColor: bar.active ? '#EF4444' : '#D6E9F8',
                          }}
                        />
                      ))}
                    </div>

                    {/* Pulsante FERMA grande e rosso */}
                    <button
                      onClick={fermaRegistrazione}
                      className="w-36 h-36 rounded-full flex flex-col items-center justify-center shadow-2xl mx-auto bg-red-500 hover:bg-red-600 active:scale-95 transition-all gap-2"
                    >
                      <Square size={40} color="white" fill="white" />
                      <span className="text-white font-extrabold text-lg">FERMA</span>
                    </button>
                    <p className="text-[#64748B] text-base mt-4">
                      Premi FERMA quando hai finito di parlare
                    </p>
                  </>
                )}
              </div>

              {errorePermesso && (
                <div className="card-voicecheck bg-[#FEF2F2]">
                  <p className="text-[#991B1B] text-base text-center">
                    Microfono non disponibile. Abilita l'accesso al microfono nelle impostazioni del browser.
                  </p>
                </div>
              )}
              {/* Pulsante Annulla rosso in basso */}
              <button
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ backgroundColor: '#EF4444', color: 'white' }}
                onClick={() => { audioRef.current?.pause(); if (babbleRef.current) { babbleRef.current.pause(); } setMostraConfermaAnnulla(true); }}
              >
                <X size={18} />
                Interrompi il test
              </button>
            </div>
          )}

          {/* ── FASE ELABORAZIONE ── */}
          {fase === 'elaborazione' && (
            <div className="card-voicecheck text-center py-16">
              <Loader2 size={56} className="animate-spin text-[#1E73BE] mx-auto mb-6" />
              <p className="text-[#1E293B] text-2xl font-extrabold mb-2">Elaboro la risposta...</p>
              <p className="text-[#64748B] text-lg">Un momento</p>
            </div>
          )}

          {/* ── FASE CONFERMA ── */}
          {fase === 'conferma' && (
            <div className="space-y-5">
              <div className="card-voicecheck">
                <h3 className="font-extrabold text-[#1E293B] text-2xl mb-6 text-center">
                  Hai detto:
                </h3>

                {errorePermesso && (
                  <div className="bg-[#FEF2F2] rounded-2xl p-4 mb-4 text-center">
                    <p className="text-[#991B1B] text-base font-semibold">
                      Il microfono non è disponibile su questo browser.<br />
                      Abilita il permesso microfono nelle impostazioni.
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-4 mb-8">
                  {paroleDette.length > 0
                    ? paroleDette.map((p, i) => (
                        <div
                          key={i}
                          className="w-full py-5 px-6 rounded-2xl bg-[#EBF4FC] border-2 border-[#1E73BE] text-center"
                        >
                          <span className="text-[#1E73BE] font-extrabold text-4xl tracking-wide">
                            {p}
                          </span>
                        </div>
                      ))
                    : (
                      <div className="w-full py-5 px-6 rounded-2xl bg-[#FEF2F2] border-2 border-[#EF4444] text-center">
                        <span className="text-[#EF4444] font-bold text-2xl">
                          Nessuna parola riconosciuta
                        </span>
                      </div>
                    )
                  }
                </div>

                <p className="text-[#64748B] text-xl text-center mb-6 font-semibold">
                  È corretto?
                </p>

                {/* Conferma: tasto grande verde */}
                <button
                  onClick={confermaRisposta}
                  className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl border-2 border-[#22C55E] bg-[#F0FDF4] transition-all active:scale-95 mb-3"
                >
                  <Check size={32} color="#22C55E" />
                  <span className="font-extrabold text-[#166534] text-xl">Sì, corretto</span>
                </button>

                {/* Due azioni secondarie affiancate */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={riascolta}
                    className="flex flex-col items-center gap-2 py-4 rounded-2xl border-2 border-[#1E73BE] bg-[#EBF4FC] transition-all active:scale-95"
                  >
                    <Play size={28} color="#1E73BE" fill="#1E73BE" />
                    <span className="font-bold text-[#1E73BE] text-base">Riascolta</span>
                  </button>
                  <button
                    onClick={() => {
                      setParoleDette([]);
                      setTrascrizione('');
                      setErroreNoSpeech(false);
                      setFase('pronto-mic');
                    }}
                    className="flex flex-col items-center gap-2 py-4 rounded-2xl border-2 border-[#F59E0B] bg-[#FFFBEB] transition-all active:scale-95"
                  >
                    <Mic size={28} color="#B45309" />
                    <span className="font-bold text-[#B45309] text-base">Ripeti</span>
                  </button>
                </div>
              </div>
              {/* Pulsante Annulla rosso in basso */}
              <button
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ backgroundColor: '#EF4444', color: 'white' }}
                onClick={() => { audioRef.current?.pause(); if (babbleRef.current) { babbleRef.current.pause(); } setMostraConfermaAnnulla(true); }}
              >
                <X size={18} />
                Interrompi il test
              </button>
            </div>
          )}

          {/* ── FASE FEEDBACK ── */}
          {fase === 'feedback' && (
            <div className="card-voicecheck text-center py-12 animate-fade-in-up">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5 ${
                correttePreview === frase.parole.length ? 'bg-[#DCFCE7]' : 'bg-[#FEF2F2]'
              }`}>
                {correttePreview === frase.parole.length
                  ? <Check size={48} color="#22C55E" />
                  : <RefreshCw size={48} color="#F97316" />
                }
              </div>
              <p className="font-extrabold text-2xl text-[#1E293B]">
                {correttePreview === frase.parole.length ? 'Ottimo!' : 'Prossima frase...'}
              </p>
              <p className="text-[#64748B] text-lg mt-2">
                {correttePreview}/{frase.parole.length} parole corrette
              </p>
            </div>
          )}

        </div>
      </div>

      {/* ══ DIALOG CONFERMA ANNULLA ══ */}
      {mostraConfermaAnnulla && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <X size={32} color="#EF4444" />
              </div>
              <h3 className="font-extrabold text-[#1E293B] text-xl mb-2">Interrompere il test?</h3>
              <p className="text-[#64748B] text-sm leading-relaxed">
                Il progresso del test vocale andrà perso. Sei sicuro di voler uscire?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-2xl font-bold text-base border-2 border-[#D6E9F8] text-[#64748B] bg-white transition-all active:scale-95"
                onClick={() => setMostraConfermaAnnulla(false)}
              >
                Continua
              </button>
              <button
                className="flex-1 py-3 rounded-2xl font-bold text-base text-white transition-all active:scale-95"
                style={{ backgroundColor: '#EF4444' }}
                onClick={() => {
                  mediaRecorderRef.current?.stop();
                  pulisciMic();
                  audioRef.current?.pause();
                  if (babbleRef.current) babbleRef.current.pause();
                  setMostraConfermaAnnulla(false);
                  setStep('home');
                }}
              >
                Sì, esci
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
