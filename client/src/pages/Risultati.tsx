// ══════════════════════════════════════════════════════════
// UdiTest — Pagina Risultati
// Mostra il risultato del test vocale.
// Il PDF viene sbloccato DOPO che l'utente compila il form lead.
// ══════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { useStorico } from '@/hooks/useStorico';
import { AlertTriangle, TrendingUp, Award, ChevronRight, FileDown } from 'lucide-react';
import { generaPDFVocale } from '@/lib/generaPDF';
import { useTest } from '@/contexts/TestContext';
import { interpretaSRT50, interpretaPercentuale } from '@/lib/testData';
import AppHeader from '@/components/AppHeader';
import { useAnagrafica } from '@/hooks/useAnagrafica';
import ModalSbloccaReferto, { DatiLead } from '@/components/ModalSbloccaReferto';

const WHATSAPP_NUMERO = '393341990307';

export default function Risultati() {
  const { risultati, resetTest, modalitaTest, faseCompleto, setFaseCompleto, setStep } = useTest();
  const { dati: datiAnagrafica } = useAnagrafica();

  const [mostraModalPDF, setMostraModalPDF] = useState(false);
  const { aggiungiVoce } = useStorico();

  // Salva il risultato nello storico al primo render
  useEffect(() => {
    if (!risultati) return;
    const isSilenzio = risultati.modalita === 'silenzio';
    const interp = isSilenzio
      ? interpretaPercentuale(risultati.percentualeCorrette)
      : interpretaSRT50(risultati.srt50);
    const colore = interp.colore === '#22C55E' ? 'verde' : interp.colore === '#F59E0B' ? 'giallo' : 'rosso';
    const dettaglio = isSilenzio
      ? `${risultati.percentualeCorrette}% parole corrette`
      : `SRT50: ${risultati.srt50 > 0 ? '+' : ''}${risultati.srt50} dB SNR`;
    const numCorrette = Math.round((risultati.percentualeCorrette / 100) * (risultati.numFrasi ?? risultati.risultatiFrasi?.length ?? 14) * 3);
    aggiungiVoce({
      tipo: 'vocale',
      data: Date.now(),
      risultato: interp.titolo,
      colore: colore as 'verde' | 'giallo' | 'rosso',
      dettaglio,
      datiPDFVocale: {
        srt50: isSilenzio ? null : risultati.srt50,
        percentualeCorrette: risultati.percentualeCorrette,
        modalita: risultati.modalita ?? 'completo',
        livelloFinale: risultati.livelloFinale ?? 0,
        numFrasi: risultati.numFrasi ?? risultati.risultatiFrasi?.length ?? 0,
        numCorrette: numCorrette,
        interpretazione: interp.titolo,
        coloreInterpretazione: colore as 'verde' | 'giallo' | 'rosso',
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!risultati) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <p className="text-[#64748B]">Nessun risultato disponibile</p>
      </div>
    );
  }

  const isSilenzio = risultati.modalita === 'silenzio';
  const interpretazione = isSilenzio
    ? interpretaPercentuale(risultati.percentualeCorrette)
    : interpretaSRT50(risultati.percentualeCorrette);

  // Stringa sintetica per il DB — solo valutazione finale, senza dettagli tecnici
  const risultatoSintetico = interpretazione.titolo;
  const tipoTest = isSilenzio ? 'vocale-silenzio' : 'vocale-rumore';

  function generaPDF(datiLead: DatiLead) {
    // Usa i dati del lead come dati paziente per il PDF
    const paziente = {
      nome: datiLead.nome,
      cognome: datiLead.cognome,
      dataNascita: datiAnagrafica.dataNascita,
      comune: datiAnagrafica.comune,
      cellulare: datiLead.cellulare,
      ricordaDati: false,
    };
    generaPDFVocale({
      srt50: risultati!.srt50,
      percentualeCorrette: risultati!.percentualeCorrette,
      modalita: risultati!.modalita ?? 'Completo',
      livelloFinale: risultati!.livelloFinale ?? risultati!.srt50 ?? 0,
      numFrasi: risultati!.numFrasi ?? risultati!.risultatiFrasi.length,
      numCorrette: risultati!.numCorrette ?? Math.round(
        risultati!.risultatiFrasi.reduce((a, f) => a + f.corrette, 0) /
        Math.max(1, risultati!.risultatiFrasi.reduce((a, f) => a + f.totale, 0)) *
        risultati!.risultatiFrasi.length
      ),
      interpretazione: interpretazione.titolo + ' — ' + interpretazione.descrizione,
      coloreInterpretazione: interpretazione.colore === '#22C55E' ? 'verde' : interpretazione.colore === '#F59E0B' ? 'giallo' : 'rosso',
      paziente,
    });
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <AppHeader
        title="I tuoi Risultati"
        subtitle="Test di Discriminazione Vocale"
      />

      <div className="flex-1 overflow-y-auto">
        <div className="container py-6 space-y-5 animate-fade-in-up">

          {/* ── SCORE PRINCIPALE ── */}
          <div className="card-voicecheck text-center py-8">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
              style={{ backgroundColor: interpretazione.colore + '20', border: `3px solid ${interpretazione.colore}` }}
            >
              <Award size={44} color={interpretazione.colore} />
            </div>
            <h2 className="text-2xl font-extrabold text-[#1E293B] mb-1">
              {interpretazione.titolo}
            </h2>
            <p className="text-[#64748B] text-base mb-4">{interpretazione.descrizione}</p>
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-extrabold" style={{ color: interpretazione.colore }}>
                  {risultati.percentualeCorrette}%
                </p>
                <p className="text-[#64748B] text-sm">Parole comprese</p>
              </div>
            </div>
          </div>

          {/* ── GRAFICO (test nel rumore) ── */}
          {!isSilenzio && (
            <div className="card-voicecheck">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={20} color="#1E73BE" />
                <h3 className="font-extrabold text-[#1E293B] text-base">Parole comprese nel rumore</h3>
              </div>
              <div className="mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-bold text-[#1E293B]">Il tuo risultato</span>
                  <span className="text-sm font-bold" style={{ color: interpretazione.colore }}>
                    {risultati.percentualeCorrette}%
                  </span>
                </div>
                <div className="relative h-6 rounded-full overflow-visible" style={{ background: 'linear-gradient(to right, #EF4444 0%, #EF4444 40%, #F97316 40%, #F97316 60%, #F59E0B 60%, #F59E0B 80%, #22C55E 80%, #22C55E 100%)' }}>
                  <div
                    className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
                    style={{ left: `${risultati.percentualeCorrette}%` }}
                  >
                    <div style={{ width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '10px solid white', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />
                    <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '7px solid #1E293B', marginTop: '-9px' }} />
                  </div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-[#EF4444] font-bold">&lt;40% Significativo</span>
                  <span className="text-[10px] text-[#F59E0B] font-bold">60-79% Lieve</span>
                  <span className="text-[10px] text-[#22C55E] font-bold">≥80% Norma</span>
                </div>
              </div>
            </div>
          )}

          {/* ── GRAFICO (test in silenzio) ── */}
          {isSilenzio && (
            <div className="card-voicecheck">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={20} color="#1E73BE" />
                <h3 className="font-extrabold text-[#1E293B] text-base">Parole comprese</h3>
              </div>
              <div className="mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-bold text-[#1E293B]">Il tuo risultato</span>
                  <span className="text-sm font-bold" style={{ color: interpretazione.colore }}>
                    {risultati.percentualeCorrette}%
                  </span>
                </div>
                <div className="w-full bg-[#D6E9F8] rounded-full h-5">
                  <div
                    className="h-5 rounded-full transition-all duration-1000"
                    style={{ width: `${risultati.percentualeCorrette}%`, backgroundColor: interpretazione.colore }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-[#64748B]">Norma attesa</span>
                  <span className="text-sm text-[#64748B]">≥90%</span>
                </div>
                <div className="w-full bg-[#D6E9F8] rounded-full h-4">
                  <div className="h-4 rounded-full bg-[#22C55E]" style={{ width: '90%' }} />
                </div>
              </div>
              <p className="text-[#64748B] text-xs mt-3">
                * In condizioni di silenzio, un normoudente comprende almeno il 90% delle parole.
              </p>
            </div>
          )}

          {/* ── CONSIGLIO ── */}
          <div
            className="rounded-2xl p-4 border-2"
            style={{ backgroundColor: interpretazione.colore + '15', borderColor: interpretazione.colore + '40' }}
          >
            <p className="font-bold text-[#1E293B] text-base">{interpretazione.consiglio}</p>
          </div>

          {/* ── Card di Conversione: Prenota + WhatsApp ── */}
          <div
            className="rounded-2xl overflow-hidden shadow-md"
            style={{ background: 'linear-gradient(135deg, #1E73BE 0%, #0F4C81 100%)' }}
          >
            <div className="px-5 pt-4 pb-3">
              <p className="font-extrabold text-white text-base leading-tight">Valutazione professionale</p>
              <p className="text-blue-200 text-sm mt-0.5">Con strumentazione audiometrica calibrata</p>
            </div>
            <div className="px-4 pb-4">
              <a
                href="https://www.acusticadimaio.it/contatta-e-prenota/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-[#0F4C81] text-base bg-white transition-all active:scale-95"
              >
                Prenota Ora
                <ChevronRight size={18} />
              </a>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent('Ciao, ho appena fatto il test vocale su UdiTest di Acustica Di Maio. Vorrei prenotare una visita o ricevere informazioni.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-white/10 px-5 py-2.5 transition-all active:opacity-80"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <span className="text-white/80 text-sm">Hai domande? <span className="font-semibold text-white">+39 334 199 0307</span></span>
            </a>
          </div>

          {/* ── DISCLAIMER ── */}
          <div className="rounded-2xl border-2 border-[#F59E0B] bg-[#FFFBEB] p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} color="#F59E0B" className="flex-shrink-0 mt-0.5" />
              <p className="text-[#92400E] text-sm leading-relaxed">
                <strong>Solo screening.</strong> Questo risultato non costituisce diagnosi medica
                e non sostituisce una valutazione audiologica professionale eseguita con
                strumentazione calibrata. Rivolgiti ad un audioprotesista o audiometrista qualificato.
              </p>
            </div>
          </div>

          {/* ── PULSANTI DOCUMENTI ── */}
          <div className="grid grid-cols-2 gap-3">
            {/* Sblocca e scarica PDF */}
            <button
              onClick={() => setMostraModalPDF(true)}
              className="py-4 rounded-2xl font-extrabold text-base flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
              style={{ backgroundColor: '#1E73BE', color: 'white' }}
            >
              <FileDown size={22} />
              <span className="text-sm leading-tight text-center">Sblocca il referto</span>
            </button>

            {/* Condividi su WhatsApp */}
            <button
              onClick={() => {
                const livello = interpretazione.titolo;
                const dataStr = new Date().toLocaleDateString('it-IT');
                let testo = `Ho fatto il test dell'udito su UdiTest di Acustica Di Maio.`;
                testo += `\n\nRisultato (${dataStr}): ${livello} — ${risultati!.percentualeCorrette}%`;
                testo += `\n\nPer una valutazione professionale: https://www.acusticadimaio.it/contatta-e-prenota/`;
                window.open(`https://wa.me/?text=${encodeURIComponent(testo)}`, '_blank');
              }}
              className="py-4 rounded-2xl font-extrabold text-base flex flex-col items-center justify-center gap-2 transition-all active:scale-95 bg-white"
              style={{ color: '#25D366', border: '2px solid #25D366' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <span className="text-sm leading-tight text-center">Condividi</span>
            </button>
          </div>

          {/* ── Continua con test in silenzio (solo flusso completo fase 1) ── */}
          {modalitaTest === 'completo' && faseCompleto === 1 && (
            <button
              onClick={() => {
                setFaseCompleto(2);
                setStep('test');
              }}
              className="w-full py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
              style={{ backgroundColor: '#22C55E', color: 'white' }}
            >
              Continua: Test in Silenzio
              <ChevronRight size={20} />
            </button>
          )}

          {/* ── Torna alla home ── */}
          <div className="pb-6">
            <button
              className="w-full py-3 text-center text-sm font-medium text-[#64748B] hover:text-[#1E293B] transition-colors"
              onClick={resetTest}
            >
              ← Torna alla home
            </button>
          </div>
        </div>
      </div>

      {/* ══ MODAL SBLOCCA REFERTO ══ */}
      {mostraModalPDF && (
        <ModalSbloccaReferto
          tipoTest={tipoTest}
          risultatoSintetico={risultatoSintetico}
          datiPrecompilati={{
            nome: datiAnagrafica.nome,
            cognome: datiAnagrafica.cognome,
            cellulare: datiAnagrafica.cellulare,
          }}
          onAnnulla={() => setMostraModalPDF(false)}
          onConferma={(datiLead) => {
            setMostraModalPDF(false);
            generaPDF(datiLead);
          }}
        />
      )}
    </div>
  );
}
