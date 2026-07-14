// ══════════════════════════════════════════════════════════
// UdiTest — Storico Esami
// Lista degli esami salvati in localStorage
// Ogni voce mostra tipo, data, risultato e permette di
// rigenerare il PDF del singolo esame
// ══════════════════════════════════════════════════════════
import { useState } from 'react';
import { ChevronLeft, FileDown, Trash2, Mic, Music, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useTest } from '@/contexts/TestContext';
import { useStorico, VoceStorico } from '@/hooks/useStorico';
import { generaPDFVocale, generaPDFTonale, generaPDFCombinato } from '@/lib/generaPDF';
import { useAnagrafica } from '@/hooks/useAnagrafica';
import ModalConfermaAnagrafica from '@/components/ModalConfermaAnagrafica';

const COLORE_BG: Record<string, string> = {
  verde:  '#F0FDF4',
  giallo: '#FFFBEB',
  rosso:  '#FEF2F2',
};
const COLORE_BORDO: Record<string, string> = {
  verde:  '#22C55E',
  giallo: '#F59E0B',
  rosso:  '#EF4444',
};
const COLORE_TESTO: Record<string, string> = {
  verde:  '#166534',
  giallo: '#92400E',
  rosso:  '#991B1B',
};

function formatData(ts: number): string {
  return new Date(ts).toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function Storico() {
  const { setStep } = useTest();
  const { storico, cancellaStorico, cancellaVoce } = useStorico();
  const { dati: datiAnagrafica } = useAnagrafica();
  const [espanso, setEspanso] = useState<string | null>(null);
  const [mostraConfermaAnnulla, setMostraConfermaAnnulla] = useState(false);
  const [vociDaEliminare, setVociDaEliminare] = useState<string | 'tutti' | null>(null);
  const [vocePerPDF, setVocePerPDF] = useState<VoceStorico | null>(null);

  // Distingui vocale silenzio da vocale rumore per il PDF combinato
  const ultimoVocaleRumore = storico.find(v => v.tipo === 'vocale' && v.datiPDFVocale && v.datiPDFVocale.modalita !== 'silenzio');
  const ultimoVocaleSilenzio = storico.find(v => v.tipo === 'vocale' && v.datiPDFVocale && v.datiPDFVocale.modalita === 'silenzio');
  const ultimoTonale = storico.find(v => v.tipo === 'tonale' && v.datiPDFTonale);
  // Può combinare se c'è almeno un vocale (silenzio o rumore) + tonale
  const puoCombinare = !!((ultimoVocaleRumore || ultimoVocaleSilenzio) && ultimoTonale);
  const numEsamiCombinati = (ultimoVocaleSilenzio ? 1 : 0) + (ultimoVocaleRumore ? 1 : 0) + (ultimoTonale ? 1 : 0);

  const [modoPDF, setModoPDF] = useState<'singolo' | 'combinato' | null>(null);

  const handleGeneraPDF = (voce: VoceStorico) => {
    setVocePerPDF(voce);
    setModoPDF('singolo');
  };

  const handleGeneraCombinato = () => {
    setVocePerPDF(null);
    setModoPDF('combinato');
  };

  const eseguiPDF = (datiPaziente: { nome?: string; cognome?: string; dataNascita?: string; comune?: string; cellulare?: string }) => {
    if (modoPDF === 'combinato') {
      generaPDFCombinato({
        vocaleSilenzio: ultimoVocaleSilenzio?.datiPDFVocale,
        vocale: ultimoVocaleRumore?.datiPDFVocale,
        tonale: ultimoTonale?.datiPDFTonale,
        paziente: datiPaziente,
      });
    } else if (vocePerPDF) {
      if (vocePerPDF.tipo === 'vocale' && vocePerPDF.datiPDFVocale) {
        generaPDFVocale({ ...vocePerPDF.datiPDFVocale, paziente: datiPaziente });
      } else if (vocePerPDF.tipo === 'tonale' && vocePerPDF.datiPDFTonale) {
        generaPDFTonale({ ...vocePerPDF.datiPDFTonale, paziente: datiPaziente });
      }
    }
    setVocePerPDF(null);
    setModoPDF(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">

      {/* ── HEADER ── */}
      <div className="bg-white border-b border-[#D6E9F8] sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3 w-full max-w-[480px] mx-auto px-4 py-3">
          <button
            onClick={() => setStep('home')}
            className="p-2 rounded-xl hover:bg-[#F1F5F9] transition-all active:scale-95"
          >
            <ChevronLeft size={22} color="#1E73BE" />
          </button>
          <div className="flex-1">
            <h1 className="font-extrabold text-[#1E293B] text-lg leading-tight">Storico Esami</h1>
            <p className="text-[#64748B] text-xs">{storico.length} esame{storico.length !== 1 ? 'i' : ''} salvat{storico.length !== 1 ? 'i' : 'o'}</p>
          </div>
          {storico.length > 0 && (
            <button
              onClick={() => setVociDaEliminare('tutti')}
              className="p-2 rounded-xl hover:bg-[#FEF2F2] transition-all active:scale-95"
              title="Cancella tutto lo storico"
            >
              <Trash2 size={20} color="#EF4444" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container py-5 space-y-3 max-w-[480px] mx-auto">

          {/* ── Banner PDF Combinato (se ci sono sia vocale che tonale) ── */}
          {puoCombinare && (
            <div className="rounded-2xl border-2 border-[#1E73BE] bg-[#EBF4FC] p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#1E73BE] flex items-center justify-center flex-shrink-0">
                  <FileDown size={20} color="white" />
                </div>
                <div>
                  <p className="font-extrabold text-[#1E293B] text-sm leading-tight">Referto Completo</p>
                  <p className="text-[#64748B] text-xs mt-0.5">
                    Genera un unico PDF con {numEsamiCombinati} esami: {[ultimoVocaleSilenzio && 'Vocale Silenzio', ultimoVocaleRumore && 'Vocale Rumore', ultimoTonale && 'Tonale'].filter(Boolean).join(' + ')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleGeneraCombinato}
                className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ backgroundColor: '#1E73BE' }}
              >
                <FileDown size={16} />
                Scarica Referto Combinato ({numEsamiCombinati} esami)
              </button>
            </div>
          )}

          {storico.length === 0 && (
            <div className="card-voicecheck text-center py-14">
              <AlertCircle size={48} color="#94A3B8" className="mx-auto mb-4" />
              <p className="font-bold text-[#1E293B] text-lg mb-1">Nessun esame salvato</p>
              <p className="text-[#64748B] text-sm">
                I risultati dei test vengono salvati automaticamente al completamento.
              </p>
              <button
                onClick={() => setStep('home')}
                className="mt-6 px-6 py-3 rounded-2xl font-bold text-white text-sm transition-all active:scale-95"
                style={{ backgroundColor: '#1E73BE' }}
              >
                Torna alla home
              </button>
            </div>
          )}

          {storico.map((voce) => {
            const aperto = espanso === voce.id;
            const hasPDF = (voce.tipo === 'vocale' && !!voce.datiPDFVocale) ||
                           (voce.tipo === 'tonale' && !!voce.datiPDFTonale);
            return (
              <div
                key={voce.id}
                className="rounded-2xl border-2 overflow-hidden bg-white shadow-sm"
                style={{ borderColor: COLORE_BORDO[voce.colore] }}
              >
                {/* Riga principale */}
                <button
                  className="w-full flex items-center gap-3 p-4 text-left transition-all active:scale-[0.99]"
                  onClick={() => setEspanso(aperto ? null : voce.id)}
                >
                  {/* Icona tipo */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: COLORE_BG[voce.colore] }}
                  >
                    {voce.tipo === 'vocale'
                      ? <Mic size={20} color={COLORE_BORDO[voce.colore]} />
                      : <Music size={20} color={COLORE_BORDO[voce.colore]} />
                    }
                  </div>
                  {/* Testo */}
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-[#1E293B] text-sm leading-tight">
                      {voce.tipo === 'vocale' ? 'Test Vocale' : 'Test Tonale'}
                    </p>
                    <p
                      className="font-semibold text-xs mt-0.5"
                      style={{ color: COLORE_TESTO[voce.colore] }}
                    >
                      {voce.risultato}
                    </p>
                    <p className="text-[#94A3B8] text-xs mt-0.5">{formatData(voce.data)}</p>
                  </div>
                  {/* Chevron */}
                  {aperto
                    ? <ChevronUp size={18} color="#94A3B8" />
                    : <ChevronDown size={18} color="#94A3B8" />
                  }
                </button>

                {/* Dettaglio espanso */}
                {aperto && (
                  <div
                    className="px-4 pb-4 space-y-3 border-t"
                    style={{ borderColor: COLORE_BORDO[voce.colore] + '44' }}
                  >
                    {voce.dettaglio && (
                      <p className="text-[#64748B] text-xs pt-3 leading-relaxed font-mono">
                        {voce.dettaglio}
                      </p>
                    )}
                    <div className="flex gap-2 pt-1">
                      {hasPDF && (
                        <button
                          onClick={() => handleGeneraPDF(voce)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
                          style={{ backgroundColor: '#1E73BE' }}
                        >
                          <FileDown size={16} />
                          Scarica PDF
                        </button>
                      )}
                      <button
                        onClick={() => setVociDaEliminare(voce.id)}
                        className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl font-bold text-sm border-2 border-[#EF4444] text-[#EF4444] bg-white transition-all active:scale-95"
                      >
                        <Trash2 size={15} />
                        Elimina
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </div>

      {/* ── DIALOG CONFERMA ELIMINA ── */}
      {vociDaEliminare && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <Trash2 size={28} color="#EF4444" />
              </div>
              <h3 className="font-extrabold text-[#1E293B] text-lg mb-2">
                {vociDaEliminare === 'tutti' ? 'Cancellare tutto lo storico?' : 'Eliminare questo esame?'}
              </h3>
              <p className="text-[#64748B] text-sm">
                {vociDaEliminare === 'tutti'
                  ? 'Tutti gli esami salvati verranno rimossi definitivamente.'
                  : 'Questo esame verrà rimosso definitivamente.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-2xl font-bold text-sm border-2 border-[#D6E9F8] text-[#64748B] bg-white transition-all active:scale-95"
                onClick={() => setVociDaEliminare(null)}
              >
                Annulla
              </button>
              <button
                className="flex-1 py-3 rounded-2xl font-bold text-sm text-white transition-all active:scale-95"
                style={{ backgroundColor: '#EF4444' }}
                onClick={() => {
                  if (vociDaEliminare === 'tutti') {
                    cancellaStorico();
                  } else {
                    cancellaVoce(vociDaEliminare);
                  }
                  setVociDaEliminare(null);
                  setEspanso(null);
                }}
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CONFERMA ANAGRAFICA PER PDF (singolo o combinato) ── */}
      {(vocePerPDF || modoPDF === 'combinato') && (
        <ModalConfermaAnagrafica
          datiIniziali={datiAnagrafica}
          onConferma={eseguiPDF}
          onAnnulla={() => { setVocePerPDF(null); setModoPDF(null); }}
        />
      )}
    </div>
  );
}
