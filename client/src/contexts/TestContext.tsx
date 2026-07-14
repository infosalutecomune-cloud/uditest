// ══════════════════════════════════════════════════════════
// UdiTest — Contesto globale stato test
// Gestisce: modalità audio, step corrente, risultati SNR
// ══════════════════════════════════════════════════════════
import React, { createContext, useContext, useState, useCallback } from 'react';

export type ModalitaAudio = 'cuffie' | 'speaker' | null;
export type ModalitaTest = 'silenzio' | 'rumore' | 'completo' | null;
export type FaseCompleto = 1 | 2 | null; // 1 = rumore, 2 = silenzio
export type StepApp = 'home' | 'scelta-test' | 'scelta-audio' | 'calibrazione' | 'calibrazione-tonale' | 'test' | 'risultati' | 'audiometria' | 'privacy' | 'intro-vocale' | 'intro-tonale' | 'anagrafica' | 'storico' | 'privacy-policy' | 'cookie-policy';

export interface RisultatoFrase {
  fraseIndex: number;
  snrDb: number;
  paroleDette: string[];
  paroleCorrette: string[];
  corrette: number;
  totale: number;
}

export interface RisultatiTest {
  modalita: ModalitaTest;
  srt50: number;
  percentualeCorrette: number;
  risultatiFrasi: RisultatoFrase[];
  dataTest: Date;
  livelloFinale?: number;
  numFrasi?: number;
  numCorrette?: number;
}

interface TestContextType {
  step: StepApp;
  setStep: (s: StepApp) => void;
  modalitaAudio: ModalitaAudio;
  setModalitaAudio: (m: ModalitaAudio) => void;
  modalitaTest: ModalitaTest;
  setModalitaTest: (m: ModalitaTest) => void;
  risultati: RisultatiTest | null;
  setRisultati: (r: RisultatiTest) => void;
  resetTest: () => void;
  faseCompleto: FaseCompleto;
  setFaseCompleto: (f: FaseCompleto) => void;
}

const TestContext = createContext<TestContextType | null>(null);

export function TestProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<StepApp>('home');
  const [modalitaAudio, setModalitaAudio] = useState<ModalitaAudio>(null);
  const [modalitaTest, setModalitaTest] = useState<ModalitaTest>(null);
  const [risultati, setRisultati] = useState<RisultatiTest | null>(null);
  const [faseCompleto, setFaseCompleto] = useState<FaseCompleto>(null);

  const resetTest = useCallback(() => {
    setStep('home');
    setModalitaAudio(null);
    setModalitaTest(null);
    setRisultati(null);
    setFaseCompleto(null);
  }, []);

  return (
    <TestContext.Provider value={{
      step, setStep,
      modalitaAudio, setModalitaAudio,
      modalitaTest, setModalitaTest,
      risultati, setRisultati,
      resetTest,
      faseCompleto, setFaseCompleto,
    }}>
      {children}
    </TestContext.Provider>
  );
}

export function useTest() {
  const ctx = useContext(TestContext);
  if (!ctx) throw new Error('useTest deve essere usato dentro TestProvider');
  return ctx;
}
