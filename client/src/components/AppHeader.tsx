// ══════════════════════════════════════════════════════════
// UdiTest — Header con logo cliccabile (tasto home)
// ══════════════════════════════════════════════════════════
import { ChevronLeft } from 'lucide-react';
import { useTest } from '@/contexts/TestContext';

interface AppHeaderProps {
  onBack?: () => void;
  title?: string;
  subtitle?: string;
}

export default function AppHeader({ onBack, title, subtitle }: AppHeaderProps) {
  const { setStep } = useTest();

  return (
    <div className="bg-white border-b border-[#D6E9F8] sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-3 w-full max-w-[480px] mx-auto px-4 py-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-[#EBF4FC] transition-colors flex-shrink-0"
            aria-label="Torna indietro"
          >
            <ChevronLeft size={28} color="#1E73BE" />
          </button>
        )}
        {/* Logo cliccabile → torna sempre alla Home */}
        <button
          onClick={() => setStep('home')}
          className="flex-shrink-0 rounded-xl transition-opacity active:opacity-70"
          aria-label="Torna alla home"
        >
          <img
            src="/logo_acustica_dimaio_b5729c4d.png"
            alt="UdiTest — Acustica Di Maio"
            className="h-10 w-auto object-contain"
          />
        </button>
        <div className="flex-1 min-w-0">
          {title && (
            <h1 className="text-[#1E293B] font-extrabold text-base leading-tight truncate">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-[#64748B] text-sm leading-tight">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
