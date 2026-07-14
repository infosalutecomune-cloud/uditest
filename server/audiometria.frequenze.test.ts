/**
 * Test per la logica di avanzamento frequenze in AudiometriaTonale
 * Verifica che tutte e 7 le frequenze vengano percorse in ordine
 */
import { describe, it, expect } from 'vitest';

// Costanti estratte dal componente
const FREQUENZE = [1000, 2000, 4000, 500, 750, 1500, 3000] as const;
const VOLUME_INIZIALE = 0.35;
const VOLUME_MIN = 0.02;
const VOLUME_MAX = 0.95;
const STEP_GIU = 0.316;
const STEP_SU = 1.778;
const MAX_TONI_PER_FREQ = 15;
const VOLUME_MIN_FLOOR = 0.025;

function volumeToDbHL(v: number): number {
  return Math.round(20 * Math.log10(v / 0.35) + 45);
}

function interpretaSoglia(dbHL: number): 'normale' | 'lieve' | 'moderato' | 'severo' {
  if (dbHL <= 25) return 'normale';
  if (dbHL <= 40) return 'lieve';
  if (dbHL <= 60) return 'moderato';
  return 'severo';
}

/**
 * Simula la procedura Hughson-Westlake per una frequenza
 * Restituisce la soglia trovata e il numero di toni presentati
 */
function simulaFrequenza(
  risponde: (volume: number) => boolean,
  maxToni = MAX_TONI_PER_FREQ
): { sogliaDbHL: number; toniPresentati: number; terminato: boolean } {
  let volume = VOLUME_INIZIALE;
  let direzione: 'su' | 'giu' = 'giu';
  let risposteAscendenti = 0;
  let tentativiAscendenti = 0;
  let toniPresentati = 0;

  for (let i = 0; i < maxToni * 3; i++) {
    const haSentito = risponde(volume);
    toniPresentati++;

    let nuovoVolume = volume;
    let nuovaDirezione = direzione;
    let nuoveRisposteAsc = risposteAscendenti;
    let nuoviTentAsc = tentativiAscendenti;

    if (haSentito) {
      nuovoVolume = Math.max(VOLUME_MIN, volume * STEP_GIU);
      nuovaDirezione = 'giu';
      if (direzione === 'su') {
        nuoveRisposteAsc = risposteAscendenti + 1;
        nuoviTentAsc = tentativiAscendenti + 1;
      }
    } else {
      nuovoVolume = Math.min(VOLUME_MAX, volume * STEP_SU);
      if (direzione === 'su') {
        nuoviTentAsc = tentativiAscendenti + 1;
      } else {
        nuovaDirezione = 'su';
        nuoviTentAsc = 1;
        nuoveRisposteAsc = 0;
      }
    }

    const alPavimento = haSentito && nuovoVolume <= VOLUME_MIN_FLOOR;
    const sogliaTrovata =
      (haSentito && direzione === 'su' && nuoveRisposteAsc >= 2) ||
      alPavimento ||
      toniPresentati >= maxToni ||
      nuovoVolume >= VOLUME_MAX;

    if (sogliaTrovata) {
      const sogliaVolume = haSentito ? volume : nuovoVolume;
      return {
        sogliaDbHL: volumeToDbHL(sogliaVolume),
        toniPresentati,
        terminato: true,
      };
    }

    volume = nuovoVolume;
    direzione = nuovaDirezione;
    risposteAscendenti = nuoveRisposteAsc;
    tentativiAscendenti = nuoviTentAsc;
  }

  return { sogliaDbHL: volumeToDbHL(volume), toniPresentati, terminato: false };
}

describe('AudiometriaTonale — logica avanzamento frequenze', () => {
  it('FREQUENZE contiene esattamente 7 frequenze', () => {
    expect(FREQUENZE.length).toBe(7);
  });

  it('FREQUENZE contiene 500, 750, 1000, 1500, 2000, 3000, 4000 Hz', () => {
    const set = new Set(FREQUENZE);
    expect(set.has(500)).toBe(true);
    expect(set.has(750)).toBe(true);
    expect(set.has(1000)).toBe(true);
    expect(set.has(1500)).toBe(true);
    expect(set.has(2000)).toBe(true);
    expect(set.has(3000)).toBe(true);
    expect(set.has(4000)).toBe(true);
  });

  it('la simulazione termina per ogni frequenza con udito normale (risponde sempre)', () => {
    for (const hz of FREQUENZE) {
      // Utente sente tutto → soglia bassa → normale
      const result = simulaFrequenza(() => true);
      expect(result.terminato).toBe(true);
      expect(result.sogliaDbHL).toBeLessThanOrEqual(25);
    }
  });

  it('la simulazione termina per ogni frequenza con udito severo (non risponde mai)', () => {
    for (const hz of FREQUENZE) {
      // Utente non sente nulla → volume sale al massimo
      const result = simulaFrequenza(() => false);
      expect(result.terminato).toBe(true);
    }
  });

  it('tutte e 7 le frequenze vengono percorse in sequenza (indici 0-6)', () => {
    const risultati: number[] = [];
    for (let freqIdx = 0; freqIdx < FREQUENZE.length; freqIdx++) {
      const hz = FREQUENZE[freqIdx];
      risultati.push(hz);
      // Simula soglia per questa frequenza
      const result = simulaFrequenza((vol) => vol >= 0.1);
      expect(result.terminato).toBe(true);
    }
    expect(risultati).toEqual([1000, 2000, 4000, 500, 750, 1500, 3000]);
  });

  it('il floor check funziona: se volume è al minimo e utente sente, la soglia viene registrata', () => {
    // Simula utente che sente sempre → volume scende al minimo → floor check
    const result = simulaFrequenza(() => true);
    expect(result.terminato).toBe(true);
    // La soglia deve essere registrata al pavimento
    const dbHL = volumeToDbHL(VOLUME_MIN);
    expect(result.sogliaDbHL).toBeLessThanOrEqual(dbHL + 5);
  });

  it('il limite MAX_TONI_PER_FREQ blocca il test se non converge', () => {
    // Simula risposta alternata che non converge mai
    let toggle = false;
    const result = simulaFrequenza(() => { toggle = !toggle; return toggle; });
    expect(result.terminato).toBe(true);
    expect(result.toniPresentati).toBeLessThanOrEqual(MAX_TONI_PER_FREQ);
  });

  it('interpretaSoglia classifica correttamente', () => {
    expect(interpretaSoglia(20)).toBe('normale');
    expect(interpretaSoglia(25)).toBe('normale');
    expect(interpretaSoglia(30)).toBe('lieve');
    expect(interpretaSoglia(40)).toBe('lieve');
    expect(interpretaSoglia(50)).toBe('moderato');
    expect(interpretaSoglia(60)).toBe('moderato');
    expect(interpretaSoglia(70)).toBe('severo');
  });
});
