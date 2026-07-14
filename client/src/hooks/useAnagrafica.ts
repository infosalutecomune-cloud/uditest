// ══════════════════════════════════════════════════════════
// UdiTest — Hook anagrafica paziente
// Salva/carica nome, cognome, data di nascita, comune in localStorage
// ══════════════════════════════════════════════════════════
import { useState, useCallback } from 'react';

const STORAGE_KEY = 'uditofacile_anagrafica';

export interface DatiAnagrafica {
  nome: string;
  cognome: string;
  dataNascita: string; // formato YYYY-MM-DD
  comune: string;
  cellulare: string;
  ricordaDati: boolean;
}

const VUOTO: DatiAnagrafica = {
  nome: '',
  cognome: '',
  dataNascita: '',
  comune: '',
  cellulare: '',
  ricordaDati: false,
};

function caricaDaStorage(): DatiAnagrafica {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return VUOTO;
    const parsed = JSON.parse(raw);
    return { ...VUOTO, ...parsed };
  } catch {
    return VUOTO;
  }
}

function salvaSuStorage(dati: DatiAnagrafica) {
  try {
    if (dati.ricordaDati) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dati));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch { /* storage non disponibile */ }
}

export function useAnagrafica() {
  const [dati, setDati] = useState<DatiAnagrafica>(() => caricaDaStorage());

  const aggiorna = useCallback((nuovi: Partial<DatiAnagrafica>) => {
    setDati(prev => {
      const aggiornati = { ...prev, ...nuovi };
      salvaSuStorage(aggiornati);
      return aggiornati;
    });
  }, []);

  const salva = useCallback((nuovi: DatiAnagrafica) => {
    salvaSuStorage(nuovi);
    setDati(nuovi);
  }, []);

  const hasDati = dati.nome.trim() !== '' || dati.cognome.trim() !== '';

  return { dati, aggiorna, salva, hasDati };
}
