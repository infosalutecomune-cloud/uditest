// ══════════════════════════════════════════════════════════
// UdiTest — Hook useStorico
// Salva/carica lo storico dei test in localStorage
// Versione 2: include payload completo per rigenerare il PDF
// ══════════════════════════════════════════════════════════
import { useState, useCallback } from 'react';
import type { DatiPDFVocale, DatiPDFTonale } from '@/lib/generaPDF';

const STORAGE_KEY = 'uditofacile_storico';
const MAX_VOCI = 30;

export type TipoTest = 'vocale' | 'tonale';

export interface VoceStorico {
  id: string;
  tipo: TipoTest;
  data: number; // timestamp UTC ms
  risultato: string; // es. "Udito nella norma", "Lieve difficoltà", ecc.
  colore: 'verde' | 'giallo' | 'rosso';
  dettaglio?: string; // es. "SRT50: -2 dB SNR" oppure "Soglie: 500Hz normale, 4000Hz lieve"
  // Payload completo per rigenerare il PDF
  datiPDFVocale?: DatiPDFVocale;
  datiPDFTonale?: DatiPDFTonale;
}

function caricaDaStorage(): VoceStorico[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as VoceStorico[];
  } catch {
    return [];
  }
}

function salvaSuStorage(voci: VoceStorico[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(voci));
  } catch {
    // localStorage pieno o non disponibile — ignora silenziosamente
  }
}

export function useStorico() {
  const [storico, setStorico] = useState<VoceStorico[]>(() => caricaDaStorage());

  const aggiungiVoce = useCallback((voce: Omit<VoceStorico, 'id'>) => {
    setStorico(prev => {
      const nuova: VoceStorico = {
        ...voce,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      };
      // Inserisci in testa, mantieni max MAX_VOCI
      const aggiornato = [nuova, ...prev].slice(0, MAX_VOCI);
      salvaSuStorage(aggiornato);
      return aggiornato;
    });
  }, []);

  const cancellaStorico = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStorico([]);
  }, []);

  const cancellaVoce = useCallback((id: string) => {
    setStorico(prev => {
      const aggiornato = prev.filter(v => v.id !== id);
      salvaSuStorage(aggiornato);
      return aggiornato;
    });
  }, []);

  return { storico, aggiungiVoce, cancellaStorico, cancellaVoce };
}
