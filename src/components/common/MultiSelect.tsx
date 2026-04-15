import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
}

export function MultiSelect({ options, value, onChange, placeholder = 'Select…', label }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter(v => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const selectedLabels = value
    .map(v => options.find(o => o.value === v)?.label)
    .filter(Boolean) as string[];

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      )}

      {/* Chips */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedLabels.map((l, i) => (
            <span
              key={value[i]}
              className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 text-xs font-medium"
            >
              {l}
              <button
                type="button"
                onClick={() => toggle(value[i])}
                className="hover:text-indigo-900"
                aria-label={`Remove ${l}`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between h-10 px-3 border border-slate-300 rounded-lg text-sm text-left bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span className={value.length === 0 ? 'text-slate-400' : 'text-slate-700'}>
          {value.length === 0 ? placeholder : `${value.length} selected`}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full text-sm px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-400 text-center">No options</li>
            )}
            {filtered.map(option => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => toggle(option.value)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                >
                  <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${value.includes(option.value) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                    {value.includes(option.value) && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="text-slate-700">{option.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
