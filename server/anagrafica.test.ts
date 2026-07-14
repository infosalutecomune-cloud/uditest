// Test per la logica dell'anagrafica paziente
import { describe, it, expect, beforeEach } from 'vitest';

// Simula la logica di salvataggio/caricamento dell'anagrafica
const STORAGE_KEY = 'uditofacile_anagrafica';

interface DatiAnagrafica {
  nome: string;
  cognome: string;
  dataNascita: string;
  comune: string;
  ricordaDati: boolean;
}

const VUOTO: DatiAnagrafica = {
  nome: '',
  cognome: '',
  dataNascita: '',
  comune: '',
  ricordaDati: false,
};

function salvaSuStorage(dati: DatiAnagrafica, storage: Map<string, string>) {
  if (dati.ricordaDati) {
    storage.set(STORAGE_KEY, JSON.stringify(dati));
  } else {
    storage.delete(STORAGE_KEY);
  }
}

function caricaDaStorage(storage: Map<string, string>): DatiAnagrafica {
  try {
    const raw = storage.get(STORAGE_KEY);
    if (!raw) return VUOTO;
    const parsed = JSON.parse(raw);
    return { ...VUOTO, ...parsed };
  } catch {
    return VUOTO;
  }
}

describe('Anagrafica paziente - logica storage', () => {
  let storage: Map<string, string>;

  beforeEach(() => {
    storage = new Map();
  });

  it('restituisce dati vuoti se storage è vuoto', () => {
    const dati = caricaDaStorage(storage);
    expect(dati.nome).toBe('');
    expect(dati.cognome).toBe('');
    expect(dati.ricordaDati).toBe(false);
  });

  it('salva i dati se ricordaDati è true', () => {
    const dati: DatiAnagrafica = {
      nome: 'Mario',
      cognome: 'Rossi',
      dataNascita: '1960-05-15',
      comune: 'Napoli',
      ricordaDati: true,
    };
    salvaSuStorage(dati, storage);
    expect(storage.has(STORAGE_KEY)).toBe(true);
    const caricati = caricaDaStorage(storage);
    expect(caricati.nome).toBe('Mario');
    expect(caricati.cognome).toBe('Rossi');
    expect(caricati.comune).toBe('Napoli');
  });

  it('NON salva i dati se ricordaDati è false', () => {
    const dati: DatiAnagrafica = {
      nome: 'Mario',
      cognome: 'Rossi',
      dataNascita: '1960-05-15',
      comune: 'Napoli',
      ricordaDati: false,
    };
    salvaSuStorage(dati, storage);
    expect(storage.has(STORAGE_KEY)).toBe(false);
  });

  it('rimuove i dati salvati se ricordaDati viene disattivato', () => {
    // Prima salva con ricordaDati=true
    salvaSuStorage({ nome: 'Mario', cognome: 'Rossi', dataNascita: '', comune: '', ricordaDati: true }, storage);
    expect(storage.has(STORAGE_KEY)).toBe(true);
    // Poi aggiorna con ricordaDati=false
    salvaSuStorage({ nome: 'Mario', cognome: 'Rossi', dataNascita: '', comune: '', ricordaDati: false }, storage);
    expect(storage.has(STORAGE_KEY)).toBe(false);
  });

  it('hasDati è true se nome o cognome sono presenti', () => {
    const datiConNome: DatiAnagrafica = { ...VUOTO, nome: 'Mario', ricordaDati: true };
    const datiVuoti: DatiAnagrafica = { ...VUOTO };
    const hasDatiConNome = datiConNome.nome.trim() !== '' || datiConNome.cognome.trim() !== '';
    const hasDatiVuoti = datiVuoti.nome.trim() !== '' || datiVuoti.cognome.trim() !== '';
    expect(hasDatiConNome).toBe(true);
    expect(hasDatiVuoti).toBe(false);
  });

  it('formatta correttamente la data di nascita per il PDF', () => {
    const iso = '1960-05-15';
    const [yr, mo, dy] = iso.split('-');
    const formatted = `${dy}/${mo}/${yr}`;
    expect(formatted).toBe('15/05/1960');
  });
});
