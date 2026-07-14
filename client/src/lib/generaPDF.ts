// ══════════════════════════════════════════════════════════
// UdiTest — Generazione PDF risultati
// Header: sfondo bianco con logo, poi striscia blu con titolo/data
// Valutazione: semaforo orizzontale con luce accesa sul risultato
// ══════════════════════════════════════════════════════════
import { jsPDF } from 'jspdf';
import { LOGO_BASE64 } from './logoBase64';

// ─── Colori brand ───────────────────────────────────────
const BLU       = '#1E73BE';
const VERDE     = '#16A34A';
const GIALLO    = '#D97706';
const ROSSO     = '#DC2626';
const GRIGIO_CHIARO = '#F1F5F9';
const GRIGIO_TESTO  = '#64748B';
const NERO      = '#1E293B';

// Colori spenti del semaforo (versione desaturata)
const VERDE_OFF  = '#BBF7D0';
const GIALLO_OFF = '#FDE68A';
const ROSSO_OFF  = '#FECACA';

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}
function setColor(doc: jsPDF, hex: string) { doc.setTextColor(...hexToRgb(hex)); }
function setFill(doc: jsPDF, hex: string)  { doc.setFillColor(...hexToRgb(hex)); }
function setDraw(doc: jsPDF, hex: string)  { doc.setDrawColor(...hexToRgb(hex)); }

