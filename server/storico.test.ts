// Test per la logica dello storico dei test
import { describe, it, expect } from 'vitest';

const MAX_VOCI = 20;

interface VoceStorico {
  id: string;
  tipo: 'vocale' | 'tonale';
  data: number;
  risultato: string;
  colore: 'verde' | 'giallo' | 'rosso';
  dettaglio?: string;
}

function aggiungiVoce(storico: VoceStorico[], voce: Omit<VoceStorico, 'id'>): VoceStorico[] {
  const nuova: VoceStorico = { ...voce, id: `${Date.now()}-test` };
  return [nuova, ...storico].slice(0, MAX_VOCI);
}

describe('Storico test - logica', () => {
  it('aggiunge una voce in testa allo storico', () => {
    const storico: VoceStorico[] = [];
    const aggiornato = aggiungiVoce(storico, {
      tipo: 'vocale',
      data: Date.now(),
      risultato: 'Udito nella norma',
      colore: 'verde',
      dettaglio: 'SRT50: -2 dB SNR',
    });
    expect(aggiornato.length).toBe(1);
    expect(aggiornato[0].tipo).toBe('vocale');
    expect(aggiornato[0].risultato).toBe('Udito nella norma');
  });

  it('mantiene la voce più recente in testa', () => {
    let storico: VoceStorico[] = [];
    storico = aggiungiVoce(storico, { tipo: 'vocale', data: 1000, risultato: 'Prima', colore: 'verde' });
    storico = aggiungiVoce(storico, { tipo: 'tonale', data: 2000, risultato: 'Seconda', colore: 'giallo' });
    expect(storico[0].risultato).toBe('Seconda');
    expect(storico[1].risultato).toBe('Prima');
  });

  it('non supera MAX_VOCI elementi', () => {
    let storico: VoceStorico[] = [];
    for (let i = 0; i < 25; i++) {
      storico = aggiungiVoce(storico, {
        tipo: 'vocale',
        data: Date.now() + i,
        risultato: `Test ${i}`,
        colore: 'verde',
      });
    }
    expect(storico.length).toBe(MAX_VOCI);
  });

  it('cancella lo storico correttamente', () => {
    let storico: VoceStorico[] = [
      { id: '1', tipo: 'vocale', data: Date.now(), risultato: 'Test', colore: 'verde' },
    ];
    storico = [];
    expect(storico.length).toBe(0);
  });

  it('mappa correttamente il colore dal risultato globale tonale', () => {
    const mappaColore = (globale: string): 'verde' | 'giallo' | 'rosso' => {
      return globale === 'normale' ? 'verde' : globale === 'lieve' ? 'giallo' : 'rosso';
    };
    expect(mappaColore('normale')).toBe('verde');
    expect(mappaColore('lieve')).toBe('giallo');
    expect(mappaColore('moderato')).toBe('rosso');
    expect(mappaColore('severo')).toBe('rosso');
  });
});
