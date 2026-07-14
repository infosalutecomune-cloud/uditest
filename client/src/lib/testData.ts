// ══════════════════════════════════════════════════════════
// UdiTest — Dati del test SiIMax (matrice 3×7)
// Matrice italiana: 7 numeri × 7 nomi × 7 aggettivi = 343 frasi
// Lista standard: 14 frasi (ogni parola compare esattamente 2 volte)
// ══════════════════════════════════════════════════════════

// ── Matrice 3×7 SiIMax ──
export const MATRICE = {
  numeri: [
    { parola: 'due',     audio: '/manus-storage/token_due_bf00f074.mp3' },
    { parola: 'tre',     audio: '/manus-storage/token_tre_7c6660ec.mp3' },
    { parola: 'quattro', audio: '/manus-storage/token_quattro_f286175a.mp3' },
    { parola: 'cinque',  audio: '/manus-storage/token_cinque_a3e32101.mp3' },
    { parola: 'sei',     audio: '/manus-storage/token_sei_630a10e1.mp3' },
    { parola: 'sette',   audio: '/manus-storage/token_sette_457d941a.mp3' },
    { parola: 'otto',    audio: '/manus-storage/token_otto_eb385199.mp3' },
  ],
  nomi: [
    { parola: 'scatole', audio: '/manus-storage/token_scatole_a4474fae.mp3' },
    { parola: 'tazze',   audio: '/manus-storage/token_tazze_710e6c79.mp3' },
    { parola: 'scarpe',  audio: '/manus-storage/token_scarpe_0cd8d413.mp3' },
    { parola: 'penne',   audio: '/manus-storage/token_penne_bf4152d5.mp3' },
    { parola: 'chiavi',  audio: '/manus-storage/token_chiavi_ad55177c.mp3' },
    { parola: 'borse',   audio: '/manus-storage/token_borse_56b7635f.mp3' },
    { parola: 'sedie',   audio: '/manus-storage/token_sedie_dd3da36d.mp3' },
  ],
  aggettivi: [
    { parola: 'rosse',   audio: '/manus-storage/token_rosse_dae9e1eb.mp3' },
    { parola: 'nuove',   audio: '/manus-storage/token_nuove_1ada0c8f.mp3' },
    { parola: 'grandi',  audio: '/manus-storage/token_grandi_d84c61e6.mp3' },
    { parola: 'piccole', audio: '/manus-storage/token_piccole_a733f239.mp3' },
    { parola: 'vecchie', audio: '/manus-storage/token_vecchie_02ee5c9d.mp3' },
    { parola: 'lunghe',  audio: '/manus-storage/token_lunghe_df9bf91c.mp3' },
    { parola: 'corte',   audio: '/manus-storage/token_corte_3ae9f63c.mp3' },
  ],
} as const;

export type TokenNumero = typeof MATRICE.numeri[number];
export type TokenNome   = typeof MATRICE.nomi[number];
export type TokenAggettivo = typeof MATRICE.aggettivi[number];