// ─── Header: logo su bianco + striscia blu ───────────────
// Restituisce la y dopo l'header (punto di partenza del contenuto)
function disegnaHeader(doc: jsPDF, titolo: string): number {
  const W = doc.internal.pageSize.getWidth();

  // 1. Zona bianca con logo
  setFill(doc, '#FFFFFF');
  doc.rect(0, 0, W, 22, 'F');

  try {
    // Logo centrato verticalmente nella zona bianca, allineato a sinistra
    doc.addImage(LOGO_BASE64, 'PNG', 12, 3, 50, 16);
  } catch {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    setColor(doc, BLU);
    doc.text('Acustica Di Maio', 14, 14);
  }

  // Nome app a destra
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  setColor(doc, BLU);
  doc.text('UdiTest', W - 14, 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setColor(doc, GRIGIO_TESTO);
  doc.text('Screening Uditivo', W - 14, 17, { align: 'right' });

  // Linea di separazione sottile
  setDraw(doc, '#D6E9F8');
  doc.setLineWidth(0.4);
  doc.line(0, 22, W, 22);

  // 2. Striscia blu con titolo e data
  setFill(doc, BLU);
  doc.rect(0, 22, W, 12, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setColor(doc, '#FFFFFF');
  doc.text(titolo, 14, 30);

  const data = new Date().toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setColor(doc, '#BFDBFE');
  doc.text(data, W - 14, 30, { align: 'right' });

  return 40; // y di partenza del contenuto
}

// ─── Semaforo orizzontale ────────────────────────────────
// Disegna 3 cerchi (verde/giallo/rosso) con il cerchio del risultato acceso
// Restituisce la y dopo il semaforo
function disegnaSemaforo(
  doc: jsPDF,
  y: number,
  risultato: 'verde' | 'giallo' | 'rosso',
  etichetta: string,
): number {
  const W = doc.internal.pageSize.getWidth();
  const altezza = 28;

  // Sfondo riquadro semaforo
  setFill(doc, GRIGIO_CHIARO);
  setDraw(doc, '#E2E8F0');
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, W - 28, altezza, 3, 3, 'FD');

  // Titolo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setColor(doc, GRIGIO_TESTO);
  doc.text('VALUTAZIONE GLOBALE', 20, y + 7);

  // Etichetta risultato
  const coloreAttivo = risultato === 'verde' ? VERDE : risultato === 'giallo' ? GIALLO : ROSSO;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  setColor(doc, coloreAttivo);
  doc.text(etichetta, 20, y + 21);

  // Semaforo orizzontale: 3 cerchi a destra
  const r = 7;           // raggio cerchio
  const gap = 4;         // spazio tra cerchi
  const totW = r * 2 * 3 + gap * 2;
  const startX = W - 14 - totW + r;
  const cy = y + altezza / 2;

  const luci: Array<{ coloreOn: string; coloreOff: string; tipo: 'verde' | 'giallo' | 'rosso' }> = [
    { coloreOn: VERDE,  coloreOff: VERDE_OFF,  tipo: 'verde'  },
    { coloreOn: GIALLO, coloreOff: GIALLO_OFF, tipo: 'giallo' },
    { coloreOn: ROSSO,  coloreOff: ROSSO_OFF,  tipo: 'rosso'  },
  ];

  luci.forEach((luce, i) => {
    const cx = startX + i * (r * 2 + gap);
    const accesa = luce.tipo === risultato;
    const colore = accesa ? luce.coloreOn : luce.coloreOff;

    setFill(doc, colore);
    setDraw(doc, accesa ? colore : '#D1D5DB');
    doc.setLineWidth(accesa ? 0 : 0.3);
    doc.circle(cx, cy, r, 'FD');

    // Alone/glow per la luce accesa
    if (accesa) {
      setFill(doc, colore + '30');
      setDraw(doc, colore + '50');
      doc.setLineWidth(0.5);
      doc.circle(cx, cy, r + 2, 'FD');
    }
  });

  return y + altezza + 6;
}

// ─── Footer comune ─────────────────────────────────────────────────
function disegnaFooter(doc: jsPDF) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // ─ Banda disclaimer arancione/gialla ─
  const disclaimerH = 22;
  const disclaimerY = H - 42;
  setFill(doc, '#FFF7ED');  // sfondo arancio chiaro
  setDraw(doc, '#F97316');
  doc.setLineWidth(0.5);
  doc.rect(0, disclaimerY, W, disclaimerH, 'FD');

  // Bordo sinistro arancione spesso
  setFill(doc, '#F97316');
  doc.rect(0, disclaimerY, 4, disclaimerH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setColor(doc, '#C2410C');
  doc.text('AVVISO: SOLO SCREENING - NON COSTITUISCE DIAGNOSI MEDICA', 10, disclaimerY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setColor(doc, '#7C2D12');
  const disclaimer =
    'Questo documento riporta risultati di screening indicativi eseguiti tramite dispositivo mobile. ' +
    'Non sostituiscono una valutazione audiologica professionale con strumentazione calibrata. ' +
    'Per una valutazione accurata rivolgersi a un audioprotesista, audiometrista o specialista ORL.';
  const righe = doc.splitTextToSize(disclaimer, W - 18);
  doc.text(righe, 10, disclaimerY + 14);

  // ─ Banda contatti blu ─
  const contattiY = H - 20;
  setFill(doc, BLU);
  doc.rect(0, contattiY, W, 20, 'F');

  // WhatsApp in primo piano
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setColor(doc, '#FFFFFF');
  doc.text('WhatsApp: +39 334 199 0307', W / 2, contattiY + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setColor(doc, '#BFDBFE');
  doc.text('Acustica Di Maio  |  www.acusticadimaio.it', W / 2, contattiY + 15, { align: 'center' });
}

// ─── Riga separatore ─────────────────────────────────────────────────
function separatore(doc: jsPDF, y: number) {
  const W = doc.internal.pageSize.getWidth();
  setDraw(doc, '#E2E8F0');
  doc.setLineWidth(0.3);
  doc.line(14, y, W - 14, y);
}

// ══════════════════════════════════════════════════════════
// PDF TEST VOCALE
// ══════════════════════════════════════════════════════════
export interface DatiPaziente {
  nome?: string;
  cognome?: string;
  dataNascita?: string; // YYYY-MM-DD
  comune?: string;
  cellulare?: string;
}

export interface DatiPDFVocale {
  srt50: number | null;
  percentualeCorrette: number;
  modalita: string;
  livelloFinale: number;
  numFrasi: number;
  numCorrette: number;
  interpretazione: string;
  coloreInterpretazione: 'verde' | 'giallo' | 'rosso';
  paziente?: DatiPaziente;
}

function disegnaDatiPaziente(doc: jsPDF, y: number, paziente?: DatiPaziente): number {
  if (!paziente) return y;
  const { nome, cognome, dataNascita, comune, cellulare } = paziente;
  const hasAny = nome || cognome || dataNascita || comune || cellulare;
  if (!hasAny) return y;

  const W = doc.internal.pageSize.getWidth();
  setFill(doc, '#F8FAFC');
  setDraw(doc, '#D6E9F8');
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, W - 28, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setColor(doc, GRIGIO_TESTO);
  doc.text('PAZIENTE', 18, y + 5);

  const nomeCompleto = [nome, cognome].filter(Boolean).join(' ');
  let info = nomeCompleto;
  if (dataNascita) {
    const [yr, mo, dy] = dataNascita.split('-');
    const oggi = new Date();
    const nascita = new Date(Number(yr), Number(mo) - 1, Number(dy));
    let eta = oggi.getFullYear() - nascita.getFullYear();
    const mDiff = oggi.getMonth() - nascita.getMonth();
    if (mDiff < 0 || (mDiff === 0 && oggi.getDate() < nascita.getDate())) eta--;
    const etaStr = eta >= 0 && eta < 130 ? ` (${eta} anni)` : '';
    info += info ? `  |  Nato/a il ${dy}/${mo}/${yr}${etaStr}` : `Nato/a il ${dy}/${mo}/${yr}${etaStr}`;
  }
  if (comune) info += info ? `  |  ${comune}` : comune;
  if (cellulare) info += info ? `  |  Cell. ${cellulare}` : `Cell. ${cellulare}`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setColor(doc, NERO);
  doc.text(info, 18, y + 11);

  return y + 18;
}

export function generaPDFVocale(dati: DatiPDFVocale): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  const isSilenzio = dati.modalita === 'silenzio';
  const titoloHeader = isSilenzio
    ? 'Referto Screening — Test Vocale in Silenzio'
    : 'Referto Screening — Test Vocale nel Rumore';
  let y = disegnaHeader(doc, titoloHeader);
  y = disegnaDatiPaziente(doc, y, dati.paziente);

  // ── Calcola interpretazione dalla percentuale (soglie concordate) ──
  const interp = (() => {
    const p = dati.percentualeCorrette;
    if (isSilenzio) {
      if (p >= 90) return { testo: 'Udito nella norma', colore: 'verde' as const };
      if (p >= 70) return { testo: 'Lieve difficoltà', colore: 'giallo' as const };
      if (p >= 50) return { testo: 'Difficoltà moderata', colore: 'giallo' as const };
      return { testo: 'Difficoltà significativa', colore: 'rosso' as const };
    } else {
      if (p >= 80) return { testo: 'Udito nella norma', colore: 'verde' as const };
      if (p >= 60) return { testo: 'Lieve difficoltà nel rumore', colore: 'giallo' as const };
      if (p >= 40) return { testo: 'Difficoltà moderata nel rumore', colore: 'giallo' as const };
      return { testo: 'Difficoltà significativa nel rumore', colore: 'rosso' as const };
    }
  })();

  y = disegnaSemaforo(doc, y, interp.colore, interp.testo);

  // ── Percentuale in evidenza (al posto di SRT50) ──
  const coloreRis = interp.colore === 'verde' ? VERDE : interp.colore === 'giallo' ? GIALLO : ROSSO;
  setFill(doc, coloreRis + '12');
  setDraw(doc, coloreRis + '60');
  doc.setLineWidth(0.4);
  doc.roundedRect(14, y, W - 28, 18, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  setColor(doc, coloreRis);
  doc.text(`${dati.percentualeCorrette}% di comprensione`, W / 2, y + 12, { align: 'center' });
  y += 24;

  // ── Tabella dati (senza SRT) ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setColor(doc, NERO);
  doc.text('Dettaglio del test', 14, y);
  y += 5;
  separatore(doc, y);
  y += 4;

  const righeTabella = [
    ['Frasi presentate', `${dati.numFrasi}`],
    ['Frasi corrette', `${dati.numCorrette} su ${dati.numFrasi} (${dati.percentualeCorrette.toFixed(0)}%)`],
  ];

  righeTabella.forEach(([etichetta, valore], i) => {
    if (i % 2 === 0) {
      setFill(doc, GRIGIO_CHIARO);
      doc.rect(14, y - 3, W - 28, 8, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    setColor(doc, GRIGIO_TESTO);
    doc.text(etichetta, 18, y + 2);
    doc.setFont('helvetica', 'normal');
    setColor(doc, NERO);
    doc.text(valore, W - 18, y + 2, { align: 'right' });
    y += 8;
  });

  y += 5;
  separatore(doc, y);
  y += 7;

  // ── Grafico a barre percentuale ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setColor(doc, NERO);
  doc.text('Grafico del risultato', 14, y);
  y += 5;

  const barX = 14;
  const barW = W - 28;
  const barH = 10;

  // Zone colorate (in percentuale)
  const toXp = (p: number) => barX + (p / 100) * barW;
  setFill(doc, ROSSO + '80');  doc.rect(barX, y, toXp(isSilenzio ? 50 : 40) - barX, barH, 'F');
  setFill(doc, GIALLO + '80'); doc.rect(toXp(isSilenzio ? 50 : 40), y, toXp(isSilenzio ? 90 : 80) - toXp(isSilenzio ? 50 : 40), barH, 'F');
  setFill(doc, VERDE + '80');  doc.rect(toXp(isSilenzio ? 90 : 80), y, barX + barW - toXp(isSilenzio ? 90 : 80), barH, 'F');
  setDraw(doc, '#CBD5E1'); doc.setLineWidth(0.3); doc.rect(barX, y, barW, barH, 'S');

  // Cursore risultato (triangolo bianco con bordo scuro)
  const cursorX = Math.max(barX + 3, Math.min(barX + barW - 3, toXp(dati.percentualeCorrette)));
  setFill(doc, '#FFFFFF'); setDraw(doc, '#1E293B'); doc.setLineWidth(0.8);
  doc.triangle(cursorX - 3, y - 1, cursorX + 3, y - 1, cursorX, y + 4, 'FD');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
  setColor(doc, '#1E293B');
  doc.text(`${dati.percentualeCorrette}%`, cursorX, y - 4, { align: 'center' });

  y += barH + 5;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); setColor(doc, GRIGIO_TESTO);
  doc.text('0%', barX, y + 3);
  doc.text('50%', toXp(50), y + 3, { align: 'center' });
  doc.text('100%', barX + barW, y + 3, { align: 'right' });
  y += 10;

  // ── Spiegazione breve ──
  separatore(doc, y); y += 7;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); setColor(doc, GRIGIO_TESTO);
  const spiegazione = isSilenzio
    ? 'Questo test misura la percentuale di parole comprese in condizioni di ascolto ideale (silenzio).'
    : 'Questo test misura la percentuale di parole comprese in presenza di rumore di fondo.';
  doc.text(spiegazione, 14, y);
  y += 6;
  doc.text('Per una valutazione accurata rivolgersi a un audioprotesista o specialista ORL.', 14, y);

  disegnaFooter(doc);
  doc.save('UdiTest_TestVocale.pdf');
}

// ══════════════════════════════════════════════════════════
// PDF TEST TONALE
// ══════════════════════════════════════════════════════════
export interface RisultatoFrequenza {
  hz: number;
  sentito: boolean;
  sogliaDbHL?: number;
  udito?: 'normale' | 'lieve' | 'moderato' | 'severo';
}

export interface DatiPDFTonale {
  risultati: RisultatoFrequenza[];
  interpretazioneGlobale?: string;
  coloreGlobale?: 'verde' | 'giallo' | 'rosso';
  dataTest?: Date;
  paziente?: DatiPaziente;
}

export function generaPDFTonale(dati: DatiPDFTonale): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  let y = disegnaHeader(doc, 'Referto Screening — Test Audiometrico Tonale');
  y = disegnaDatiPaziente(doc, y, dati.paziente);

  // ── Semaforo valutazione globale ──
  // Calcola colore dal risultato peggiore se non fornito
  const coloreCalcolato: 'verde' | 'giallo' | 'rosso' = dati.coloreGlobale ?? (() => {
    if (!dati.risultati || dati.risultati.length === 0) return 'verde';
    const ord = ['normale', 'lieve', 'moderato', 'severo'];
    let peggioreIdx = 0;
    for (const r of dati.risultati) {
      const idx = ord.indexOf(r.udito ?? 'normale');
      if (idx > peggioreIdx) peggioreIdx = idx;
    }
    const u = ord[peggioreIdx];
    return u === 'normale' ? 'verde' : u === 'lieve' ? 'giallo' : 'rosso';
  })();
  const etichettaCalcolata = dati.interpretazioneGlobale ?? (
    coloreCalcolato === 'verde' ? 'Udito nella norma' :
    coloreCalcolato === 'giallo' ? 'Lieve difficoltà uditiva' : 'Difficoltà uditiva significativa'
  );
  y = disegnaSemaforo(doc, y, coloreCalcolato, etichettaCalcolata);

  // ── Audiogramma grafico ──
  // (tabella per frequenza rimossa su richiesta: troppo dettagliata per lo screening)

  // Helper colore per i punti del grafico
  const coloreUdito = (u: string | undefined) => {
    if (u === 'normale') return VERDE;
    if (u === 'lieve') return GIALLO;
    if (u === 'moderato') return '#F97316';
    return ROSSO;
  };
  separatore(doc, y);
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setColor(doc, NERO);
  doc.text('Audiogramma di screening', 14, y);
  y += 5;

  // Dimensioni area grafico
  const gX = 28;           // margine sinistro (spazio per etichette dB)
  const gW = W - gX - 14; // larghezza area grafico
  const gH = 55;           // altezza area grafico
  const gY = y;

  // Assi dB HL: da -10 a 80 dB HL (invertito: 0 in alto, 80 in basso)
  const DB_MIN = -10;
  const DB_MAX = 80;
  const dbRange = DB_MAX - DB_MIN;

  // Frequenze nell'ordine audiometrico
  const freqOrdinateAudio = [500, 750, 1000, 1500, 2000, 3000, 4000];
  const freqCount = freqOrdinateAudio.length;

  const toGX = (fIdx: number) => gX + (fIdx / (freqCount - 1)) * gW;
  const toGY = (db: number) => gY + ((db - DB_MIN) / dbRange) * gH;

  // Sfondo area grafico
  setFill(doc, '#F8FAFC');
  setDraw(doc, '#E2E8F0');
  doc.setLineWidth(0.3);
  doc.rect(gX, gY, gW, gH, 'FD');

  // Zone colorate di sfondo (normale / lieve / moderato / severo) — colori pastello chiari
  // Usiamo RGB direttamente per garantire colori tenui e pastello
  const zonePastello = [
    { from: -10, to: 25, r: 220, g: 252, b: 231 },  // verde pastello
    { from: 25,  to: 40, r: 254, g: 249, b: 215 },  // giallo pastello
    { from: 40,  to: 60, r: 255, g: 237, b: 213 },  // arancio pastello
    { from: 60,  to: 80, r: 254, g: 226, b: 226 },  // rosso pastello
  ];
  zonePastello.forEach(z => {
    const zy1 = Math.max(gY, toGY(z.from));
    const zy2 = Math.min(gY + gH, toGY(z.to));
    doc.setFillColor(z.r, z.g, z.b);
    doc.rect(gX, zy1, gW, zy2 - zy1, 'F');
  });

  // Linee griglia orizzontali ogni 20 dB
  [0, 20, 40, 60, 80].forEach(db => {
    const gy = toGY(db);
    setDraw(doc, '#CBD5E1');
    doc.setLineWidth(db === 0 ? 0.5 : 0.2);
    doc.line(gX, gy, gX + gW, gy);
    // Etichette dB a sinistra
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    setColor(doc, GRIGIO_TESTO);
    doc.text(`${db}`, gX - 4, gy + 2, { align: 'right' });
  });

  // Etichetta asse Y
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  setColor(doc, GRIGIO_TESTO);
  doc.text('dB HL', 10, gY + gH / 2, { align: 'center', angle: 90 });

  // Linee griglia verticali e etichette frequenze
  freqOrdinateAudio.forEach((hz, i) => {
    const gx = toGX(i);
    setDraw(doc, '#CBD5E1');
    doc.setLineWidth(0.2);
    doc.line(gx, gY, gx, gY + gH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    setColor(doc, GRIGIO_TESTO);
    doc.text(`${hz}`, gx, gY + gH + 5, { align: 'center' });
  });

  // Etichetta asse X
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  setColor(doc, GRIGIO_TESTO);
  doc.text('Hz', gX + gW + 4, gY + gH + 5);

  // Punti e linea di connessione per i risultati
  const puntiFiltrati = freqOrdinateAudio
    .map(hz => {
      const r = dati.risultati.find(r => r.hz === hz);
      if (!r || r.sogliaDbHL === undefined) return null;
      return { hz, db: r.sogliaDbHL, udito: r.udito };
    })
    .filter(Boolean) as { hz: number; db: number; udito: string }[];

  // Linea di connessione
  if (puntiFiltrati.length > 1) {
    setDraw(doc, '#1E73BE');
    doc.setLineWidth(0.8);
    for (let i = 0; i < puntiFiltrati.length - 1; i++) {
      const p1 = puntiFiltrati[i];
      const p2 = puntiFiltrati[i + 1];
      const i1 = freqOrdinateAudio.indexOf(p1.hz);
      const i2 = freqOrdinateAudio.indexOf(p2.hz);
      doc.line(toGX(i1), toGY(p1.db), toGX(i2), toGY(p2.db));
    }
  }

  // Punti (cerchi colorati)
  puntiFiltrati.forEach(p => {
    const px = toGX(freqOrdinateAudio.indexOf(p.hz));
    const py = toGY(p.db);
    const col = coloreUdito(p.udito);
    setFill(doc, col);
    setDraw(doc, '#FFFFFF');
    doc.setLineWidth(0.5);
    doc.circle(px, py, 2.5, 'FD');
    // Valore dB sopra il punto
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    setColor(doc, col);
    doc.text(`${p.db}`, px, py - 4, { align: 'center' });
  });

  y += gH + 14;

  // Legenda audiogramma
  const legendaAudio = [
    { colore: VERDE,    label: 'Normale (≤25 dB)' },
    { colore: GIALLO,   label: 'Lieve (26–40 dB)' },
    { colore: '#F97316', label: 'Moderato (41–60 dB)' },
    { colore: ROSSO,    label: 'Severo (>60 dB)' },
  ];
  let lxA = gX;
  legendaAudio.forEach(l => {
    setFill(doc, l.colore + '60');
    doc.rect(lxA, y, 6, 4, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    setColor(doc, GRIGIO_TESTO);
    doc.text(l.label, lxA + 8, y + 3.5);
    lxA += 44;
  });

  y += 10;
  separatore(doc, y);
  y += 7;

  // ── Spiegazione sintetica (2 righe) ──

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setColor(doc, GRIGIO_TESTO);
  const riga1 = 'I valori mostrati rappresentano la soglia uditiva indicativa per ciascuna frequenza testata.';
  const riga2 = 'Per una diagnosi accurata rivolgersi a un audioprotesista o specialista ORL.';
  doc.text(riga1, 14, y);
  y += 6;
  doc.text(riga2, 14, y);

  disegnaFooter(doc);
  doc.save('UdiTest_TestTonale.pdf');
}

// ══════════════════════════════════════════════════════════
// PDF COMBINATO — Vocale + Tonale in un unico documento
// ══════════════════════════════════════════════════════════
export interface DatiPDFCombinato {
  vocale?: DatiPDFVocale;          // test vocale nel rumore
  vocaleSilenzio?: DatiPDFVocale;  // test vocale in silenzio
  tonale?: DatiPDFTonale;
  paziente?: DatiPaziente;
}

// Helper interno: disegna una sezione vocale nel PDF combinato
function disegnaSezioneVocale(doc: jsPDF, dati: DatiPDFVocale, titolo: string, paziente?: DatiPaziente): void {
  const W = doc.internal.pageSize.getWidth();
  let y = disegnaHeader(doc, titolo);
  y = disegnaDatiPaziente(doc, y, paziente ?? dati.paziente);

  const coloreVocale = dati.coloreInterpretazione;
  const coloreHex = coloreVocale === 'verde' ? VERDE : coloreVocale === 'giallo' ? GIALLO : ROSSO;

  // Sezione risultato
  setFill(doc, GRIGIO_CHIARO);
  setDraw(doc, '#E2E8F0');
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, W - 28, 18, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setColor(doc, GRIGIO_TESTO);
  doc.text('RISULTATO', 18, y + 6);
  doc.setFontSize(11);
  setColor(doc, coloreHex);
  doc.text(dati.interpretazione, 18, y + 14);

  // Semaforo
  const semaforoX = W - 60;
  const semaforoY = y + 4;
  const luci = [
    { c: VERDE, off: VERDE_OFF },
    { c: GIALLO, off: GIALLO_OFF },
    { c: ROSSO, off: ROSSO_OFF },
  ];
  const attivo = coloreVocale === 'verde' ? 0 : coloreVocale === 'giallo' ? 1 : 2;
  luci.forEach((l, i) => {
    const lx = semaforoX + i * 18;
    setFill(doc, i === attivo ? l.c : l.off);
    doc.circle(lx, semaforoY + 5, 5, 'F');
  });
  y += 24;

  // Dettagli
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setColor(doc, NERO);
  doc.text('Dettaglio', 14, y);
  y += 6;

  const isSilenzio = dati.modalita === 'silenzio';
  const srt50Str = (!isSilenzio && dati.srt50 !== null && dati.srt50 !== undefined)
    ? `${dati.srt50 > 0 ? '+' : ''}${dati.srt50} dB SNR`
    : null;
  const dettagli: { label: string; value: string }[] = [];
  if (srt50Str) dettagli.push({ label: 'SRT50 (soglia 50% comprensione)', value: srt50Str });
  dettagli.push({ label: 'Parole corrette', value: `${dati.percentualeCorrette}%` });
  dettagli.push({ label: 'Frasi presentate', value: `${dati.numFrasi}` });

  dettagli.forEach(d => {
    setFill(doc, '#F8FAFC');
    setDraw(doc, '#E2E8F0');
    doc.setLineWidth(0.2);
    doc.roundedRect(14, y, W - 28, 9, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setColor(doc, GRIGIO_TESTO);
    doc.text(d.label, 18, y + 6);
    doc.setFont('helvetica', 'bold');
    setColor(doc, NERO);
    doc.text(d.value, W - 18, y + 6, { align: 'right' });
    y += 11;
  });
}

// Helper: interpreta percentuale con le soglie concordate
function interpretaPerc(perc: number, isSilenzio: boolean): { testo: string; colore: 'verde' | 'giallo' | 'rosso' } {
  if (isSilenzio) {
    if (perc >= 90) return { testo: 'Udito nella norma', colore: 'verde' };
    if (perc >= 70) return { testo: 'Lieve difficolt\u00e0', colore: 'giallo' };
    if (perc >= 50) return { testo: 'Difficolt\u00e0 moderata', colore: 'giallo' };
    return { testo: 'Difficolt\u00e0 significativa', colore: 'rosso' };
  } else {
    if (perc >= 80) return { testo: 'Udito nella norma', colore: 'verde' };
    if (perc >= 60) return { testo: 'Lieve difficolt\u00e0 nel rumore', colore: 'giallo' };
    if (perc >= 40) return { testo: 'Difficolt\u00e0 moderata nel rumore', colore: 'giallo' };
    return { testo: 'Difficolt\u00e0 significativa nel rumore', colore: 'rosso' };
  }
}

export function generaPDFCombinato(dati: DatiPDFCombinato): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  // ── Header unico ──
  let y = disegnaHeader(doc, 'Referto Combinato — Screening Uditivo');
  y = disegnaDatiPaziente(doc, y, dati.paziente ?? dati.vocaleSilenzio?.paziente ?? dati.vocale?.paziente);

  // ── Helper: disegna sezione vocale compatta (senza header/paziente) ──
  const disegnaVocaleCompatta = (vocale: DatiPDFVocale, etichetta: string) => {
    const isSilenzio = vocale.modalita === 'silenzio';
    const interp = interpretaPerc(vocale.percentualeCorrette, isSilenzio);
    const coloreHex = interp.colore === 'verde' ? VERDE : interp.colore === 'giallo' ? GIALLO : ROSSO;

    // Titolo sezione
    separatore(doc, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(doc, BLU);
    doc.text(etichetta, 14, y);
    y += 5;

    // Card risultato compatta
    setFill(doc, GRIGIO_CHIARO);
    setDraw(doc, '#E2E8F0');
    doc.setLineWidth(0.3);
    doc.roundedRect(14, y, W - 28, 14, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(doc, coloreHex);
    doc.text(interp.testo, 18, y + 9);
    // Percentuale a destra
    doc.setFontSize(11);
    doc.text(`${vocale.percentualeCorrette}%`, W - 18, y + 9, { align: 'right' });
    y += 18;
  };

  if (dati.vocaleSilenzio) disegnaVocaleCompatta(dati.vocaleSilenzio, 'Test Vocale in Silenzio');
  if (dati.vocale) disegnaVocaleCompatta(dati.vocale, 'Test Vocale nel Rumore');

  // ── Sezione Tonale (stesso foglio) ──
  if (dati.tonale) {
    const coloreGlobale = dati.tonale.coloreGlobale ?? 'verde';
    const coloreHexT = coloreGlobale === 'verde' ? VERDE : coloreGlobale === 'giallo' ? GIALLO : ROSSO;

    separatore(doc, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(doc, BLU);
    doc.text('Test Audiometrico Tonale', 14, y);
    y += 5;

    // Card risultato compatta
    setFill(doc, GRIGIO_CHIARO);
    setDraw(doc, '#E2E8F0');
    doc.setLineWidth(0.3);
    doc.roundedRect(14, y, W - 28, 14, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(doc, coloreHexT);
    doc.text(dati.tonale.interpretazioneGlobale ?? 'Udito nella norma', 18, y + 9);
    y += 18;

    // Grafico audiogramma — stesso stile del PDF tonale standalone
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setColor(doc, NERO);
    doc.text('Audiogramma di screening', 14, y);
    y += 5;

    const gX2 = 28;
    const gW2 = W - gX2 - 14;
    const gH2 = 55;
    const gY2 = y;
    const DB_MIN2 = -10;
    const DB_MAX2 = 80;
    const dbRange2 = DB_MAX2 - DB_MIN2;
    const freqOrd2 = [500, 750, 1000, 1500, 2000, 3000, 4000];
    const freqCount2 = freqOrd2.length;
    const toGX2 = (fi: number) => gX2 + (fi / (freqCount2 - 1)) * gW2;
    const toGY2 = (db: number) => gY2 + ((db - DB_MIN2) / dbRange2) * gH2;

    // Sfondo
    setFill(doc, '#F8FAFC');
    setDraw(doc, '#E2E8F0');
    doc.setLineWidth(0.3);
    doc.rect(gX2, gY2, gW2, gH2, 'FD');

    // Zone pastello
    const zonePastello2 = [
      { from: -10, to: 25, r: 220, g: 252, b: 231 },
      { from: 25,  to: 40, r: 254, g: 249, b: 215 },
      { from: 40,  to: 60, r: 255, g: 237, b: 213 },
      { from: 60,  to: 80, r: 254, g: 226, b: 226 },
    ];
    zonePastello2.forEach(z => {
      const zy1 = Math.max(gY2, toGY2(z.from));
      const zy2 = Math.min(gY2 + gH2, toGY2(z.to));
      doc.setFillColor(z.r, z.g, z.b);
      doc.rect(gX2, zy1, gW2, zy2 - zy1, 'F');
    });

    // Griglia orizzontale
    [0, 20, 40, 60, 80].forEach(db => {
      const gy = toGY2(db);
      setDraw(doc, '#CBD5E1');
      doc.setLineWidth(db === 0 ? 0.5 : 0.2);
      doc.line(gX2, gy, gX2 + gW2, gy);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      setColor(doc, GRIGIO_TESTO);
      doc.text(`${db}`, gX2 - 4, gy + 2, { align: 'right' });
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    setColor(doc, GRIGIO_TESTO);
    doc.text('dB HL', 10, gY2 + gH2 / 2, { align: 'center', angle: 90 });

    // Griglia verticale e frequenze
    freqOrd2.forEach((hz, i) => {
      const gx = toGX2(i);
      setDraw(doc, '#CBD5E1');
      doc.setLineWidth(0.2);
      doc.line(gx, gY2, gx, gY2 + gH2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      setColor(doc, GRIGIO_TESTO);
      doc.text(`${hz}`, gx, gY2 + gH2 + 5, { align: 'center' });
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    setColor(doc, GRIGIO_TESTO);
    doc.text('Hz', gX2 + gW2 + 4, gY2 + gH2 + 5);

    // Punti e linea
    const coloreUdito2 = (u: string | undefined) => {
      if (u === 'normale') return VERDE;
      if (u === 'lieve') return GIALLO;
      if (u === 'moderato') return '#F97316';
      return ROSSO;
    };
    const punti2 = freqOrd2
      .map(hz => {
        const r = dati.tonale!.risultati.find(x => x.hz === hz);
        if (!r || r.sogliaDbHL === undefined) return null;
        return { hz, db: r.sogliaDbHL, udito: r.udito };
      })
      .filter(Boolean) as { hz: number; db: number; udito: string }[];

    if (punti2.length > 1) {
      setDraw(doc, '#1E73BE');
      doc.setLineWidth(0.8);
      for (let i = 0; i < punti2.length - 1; i++) {
        const p1 = punti2[i]; const p2 = punti2[i + 1];
        doc.line(toGX2(freqOrd2.indexOf(p1.hz)), toGY2(p1.db), toGX2(freqOrd2.indexOf(p2.hz)), toGY2(p2.db));
      }
    }
    punti2.forEach(p => {
      const px = toGX2(freqOrd2.indexOf(p.hz));
      const py = toGY2(p.db);
      const col = coloreUdito2(p.udito);
      setFill(doc, col); setDraw(doc, '#FFFFFF');
      doc.setLineWidth(0.5);
      doc.circle(px, py, 2.5, 'FD');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6);
      setColor(doc, col);
      doc.text(`${p.db}`, px, py - 4, { align: 'center' });
    });

    y += gH2 + 14;

    // Legenda
    const legendaA2 = [
      { colore: VERDE, label: 'Normale (<=25 dB)' },
      { colore: GIALLO, label: 'Lieve (26-40 dB)' },
      { colore: '#F97316', label: 'Moderato (41-60 dB)' },
      { colore: ROSSO, label: 'Severo (>60 dB)' },
    ];
    let lxA2 = gX2;
    legendaA2.forEach(l => {
      setFill(doc, l.colore + '60');
      doc.rect(lxA2, y, 6, 4, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
      setColor(doc, GRIGIO_TESTO);
      doc.text(l.label, lxA2 + 8, y + 3.5);
      lxA2 += 44;
    });
    y += 10;

    separatore(doc, y);
    y += 7;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    setColor(doc, GRIGIO_TESTO);
    doc.text('I valori mostrati rappresentano la soglia uditiva indicativa per ciascuna frequenza testata.', 14, y);
    y += 6;
    doc.text('Per una diagnosi accurata rivolgersi a un audioprotesista o specialista ORL.', 14, y);
  }

  disegnaFooter(doc);
  doc.save('UdiTest_Referto_Combinato.pdf');
}
