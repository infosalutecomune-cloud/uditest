// ══════════════════════════════════════════════════════════
// UdiTest — Barre onda sonora animate
// ══════════════════════════════════════════════════════════
interface SoundwaveBarsProps {
  active?: boolean;
  color?: 'blue' | 'red' | 'white';
  size?: 'sm' | 'md' | 'lg';
}

export default function SoundwaveBars({ active = true, color = 'blue', size = 'md' }: SoundwaveBarsProps) {
  const colorClass = color === 'red' ? 'bg-red-500' : color === 'white' ? 'bg-white' : 'bg-[#1E73BE]';
  const heights = size === 'sm'
    ? [12, 20, 28, 20, 12, 20, 28, 20, 12]
    : size === 'lg'
    ? [24, 42, 60, 42, 24, 42, 60, 42, 24]
    : [16, 28, 40, 28, 16, 28, 40, 28, 16];

  const delays = [0, 0.1, 0.2, 0.3, 0.4, 0.3, 0.2, 0.1, 0];

  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {heights.map((h, i) => (
        <div
          key={i}
          className={`w-1 rounded-full ${colorClass} transition-all`}
          style={{
            height: active ? h : Math.round(h * 0.3),
            animation: active ? `soundwave 1s ease-in-out ${delays[i]}s infinite` : 'none',
            opacity: active ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
}
