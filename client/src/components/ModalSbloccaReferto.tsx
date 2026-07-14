// ══════════════════════════════════════════════════════════
// UdiTest — Modal "Sblocca il tuo referto"
// Appare DOPO il test, prima di generare il PDF.
// Raccoglie: nome, cognome, email, cellulare + 3 consensi GDPR.
// Salva lead nel DB via tRPC e genera il PDF solo al submit.
// ══════════════════════════════════════════════════════════
import { useState } from 'react';
import { User, Mail, Phone, Check, Lock, FileDown, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useTest } from '../contexts/TestContext';

export interface DatiLead {
  nome: string;
  cognome: string;
  email: string;
  cellulare: string;
  citta: string;
  provincia: string;
  consensoPrivacy: boolean;
  consensoMarketing: boolean;
  consensoCessione: boolean;
}

interface Props {
  /** Tipo di test completato, per il DB */
  tipoTest: string;
  /** Risultato sintetico, es. "Nella norma — 92%" */
  risultatoSintetico: string;
  /** Dati già salvati in localStorage (pre-compilazione) */
  datiPrecompilati?: Partial<DatiLead>;
  /** Chiamata quando l'utente ha completato il form e il lead è salvato */
  onConferma: (dati: DatiLead) => void;
  /** Chiamata se l'utente chiude il modal senza compilare */
  onAnnulla: () => void;
}

const STORAGE_KEY = 'udiTest_lead';

function caricaDaStorage(): Partial<DatiLead> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function salvaSuStorage(dati: DatiLead) {
  try {
    // Salva tutto tranne i consensi (che vanno richiesti ogni volta)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      nome: dati.nome,
      cognome: dati.cognome,
      email: dati.email,
      cellulare: dati.cellulare,
      citta: dati.citta,
      provincia: dati.provincia,
    }));
  } catch { /* storage non disponibile */ }
}

export function haCompilato(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    return !!(d.email && d.email.trim());
  } catch { return false; }
}

// Contenuto sintetico della privacy policy da mostrare nell'overlay
function PrivacyPolicyContent() {
  return (
    <div className="px-4 py-4 space-y-4 text-xs text-gray-700 leading-relaxed">
      <p className="text-[10px] text-gray-400">Ultimo aggiornamento: maggio 2026</p>
      <section>
        <h3 className="font-bold text-gray-900 text-sm mb-1">Titolare del Trattamento</h3>
        <p><strong>Acustica Di Maio</strong> — Torre Annunziata (NA), P.IVA 09539631219<br />
        Email: <a href="mailto:info@acusticadimaio.it" className="text-[#1E73BE] underline">info@acusticadimaio.it</a></p>
      </section>
      <section>
        <h3 className="font-bold text-gray-900 text-sm mb-1">Dati raccolti</h3>
        <p>Nome, cognome, email, cellulare, risultati del test uditivo, dati tecnici (IP, dispositivo).</p>
      </section>
      <section>
        <h3 className="font-bold text-gray-900 text-sm mb-1">Finalità del trattamento</h3>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Erogazione del servizio</strong>: generazione del referto PDF (base: esecuzione contratto).</li>
          <li><strong>Marketing Acustica Di Maio</strong>: solo con consenso esplicito (facoltativo).</li>
          <li><strong>Cessione a centri acustici partner</strong>: solo con consenso esplicito (facoltativo). I dati vengono condivisi con audioprotesisti e centri acustici per ricevere preventivi e offerte.</li>
        </ul>
      </section>
      <section>
        <h3 className="font-bold text-gray-900 text-sm mb-1">Conservazione</h3>
        <p>I dati sono conservati per 24 mesi dalla data del test, salvo diversa richiesta.</p>
      </section>
      <section>
        <h3 className="font-bold text-gray-900 text-sm mb-1">I tuoi diritti (GDPR artt. 15-22)</h3>
        <p>Hai diritto di accesso, rettifica, cancellazione, limitazione, portabilità e opposizione al trattamento. Per esercitarli: <a href="mailto:info@acusticadimaio.it" className="text-[#1E73BE] underline">info@acusticadimaio.it</a>. Puoi inoltre proporre reclamo al Garante Privacy (www.garanteprivacy.it).</p>
      </section>
      <p className="text-[10px] text-gray-400 border-t pt-2">I dati non vengono venduti a terzi senza il tuo consenso esplicito e non vengono trasferiti fuori dallo Spazio Economico Europeo.</p>
    </div>
  );
}

