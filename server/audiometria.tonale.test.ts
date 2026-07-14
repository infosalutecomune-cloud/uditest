// ══════════════════════════════════════════════════════════
// Test unitari per la logica Hughson-Westlake del test tonale
// Verifica: floor check, limite toni, avanzamento frequenza
// ══════════════════════════════════════════════════════════
import { describe, it, expect } from 'vitest';

// Costanti replicate dalla logica del componente
const VOLUME_INIZIALE = 0.35;
const STEP_GIU = 0.316;
const STEP_SU  = 1.778;
const VOLUME_MIN = 0.02;
const VOLUME_MAX = 0.95;
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

// Simula la logica di gestisciRisposta per una singola risposta
function simulaRisposta(params: {
  haSentito: boolean;
  volumeCorrente: number;
  direzione: 'su' | 'giu';
  risposteAscendenti: number;
  tentativiAscendenti: number;
  toniPresentati: number;
}) {
  const { haSentito, volumeCorrente, direzione, risposteAscendenti, tentativiAscendenti, toniPresentati } = params;

  const nuoviToni = toniPresentati + 1;
  let nuovoVolume = volumeCorrente;
  let nuovaDirezione = direzione;
  let nuoveRisposteAsc = risposteAscendenti;
  let nuoviTentAsc = tentativiAscendenti;

  if (haSentito) {
    nuovoVolume = Math.max(VOLUME_MIN, volumeCorrente * STEP_GIU);
    nuovaDirezione = 'giu';
    if (direzione === 'su') {
      nuoveRisposteAsc = risposteAscendenti + 1;
      nuoviTentAsc = tentativiAscendenti + 1;
    }
  } else {
    nuovoVolume = Math.min(VOLUME_MAX, volumeCorrente * STEP_SU);
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
    nuoviToni >= MAX_TONI_PER_FREQ ||
    nuovoVolume >= VOLUME_MAX;

  return {
    nuovoVolume,
    nuovaDirezione,
    nuoveRisposteAsc,
    nuoviTentAsc,
    nuoviToni,
    sogliaTrovata,
    alPavimento,
  };
}

describe('Logica Hughson-Westlake — test tonale', () => {

  it('il volume scende di 10 dB quando si sente il tono', () => {
    const result = simulaRisposta({
      haSentito: true,
      volumeCorrente: 0.35,
      direzione: 'giu',
      risposteAscendenti: 0,
      tentativiAscendenti: 0,
      toniPresentati: 0,
    });
    expect(result.nuovoVolume).toBeCloseTo(0.35 * STEP_GIU, 4);
    expect(result.nuovaDirezione).toBe('giu');
    expect(result.sogliaTrovata).toBe(false);
  });

  it('il volume sale di 5 dB quando non si sente il tono', () => {
    const result = simulaRisposta({
      haSentito: false,
      volumeCorrente: 0.35,
      direzione: 'giu',
      risposteAscendenti: 0,
      tentativiAscendenti: 0,
      toniPresentati: 0,
    });
    expect(result.nuovoVolume).toBeCloseTo(0.35 * STEP_SU, 4);
    expect(result.nuovaDirezione).toBe('su');
    expect(result.sogliaTrovata).toBe(false);
  });

  it('la soglia viene trovata dopo 2 risposte positive in fase ascendente', () => {
    // Prima risposta positiva in fase ascendente
    const r1 = simulaRisposta({
      haSentito: true,
      volumeCorrente: 0.2,
      direzione: 'su',
      risposteAscendenti: 1,
      tentativiAscendenti: 1,
      toniPresentati: 5,
    });
    expect(r1.sogliaTrovata).toBe(true);
    expect(r1.nuoveRisposteAsc).toBe(2);
  });

  it('floor check: soglia trovata quando volume è al minimo e si sente', () => {
    // Simuliamo un volume già molto basso
    const result = simulaRisposta({
      haSentito: true,
      volumeCorrente: VOLUME_MIN, // già al minimo
      direzione: 'giu',
      risposteAscendenti: 0,
      tentativiAscendenti: 0,
      toniPresentati: 3,
    });
    // nuovoVolume = max(VOLUME_MIN, VOLUME_MIN * STEP_GIU) = VOLUME_MIN
    expect(result.nuovoVolume).toBe(VOLUME_MIN);
    // alPavimento deve essere true perché nuovoVolume <= VOLUME_MIN_FLOOR
    expect(result.alPavimento).toBe(true);
    expect(result.sogliaTrovata).toBe(true);
  });

  it('limite massimo toni: soglia trovata dopo MAX_TONI_PER_FREQ toni', () => {
    const result = simulaRisposta({
      haSentito: false,
      volumeCorrente: 0.3,
      direzione: 'su',
      risposteAscendenti: 0,
      tentativiAscendenti: 0,
      toniPresentati: MAX_TONI_PER_FREQ - 1, // questo è il 15° tono
    });
    expect(result.nuoviToni).toBe(MAX_TONI_PER_FREQ);
    expect(result.sogliaTrovata).toBe(true);
  });

  it('il volume non scende sotto VOLUME_MIN', () => {
    const result = simulaRisposta({
      haSentito: true,
      volumeCorrente: VOLUME_MIN * 1.1, // appena sopra il minimo
      direzione: 'giu',
      risposteAscendenti: 0,
      tentativiAscendenti: 0,
      toniPresentati: 0,
    });
    expect(result.nuovoVolume).toBeGreaterThanOrEqual(VOLUME_MIN);
  });

  it('il volume non sale sopra VOLUME_MAX', () => {
    const result = simulaRisposta({
      haSentito: false,
      volumeCorrente: VOLUME_MAX * 0.95,
      direzione: 'su',
      risposteAscendenti: 0,
      tentativiAscendenti: 0,
      toniPresentati: 0,
    });
    expect(result.nuovoVolume).toBeLessThanOrEqual(VOLUME_MAX);
  });

  it('volumeToDbHL: volume iniziale corrisponde a ~45 dB HL', () => {
    expect(volumeToDbHL(VOLUME_INIZIALE)).toBe(45);
  });

  it('interpretaSoglia: classificazione corretta per vari livelli', () => {
    expect(interpretaSoglia(20)).toBe('normale');
    expect(interpretaSoglia(25)).toBe('normale');
    expect(interpretaSoglia(30)).toBe('lieve');
    expect(interpretaSoglia(40)).toBe('lieve');
    expect(interpretaSoglia(50)).toBe('moderato');
    expect(interpretaSoglia(60)).toBe('moderato');
    expect(interpretaSoglia(70)).toBe('severo');
  });

});