export interface FraseMatrice {
  id: number;
  numero: TokenNumero;
  nome: TokenNome;
  aggettivo: TokenAggettivo;
  testo: string;
  parole: [string, string, string];
  audioTokens: [string, string, string];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generaListaFrasi(): FraseMatrice[] {
  const numeri    = shuffle([...MATRICE.numeri,    ...MATRICE.numeri]);
  const nomi      = shuffle([...MATRICE.nomi,      ...MATRICE.nomi]);
  const aggettivi = shuffle([...MATRICE.aggettivi, ...MATRICE.aggettivi]);
  const frasi: FraseMatrice[] = [];
  for (let i = 0; i < 14; i++) {
    const n   = numeri[i];
    const nom = nomi[i];
    const agg = aggettivi[i];
    frasi.push({
      id: i + 1,
      numero: n,
      nome: nom,
      aggettivo: agg,
      testo: n.parola + ' ' + nom.parola + ' ' + agg.parola,
      parole: [n.parola, nom.parola, agg.parola],
      audioTokens: [n.audio, nom.audio, agg.audio],
    });
  }
  return frasi;
}

export const CALIBRAZIONE_AUDIO_URL = '/manus-storage/calibrazione_500hz_b38112ed.mp3';

// Babble noise: rumore di ristorante/bar affollato (BigSoundBank CC0), indistinto come cocktail party
export const BABBLE_NOISE_URL = '/manus-storage/babble_cocktail_party_3f4223e0.mp3';

export const SNR_CONFIG = {
  iniziale: 0,   // Parte a 0 dB SNR (parole e rumore alla stessa intensità)
  step: 5,       // Passo di 5 dB — percettibile all'ascolto (3 dB era troppo sottile)
  min: -15,      // Minimo -15 dB per chi sente molto bene
  max: 15,       // Massimo +15 dB per chi ha difficoltà
  warmup: 2,
  totaleFrasi: 14,
};

export interface InterpretazioneSRT {
  livello: 'normale' | 'lieve' | 'moderato' | 'severo';
  titolo: string;
  descrizione: string;
  colore: string;
  consiglio: string;
}

// Interpretazione per test nel RUMORE basata su percentuale corrette
// Soglie concordate: >=80% norma, 60-79% lieve, 40-59% moderato, <40% significativo
export function interpretaSRT50(percentualeRumore: number): InterpretazioneSRT {
  if (percentualeRumore >= 80) {
    return { livello: 'normale', titolo: 'Nella norma', descrizione: 'La tua capacità di capire le parole in ambienti rumorosi è nella norma.', colore: '#22C55E', consiglio: 'Continua a fare controlli periodici ogni 1-2 anni.' };
  } else if (percentualeRumore >= 60) {
    return { livello: 'lieve', titolo: 'Lieve difficoltà', descrizione: 'Hai qualche difficoltà a capire le parole in ambienti rumorosi.', colore: '#F59E0B', consiglio: 'Ti consigliamo una visita audiologica per una valutazione completa.' };
  } else if (percentualeRumore >= 40) {
    return { livello: 'moderato', titolo: 'Difficoltà moderata', descrizione: 'Hai difficoltà significative a capire le parole in ambienti rumorosi.', colore: '#F97316', consiglio: 'È importante effettuare una visita audiologica professionale.' };
  } else {
    return { livello: 'severo', titolo: 'Difficoltà significativa', descrizione: 'Hai gravi difficoltà a capire le parole in ambienti rumorosi.', colore: '#EF4444', consiglio: 'Ti consigliamo di prenotare una visita audiologica.' };
  }
}

// Interpretazione per test in SILENZIO (solo percentuale corrette, senza SNR)
// Soglie concordate: >=90% norma, 70-89% lieve, 50-69% moderato, <50% significativo
export function interpretaPercentuale(percentuale: number): InterpretazioneSRT {
  if (percentuale >= 90) {
    return { livello: 'normale', titolo: 'Nella norma', descrizione: 'La tua capacità di comprendere le parole in silenzio è nella norma.', colore: '#22C55E', consiglio: 'Continua a fare controlli periodici ogni 1-2 anni.' };
  } else if (percentuale >= 70) {
    return { livello: 'lieve', titolo: 'Lieve difficoltà', descrizione: 'Hai qualche difficoltà a comprendere le parole in condizioni di silenzio.', colore: '#F59E0B', consiglio: 'Ti consigliamo una visita audiologica per una valutazione completa.' };
  } else if (percentuale >= 50) {
    return { livello: 'moderato', titolo: 'Difficoltà moderata', descrizione: 'Hai difficoltà significative a comprendere le parole anche in silenzio.', colore: '#F97316', consiglio: 'È importante effettuare una visita audiologica professionale.' };
  } else {
    return { livello: 'severo', titolo: 'Difficoltà significativa', descrizione: 'Hai gravi difficoltà a comprendere le parole anche in condizioni ottimali.', colore: '#EF4444', consiglio: 'Ti consigliamo di prenotare una visita audiologica.' };
  }
}

export function calcolaSRT50(snrHistory: number[]): number {
  if (snrHistory.length < 4) return snrHistory[snrHistory.length - 1] ?? 0;
  const valori = snrHistory.slice(SNR_CONFIG.warmup);
  return Math.round((valori.reduce((a, b) => a + b, 0) / valori.length) * 10) / 10;
}

// Mappa cifre → parole italiane (Whisper a volte trascrive i numeri come cifre)
const CIFRE_A_PAROLE: Record<string, string> = {
  '2': 'due', '3': 'tre', '4': 'quattro', '5': 'cinque',
  '6': 'sei', '7': 'sette', '8': 'otto',
};

export function normalizzaParola(p: string): string {
  let s = p
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // rimuove accenti
    .replace(/[.,!?;:"'()\[\]\-_]/g, '') // rimuove punteggiatura (Whisper aggiunge . ! ? , ecc.)
    .trim();
  // Sostituisce cifre isolate con la parola italiana corrispondente
  s = s.replace(/\b(\d+)\b/g, (match) => CIFRE_A_PAROLE[match] ?? match);
  return s;
}

export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// Alias espliciti per trascrizioni errate note di Whisper su parole della matrice SiIMax
// Chiave: variante trascritta da Whisper → valore: parola corretta della matrice
const WHISPER_ALIAS: Record<string, string> = {
  'peni': 'penne',
  'pene': 'penne',
  'chiave': 'chiavi',
  'borsa': 'borse',
  'sedia': 'sedie',
  'scarpa': 'scarpe',
  'tazza': 'tazze',
  'scatola': 'scatole',
  'grande': 'grandi',
  'piccola': 'piccole',
  'vecchia': 'vecchie',
  'lunga': 'lunghe',
  'corta': 'corte',
  'rossa': 'rosse',
  'nuova': 'nuove',
  'sett': 'sette',
  'quattr': 'quattro',
  'cinqu': 'cinque',
};

export function parolaCorretta(detta: string, corretta: string): boolean {
  let d = normalizzaParola(detta);
  const c = normalizzaParola(corretta);

  // Risolvi alias Whisper noti prima del confronto
  if (WHISPER_ALIAS[d]) d = WHISPER_ALIAS[d];

  if (d === c) return true;

  // Soglia STRETTA: massimo 1 errore per tutte le parole.
  // Soglia 2+ causava troppi falsi positivi (es. "peni" accettato per "penne").
  const soglia = 1;
  if (levenshtein(d, c) <= soglia) return true;

  // Controllo substring SOLO se la parola detta è più lunga della corretta
  // (es. Whisper trascrive "le scatole" e la parola attesa è "scatole")
  // NON il contrario (evita che "peni" venga trovato dentro "penne")
  if (d.length > c.length && d.includes(c)) return true;

  return false;
}
