import { Check } from 'lucide-react';

interface ColorSwatchProps {
  color: string;
  selected: boolean;
  onClick: () => void;
}

export function ColorSwatch({ color, selected, onClick }: ColorSwatchProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
      style={{ backgroundColor: color }}
      aria-label={`Select color ${color}`}
    >
      {selected && <Check size={14} className="text-white" strokeWidth={3} />}
    </button>
  );
}
