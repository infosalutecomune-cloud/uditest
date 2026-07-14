// ══════════════════════════════════════════════════════════
// UdiTest — Pagina Anagrafica Paziente
// Form: nome, cognome, data di nascita, comune
// Flag "Ricorda i miei dati" per salvataggio locale
// ══════════════════════════════════════════════════════════
import { useState } from 'react';
import { User, MapPin, Calendar, Check, ChevronLeft, Trash2, Phone } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { useAnagrafica, DatiAnagrafica } from '@/hooks/useAnagrafica';
import { useStorico } from '@/hooks/useStorico';
import { useTest } from '@/contexts/TestContext';

export default function Anagrafica() {
  const { setStep } = useTest();
  const { dati: datiSalvati, salva } = useAnagrafica();
  const { storico, cancellaStorico } = useStorico();

  const [form, setForm] = useState<DatiAnagrafica>({ ...datiSalvati });
  const [salvato, setSalvato] = useState(false);
  const [confermaCanc, setConfermaCanc] = useState(false);

  function aggiornaField(campo: keyof DatiAnagrafica, valore: string | boolean) {
    setForm(prev => ({ ...prev, [campo]: valore }));
    setSalvato(false);
  }

  function handleSalva() {
    salva(form);
    setSalvato(true);
    setTimeout(() => setStep('home'), 800);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <AppHeader
        title="I tuoi dati"
        subtitle="Inserisci i tuoi dati"
        onBack={() => setStep('home')}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="container py-6 space-y-5 animate-fade-in-up">

          {/* Intro */}
          <div className="card-voicecheck text-center py-6">
            <div className="w-16 h-16 rounded-full bg-[#EBF4FC] flex items-center justify-center mx-auto mb-3">
              <User size={32} color="#1E73BE" />
            </div>
            <h3 className="font-extrabold text-[#1E293B] text-xl mb-2">Dati personali</h3>
            <p className="text-[#64748B] text-sm leading-relaxed">
              Inserisci i tuoi dati per personalizzare il referto PDF.
              Vengono salvati solo sul tuo dispositivo.
            </p>
          </div>

          {/* Form */}
          <div className="card-voicecheck space-y-4">

            {/* Nome */}
            <div>
              <label className="block text-[#1E293B] font-bold text-sm mb-1.5">Nome</label>
              <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl border border-[#D6E9F8] px-3 py-3 focus-within:border-[#1E73BE] transition-colors">
                <User size={18} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Es. Mario"
                  value={form.nome}
                  onChange={e => aggiornaField('nome', e.target.value)}
                  className="flex-1 outline-none text-[#1E293B] text-base bg-transparent placeholder:text-[#CBD5E1]"
                  autoComplete="given-name"
                />
              </div>
            </div>

            {/* Cognome */}
            <div>
              <label className="block text-[#1E293B] font-bold text-sm mb-1.5">Cognome</label>
              <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl border border-[#D6E9F8] px-3 py-3 focus-within:border-[#1E73BE] transition-colors">
                <User size={18} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Es. Rossi"
                  value={form.cognome}
                  onChange={e => aggiornaField('cognome', e.target.value)}
                  className="flex-1 outline-none text-[#1E293B] text-base bg-transparent placeholder:text-[#CBD5E1]"
                  autoComplete="family-name"
                />
              </div>
            </div>

            {/* Data di nascita */}
            <div>
              <label className="block text-[#1E293B] font-bold text-sm mb-1.5">Data di nascita</label>
              <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl border border-[#D6E9F8] px-3 py-3 focus-within:border-[#1E73BE] transition-colors">
                <Calendar size={18} color="#94A3B8" />
                <input
                  type="date"
                  value={form.dataNascita}
                  onChange={e => aggiornaField('dataNascita', e.target.value)}
                  className="flex-1 outline-none text-[#1E293B] text-base bg-transparent"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Comune */}
            <div>
              <label className="block text-[#1E293B] font-bold text-sm mb-1.5">Comune / Paese</label>
              <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl border border-[#D6E9F8] px-3 py-3 focus-within:border-[#1E73BE] transition-colors">
                <MapPin size={18} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Es. Napoli"
                  value={form.comune}
                  onChange={e => aggiornaField('comune', e.target.value)}
                  className="flex-1 outline-none text-[#1E293B] text-base bg-transparent placeholder:text-[#CBD5E1]"
                  autoComplete="address-level2"
                />
              </div>
            </div>

            {/* Cellulare */}
            <div>
              <label className="block text-[#1E293B] font-bold text-sm mb-1.5">Numero di cellulare</label>
              <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl border border-[#D6E9F8] px-3 py-3 focus-within:border-[#1E73BE] transition-colors">
                <Phone size={18} color="#94A3B8" />
                <input
                  type="tel"
                  placeholder="Es. 333 1234567"
                  value={form.cellulare}
                  onChange={e => aggiornaField('cellulare', e.target.value)}
                  className="flex-1 outline-none text-[#1E293B] text-base bg-transparent placeholder:text-[#CBD5E1]"
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Flag ricorda dati */}
            <div
              className="flex items-center gap-3 p-4 rounded-xl cursor-pointer select-none"
              style={{ backgroundColor: form.ricordaDati ? '#EBF4FC' : '#F8FAFC', border: `1.5px solid ${form.ricordaDati ? '#93C5FD' : '#E2E8F0'}` }}
              onClick={() => aggiornaField('ricordaDati', !form.ricordaDati)}
            >
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
                style={{ backgroundColor: form.ricordaDati ? '#1E73BE' : '#E2E8F0' }}
              >
                {form.ricordaDati && <Check size={14} color="white" strokeWidth={3} />}
              </div>
              <div>
                <p className="font-bold text-[#1E293B] text-sm">Ricorda i miei dati</p>
                <p className="text-[#64748B] text-xs">I dati vengono salvati sul tuo dispositivo e precompilati automaticamente</p>
              </div>
            </div>

          </div>

          {/* Pulsante salva */}
          <button
            onClick={handleSalva}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-extrabold text-white text-lg shadow-lg transition-all active:scale-95"
            style={{ background: salvato ? '#22C55E' : 'linear-gradient(135deg, #1E73BE 0%, #155A96 100%)' }}
          >
            {salvato ? (
              <>
                <Check size={24} />
                Salvato!
              </>
            ) : (
              <>
                <Check size={24} />
                Salva e torna alla home
              </>
            )}
          </button>

          {/* Torna senza salvare */}
          <button
            onClick={() => setStep('home')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-[#64748B] text-base transition-all active:scale-95"
            style={{ backgroundColor: '#F1F5F9' }}
          >
            <ChevronLeft size={18} />
            Torna senza salvare
          </button>

          {/* Cancella storico */}
          {storico.length > 0 && (
            <div className="pt-2">
              {!confermaCanc ? (
                <button
                  onClick={() => setConfermaCanc(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-[#EF4444] text-sm transition-all active:scale-95"
                  style={{ backgroundColor: '#FEF2F2', border: '1.5px solid #FECACA' }}
                >
                  <Trash2 size={16} />
                  Cancella storico test ({storico.length} voci)
                </button>
              ) : (
                <div className="rounded-2xl p-4" style={{ backgroundColor: '#FEF2F2', border: '1.5px solid #FECACA' }}>
                  <p className="text-sm font-bold text-[#B91C1C] mb-3 text-center">Sei sicuro? Lo storico verrà eliminato definitivamente.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setConfermaCanc(false)}
                      className="py-2.5 rounded-xl font-semibold text-sm"
                      style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}
                    >
                      Annulla
                    </button>
                    <button
                      onClick={() => { cancellaStorico(); setConfermaCanc(false); }}
                      className="py-2.5 rounded-xl font-bold text-sm text-white"
                      style={{ backgroundColor: '#EF4444' }}
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