// Piccolo componente per il link privacy: apre overlay senza perdere il flusso
function PrivacyLink({ onAnnulla: _onAnnulla }: { onAnnulla: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="text-[#1E73BE] underline font-medium"
        onClick={e => { e.stopPropagation(); setOpen(true); }}
      >
        Leggi l'informativa
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center p-0"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-2xl max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#1E73BE] text-white px-4 py-3 flex items-center justify-between rounded-t-2xl">
              <span className="font-bold text-sm">Privacy Policy</span>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <PrivacyPolicyContent />
          </div>
        </div>
      )}
    </>
  );
}

export default function ModalSbloccaReferto({
  tipoTest,
  risultatoSintetico,
  datiPrecompilati,
  onConferma,
  onAnnulla,
}: Props) {
  const saved = caricaDaStorage();
  const pre = { ...saved, ...datiPrecompilati };
  const giaCompilato = haCompilato();

  const [form, setForm] = useState<DatiLead>({
    nome: pre.nome ?? '',
    cognome: pre.cognome ?? '',
    email: pre.email ?? '',
    cellulare: pre.cellulare ?? '',
    citta: (pre as any).citta ?? '',
    provincia: (pre as any).provincia ?? '',
    consensoPrivacy: false,
    consensoMarketing: false,
    consensoCessione: false,
  });
  const [errori, setErrori] = useState<Partial<Record<keyof DatiLead, string>>>({});
  const [invio, setInvio] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const saveLead = trpc.leads.save.useMutation();

  function aggiorna(campo: keyof DatiLead, valore: string | boolean) {
    setForm(prev => ({ ...prev, [campo]: valore }));
    setErrori(prev => ({ ...prev, [campo]: undefined }));
  }

  function valida(): boolean {
    const e: Partial<Record<keyof DatiLead, string>> = {};
    if (!form.email.trim()) e.email = 'Email obbligatoria';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email non valida';
    if (!form.citta.trim()) e.citta = 'Città obbligatoria';
    if (!form.consensoPrivacy) e.consensoPrivacy = 'Consenso obbligatorio';
    setErrori(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!valida()) return;
    setInvio('loading');
    try {
      await saveLead.mutateAsync({
        nome: form.nome || undefined,
        cognome: form.cognome || undefined,
        email: form.email,
        cellulare: form.cellulare || undefined,
        citta: form.citta || undefined,
        provincia: form.provincia || undefined,
        consensoPrivacy: form.consensoPrivacy,
        consensoMarketing: form.consensoMarketing,
        consensoCessione: form.consensoCessione,
        tipoTest,
        risultatoSintetico,
      });
      salvaSuStorage(form);
      setInvio('done');
      setTimeout(() => onConferma(form), 400);
    } catch {
      setInvio('error');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EBF4FC' }}>
              <Lock size={20} color="#1E73BE" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#1E293B] text-base leading-tight">Sblocca il tuo referto</h3>
              <p className="text-[#64748B] text-xs">Gratuito — PDF pronto in 2 secondi</p>
            </div>
          </div>
          <button onClick={onAnnulla} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X size={20} color="#94A3B8" />
          </button>
        </div>

        {/* ── BODY SCROLLABILE ── */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Già compilato: messaggio breve */}
          {giaCompilato && (
            <div className="rounded-xl bg-[#F0FDF4] border border-[#86EFAC] p-3 flex items-center gap-2">
              <Check size={16} color="#16A34A" />
              <p className="text-[#15803D] text-sm font-semibold">Dati già salvati — verifica e conferma</p>
            </div>
          )}

          {/* Nome + Cognome */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1E293B] font-bold text-sm mb-1">Nome</label>
              <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl border border-[#D6E9F8] px-3 py-2.5 focus-within:border-[#1E73BE]">
                <User size={16} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Mario"
                  value={form.nome}
                  onChange={e => aggiorna('nome', e.target.value)}
                  className="flex-1 outline-none text-[#1E293B] text-sm bg-transparent placeholder:text-[#CBD5E1]"
                  autoComplete="given-name"
                />
              </div>
            </div>
            <div>
              <label className="block text-[#1E293B] font-bold text-sm mb-1">Cognome</label>
              <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl border border-[#D6E9F8] px-3 py-2.5 focus-within:border-[#1E73BE]">
                <User size={16} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Rossi"
                  value={form.cognome}
                  onChange={e => aggiorna('cognome', e.target.value)}
                  className="flex-1 outline-none text-[#1E293B] text-sm bg-transparent placeholder:text-[#CBD5E1]"
                  autoComplete="family-name"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[#1E293B] font-bold text-sm mb-1">
              Email <span className="text-[#EF4444]">*</span>
            </label>
            <div className={`flex items-center gap-2 bg-[#F8FAFC] rounded-xl border px-3 py-2.5 focus-within:border-[#1E73BE] ${errori.email ? 'border-[#EF4444]' : 'border-[#D6E9F8]'}`}>
              <Mail size={16} color="#94A3B8" />
              <input
                type="email"
                placeholder="mario.rossi@email.it"
                value={form.email}
                onChange={e => aggiorna('email', e.target.value)}
                className="flex-1 outline-none text-[#1E293B] text-sm bg-transparent placeholder:text-[#CBD5E1]"
                autoComplete="email"
                inputMode="email"
              />
            </div>
            {errori.email && <p className="text-[#EF4444] text-xs mt-1">{errori.email}</p>}
          </div>

          {/* Cellulare */}
          <div>
            <label className="block text-[#1E293B] font-bold text-sm mb-1">Cellulare</label>
            <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl border border-[#D6E9F8] px-3 py-2.5 focus-within:border-[#1E73BE]">
              <Phone size={16} color="#94A3B8" />
              <input
                type="tel"
                placeholder="333 1234567"
                value={form.cellulare}
                onChange={e => aggiorna('cellulare', e.target.value)}
                className="flex-1 outline-none text-[#1E293B] text-sm bg-transparent placeholder:text-[#CBD5E1]"
                autoComplete="tel"
                inputMode="tel"
              />
            </div>
          </div>

          {/* Città + Provincia */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[#1E293B] font-bold text-sm mb-1">Città <span className="text-[#EF4444]">*</span></label>
              <div className={`flex items-center gap-2 bg-[#F8FAFC] rounded-xl border px-3 py-2.5 focus-within:border-[#1E73BE] ${errori.citta ? 'border-[#EF4444]' : 'border-[#D6E9F8]'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <input
                  type="text"
                  placeholder="Napoli"
                  value={form.citta}
                  onChange={e => aggiorna('citta', e.target.value)}
                  className="flex-1 outline-none text-[#1E293B] text-sm bg-transparent placeholder:text-[#CBD5E1]"
                  autoComplete="address-level2"
                />
              </div>
              {errori.citta && <p className="text-[#EF4444] text-xs mt-1">{errori.citta}</p>}
            </div>
            <div>
              <label className="block text-[#1E293B] font-bold text-sm mb-1">Prov.</label>
              <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl border border-[#D6E9F8] px-3 py-2.5 focus-within:border-[#1E73BE]">
                <input
                  type="text"
                  placeholder="NA"
                  maxLength={2}
                  value={form.provincia}
                  onChange={e => aggiorna('provincia', e.target.value.toUpperCase())}
                  className="flex-1 outline-none text-[#1E293B] text-sm bg-transparent placeholder:text-[#CBD5E1] uppercase"
                  autoComplete="address-level1"
                />
              </div>
            </div>
          </div>

          {/* ── CONSENSI ── */}
          <div className="space-y-3 pt-1">

            {/* 1. Privacy GDPR — obbligatorio */}
            <div
              className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer select-none border ${form.consensoPrivacy ? 'bg-[#F0FDF4] border-[#86EFAC]' : errori.consensoPrivacy ? 'bg-[#FEF2F2] border-[#FECACA]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}
              onClick={() => aggiorna('consensoPrivacy', !form.consensoPrivacy)}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${form.consensoPrivacy ? 'bg-[#16A34A]' : 'bg-[#E2E8F0]'}`}>
                {form.consensoPrivacy && <Check size={12} color="white" strokeWidth={3} />}
              </div>
              <p className="text-[#1E293B] text-xs leading-relaxed">
                <span className="font-bold">Privacy obbligatoria *</span> — Ho letto e accetto il trattamento dei miei dati personali da parte di{' '}
                <span className="font-semibold">Acustica Di Maio</span> per l'erogazione del servizio di screening uditivo, ai sensi del GDPR 2016/679 e del D.Lgs. 196/2003.{' '}
                <PrivacyLink onAnnulla={onAnnulla} />
              </p>
            </div>
            {errori.consensoPrivacy && <p className="text-[#EF4444] text-xs -mt-2 ml-1">{errori.consensoPrivacy}</p>}

            {/* 2. Marketing Acustica Di Maio — opzionale */}
            <div
              className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer select-none border ${form.consensoMarketing ? 'bg-[#EBF4FC] border-[#93C5FD]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}
              onClick={() => aggiorna('consensoMarketing', !form.consensoMarketing)}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${form.consensoMarketing ? 'bg-[#1E73BE]' : 'bg-[#E2E8F0]'}`}>
                {form.consensoMarketing && <Check size={12} color="white" strokeWidth={3} />}
              </div>
              <p className="text-[#1E293B] text-xs leading-relaxed">
                <span className="font-bold">Marketing (facoltativo)</span> — Acconsento a ricevere comunicazioni commerciali, offerte e promozioni da parte di{' '}
                <span className="font-semibold">Acustica Di Maio</span> tramite email e/o SMS.
              </p>
            </div>

            {/* 3. Cessione a centri partner — opzionale */}
            <div
              className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer select-none border ${form.consensoCessione ? 'bg-[#EBF4FC] border-[#93C5FD]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}
              onClick={() => aggiorna('consensoCessione', !form.consensoCessione)}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${form.consensoCessione ? 'bg-[#1E73BE]' : 'bg-[#E2E8F0]'}`}>
                {form.consensoCessione && <Check size={12} color="white" strokeWidth={3} />}
              </div>
              <p className="text-[#1E293B] text-xs leading-relaxed">
                <span className="font-bold">Offerte da centri acustici partner (facoltativo)</span> — Acconsento alla comunicazione dei miei dati a{' '}
                <span className="font-semibold">centri acustici e audioprotesisti selezionati</span> per ricevere preventivi e offerte personalizzate sul miglioramento dell'udito.
              </p>
            </div>

          </div>

          {/* Errore server */}
          {invio === 'error' && (
            <div className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] p-3">
              <p className="text-[#B91C1C] text-sm">Si è verificato un errore. Riprova tra qualche secondo.</p>
            </div>
          )}

        </div>

        {/* ── FOOTER con CTA ── */}
        <div className="px-5 pb-5 pt-3 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={invio === 'loading' || invio === 'done'}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-extrabold text-white text-base shadow-lg transition-all active:scale-95 disabled:opacity-70"
            style={{ background: invio === 'done' ? '#16A34A' : 'linear-gradient(135deg, #1E73BE 0%, #155A96 100%)' }}
          >
            {invio === 'loading' && (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {invio === 'done' && <Check size={22} />}
            {invio === 'loading' ? 'Salvataggio...' : invio === 'done' ? 'Referto sbloccato!' : (
              <>
                <FileDown size={22} />
                Sblocca e scarica il referto
              </>
            )}
          </button>
          <p className="text-center text-[#94A3B8] text-xs mt-2">
            I tuoi dati non saranno mai venduti senza il tuo consenso esplicito.
          </p>
        </div>

      </div>
    </div>
  );
}
