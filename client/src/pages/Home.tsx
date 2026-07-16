// ══════════════════════════════════════════════════════════
// UdiTest — Home
// Test accessibile a tutti senza login.
// Storico visibile solo se l'utente ha già sbloccato un referto.
// ══════════════════════════════════════════════════════════
import { Mic, Music, AlertTriangle, History } from 'lucide-react';
import { useTest } from '@/contexts/TestContext';
import { useStorico } from '@/hooks/useStorico';
import { haCompilato } from '@/components/ModalSbloccaReferto';

export default function Home() {
  const { setStep } = useTest();
  const { storico } = useStorico();

  // L'utente ha già sbloccato almeno un referto (dati in localStorage)
  const utenteCensito = haCompilato();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">

      {/* ── HEADER ── */}
      <div className="bg-white border-b border-[#D6E9F8] sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between w-full max-w-[480px] mx-auto px-4 py-3">
          <img
            src="/logo_acustica_dimaio_b5729c4d.png"
            alt="Acustica Di Maio"
            className="h-12 w-auto object-contain"
          />
          <div className="flex items-center gap-2">
            {/* Storico esami — visibile solo se l'utente ha già compilato i dati */}
            {utenteCensito && (
              <button
                onClick={() => setStep('storico')}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95"
                style={{ backgroundColor: storico.length > 0 ? '#EBF4FC' : '#F1F5F9' }}
                title="Storico esami"
              >
                <History size={20} color={storico.length > 0 ? '#1E73BE' : '#94A3B8'} />
                {storico.length > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[10px] font-extrabold flex items-center justify-center"
                    style={{ backgroundColor: '#1E73BE' }}
                  >
                    {storico.length > 9 ? '9+' : storico.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between overflow-y-auto">
        <div className="container py-6 space-y-5 animate-fade-in-up flex-1">

          {/* ── TESTO INTRODUTTIVO ── */}
          <div className="text-center px-2 pt-2">
            <h2 className="text-2xl font-extrabold text-[#1E293B] mb-2 leading-tight">
              Sentire bene è vivere meglio.
            </h2>
            <p className="text-[#64748B] text-sm leading-relaxed">
              Fai il primo passo verso la chiarezza. Utilizza i test di UdiTest per una
              valutazione preliminare rapida e accurata: è il modo più semplice per capire
              come gestire al meglio le tue esigenze uditive.
            </p>
          </div>

          {/* ── DUE TASTI AFFIANCATI — sempre visibili ── */}
          <div className="grid grid-cols-2 gap-3">

            {/* Test Vocale */}
            <button
              className="rounded-2xl p-4 text-center transition-all active:scale-95 shadow-md"
              style={{ background: 'linear-gradient(135deg, #1E73BE 0%, #155A96 100%)' }}
              onClick={() => setStep('intro-vocale')}
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-2">
                <Mic size={26} color="white" />
              </div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-0.5">
                Esame 1
              </p>
              <h3 className="text-white font-extrabold text-base leading-tight">
                Test Vocale
              </h3>
              <p className="text-white/60 text-xs mt-1">~8 min · Microfono</p>
            </button>

            {/* Test Tonale */}
            <button
              className="rounded-2xl p-4 text-center transition-all active:scale-95 shadow-md"
              style={{ background: 'linear-gradient(135deg, #0D9488 0%, #0A7A70 100%)' }}
              onClick={() => setStep('intro-tonale')}
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-2">
                <Music size={26} color="white" />
              </div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-0.5">
                Esame 2
              </p>
              <h3 className="text-white font-extrabold text-base leading-tight">
                Test Tonale
              </h3>
              <p className="text-white/60 text-xs mt-1">~5 min · Cuffie</p>
            </button>

          </div>

          {/* ── INVITO STORICO — solo se non ancora censito ── */}
          {!utenteCensito && (
            <div className="rounded-2xl bg-white border border-[#D6E9F8] p-4 text-center">
              <p className="text-[#64748B] text-sm leading-relaxed">
                Dopo il test potrai <span className="font-semibold text-[#1E73BE]">scaricare il referto PDF gratuito</span> e
                salvare i tuoi risultati per monitorare l'udito nel tempo.
              </p>
            </div>
          )}

          {/* ── DISCLAIMER ── */}
          <div className="rounded-2xl border-2 border-[#F59E0B] bg-[#FFFBEB] p-4 text-center">
            <AlertTriangle size={20} color="#D97706" className="mx-auto mb-2" />
            <p className="font-extrabold text-[#92400E] text-sm mb-1">
              Questo è solo uno screening.
            </p>
            <p className="text-[#92400E] text-xs leading-relaxed">
              Non sostituisce una valutazione audiologica professionale eseguita in studio
              con strumentazione calibrata. Rivolgiti ad un professionista qualificato.
            </p>
          </div>

          {/* ── WHATSAPP (sx) + PRENOTA (dx) ── */}
          <div className="flex gap-3">
            <a
              href="https://wa.me/393341990307?text=Ciao%2C+ho+appena+fatto+il+test+su+Pronto+Udito+di+Acustica+Di+Maio+e+vorrei+prenotare+una+visita+o+ricevere+informazioni."
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 block rounded-2xl p-4 text-center transition-all active:scale-95 shadow-sm border-2 border-[#25D366] bg-white"
            >
              <p className="text-[#128C7E] font-extrabold text-base">
                <svg className="inline-block mr-1 mb-0.5" width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Scrivi su WhatsApp
              </p>
              <p className="text-[#64748B] text-xs mt-0.5">Richiedi informazioni</p>
            </a>
            <a
              href="https://www.acusticadimaio.it/contatta-e-prenota/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 block rounded-2xl p-4 text-center transition-all active:scale-95 shadow-sm border-2 border-[#1E73BE] bg-white"
            >
              <p className="text-[#1E73BE] font-extrabold text-base">
                📅 Prenota una visita
              </p>
              <p className="text-[#64748B] text-xs mt-0.5">Valutazione professionale</p>
            </a>
          </div>

        </div>

        {/* ── FOOTER copyright ── */}
        <div className="text-center py-4 px-4">
          <p className="text-[#94A3B8] text-xs">
            © {new Date().getFullYear()}{' '}
            <a
              href="https://www.acusticadimaio.it"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1E73BE] font-semibold"
            >
              Acustica Di Maio
            </a>
            {' '}— Soluzioni per l'udito
            {' | '}
            <a
              href="https://www.acusticadimaio.it/contatta-e-prenota/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1E73BE] font-semibold"
            >
              Contattaci
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
