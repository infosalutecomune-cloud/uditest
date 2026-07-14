// ══════════════════════════════════════════════════════════
// UdiTest — Modal Conferma Anagrafica prima del PDF
// Mostra i dati salvati precompilati, permette modifica rapida
// ══════════════════════════════════════════════════════════
import { useState } from 'react';
import { User, MapPin, Calendar, FileDown, X, Phone } from 'lucide-react';
import { DatiAnagrafica } from '@/hooks/useAnagrafica';

interface Props {
  datiIniziali: DatiAnagrafica;
  onConferma: (dati: DatiAnagrafica) => void;
  onAnnulla: () => void;
}

export default function ModalConfermaAnagrafica({ datiIniziali, onConferma, onAnnulla }: Props) {
  const [form, setForm] = useState<DatiAnagrafica>({ ...datiIniziali });

  function aggiornaField(campo: keyof DatiAnagrafica, valore: string | boolean) {
    setForm(prev => ({ ...prev, [campo]: valore }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
    >
      <div
        className="bg-white w-full max-w-[480px] rounded-t-3xl shadow-2xl overflow-y-auto"
        style={{ maxHeight: '90vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#D6E9F8]" />
        </div>

        <div className="px-5 pb-6 pt-2">
          {/* Titolo */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-[#1E293B] text-xl">Conferma i tuoi dati</h3>
              <p className="text-[#64748B] text-sm">Verranno inclusi nel referto PDF</p>
            </div>
            <button
              onClick={onAnnulla}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#F1F5F9' }}
            >
              <X size={18} color="#64748B" />
            </button>
          </div>

          {/* Campi */}
          <div className="space-y-3 mb-5">

            {/* Nome */}
            <div>
              <label className="block text-[#64748B] font-semibold text-xs mb-1 uppercase tracking-wide">Nome</label>
              <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl border border-[#D6E9F8] px-3 py-2.5 focus-within:border-[#1E73BE] transition-colors">
                <User size={16} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Es. Mario"
                  value={form.nome}
                  onChange={e => aggiornaField('nome', e.target.value)}
                  className="flex-1 outline-none text-[#1E293B] text-base bg-transparent placeholder:text-[#CBD5E1]"
                />
              </div>
            </div>

            {/* Cognome */}
            <div>
              <label className="block text-[#64748B] font-semibold text-xs mb-1 uppercase tracking-wide">Cognome</label>
              <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl border border-[#D6E9F8] px-3 py-2.5 focus-within:border-[#1E73BE] transition-colors">
                <User size={16} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Es. Rossi"
                  value={form.cognome}
                  onChange={e => aggiornaField('cognome', e.target.value)}
                  className="flex-1 outline-none text-[#1E293B] text-base bg-transparent placeholder:text-[#CBD5E1]"
                />
              </div>
            </div>

            {/* Data di nascita */}
            <div>
              <label className="block text-[#64748B] font-semibold text-xs mb-1 uppercase tracking-wide">Data di nascita</label>
              <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl border border-[#D6E9F8] px-3 py-2.5 focus-within:border-[#1E73BE] transition-colors">
                <Calendar size={16} color="#94A3B8" />
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
              <label className="block text-[#64748B] font-semibold text-xs mb-1 uppercase tracking-wide">Comune / Paese</label>
              <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl border border-[#D6E9F8] px-3 py-2.5 focus-within:border-[#1E73BE] transition-colors">
                <MapPin size={16} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Es. Napoli"
                  value={form.comune}
                  onChange={e => aggiornaField('comune', e.target.value)}
                  className="flex-1 outline-none text-[#1E293B] text-base bg-transparent placeholder:text-[#CBD5E1]"
                />
              </div>
            </div>

            {/* Cellulare */}
            <div>
              <label className="block text-[#64748B] font-semibold text-xs mb-1 uppercase tracking-wide">Numero di cellulare</label>
              <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl border border-[#D6E9F8] px-3 py-2.5 focus-within:border-[#1E73BE] transition-colors">
                <Phone size={16} color="#94A3B8" />
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
          </div>

          {/* Nota privacy */}
          <p className="text-[#94A3B8] text-xs text-center mb-4">
            I dati non vengono inviati a nessun server. Rimangono solo sul tuo dispositivo.
          </p>

          {/* Bottone genera PDF */}
          <button
            onClick={() => onConferma(form)}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-extrabold text-white text-lg shadow-lg transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #1E73BE 0%, #155A96 100%)' }}
          >
            <FileDown size={24} />
            Genera il referto PDF
          </button>

          {/* Salta */}
          <button
            onClick={() => onConferma({ nome: '', cognome: '', dataNascita: '', comune: '', cellulare: '', ricordaDati: false })}
            className="w-full py-3 mt-2 rounded-2xl font-semibold text-[#94A3B8] text-sm transition-all active:scale-95"
          >
            Genera senza dati personali
          </button>
        </div>
      </div>
    </div>
  );
}
