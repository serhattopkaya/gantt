import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
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
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([]);

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

  const safeActiveIndex =
    filtered.length === 0 ? 0 : Math.min(activeIndex, filtered.length - 1);

  useEffect(() => {
    if (open) optionsRef.current[safeActiveIndex]?.scrollIntoView({ block: 'nearest' });
  }, [open, safeActiveIndex]);

  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter(v => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  function closeAndFocusTrigger() {
    setOpen(false);
    setSearch('');
    triggerRef.current?.focus();
  }

  function handleKeyDown(e: ReactKeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
        setActiveIndex(0);
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      closeAndFocusTrigger();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (filtered.length === 0 ? 0 : (i + 1) % filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i =>
        filtered.length === 0 ? 0 : (i - 1 + filtered.length) % filtered.length
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const option = filtered[safeActiveIndex];
      if (option) toggle(option.value);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(Math.max(0, filtered.length - 1));
    }
  }

  const selectedChips = value
    .map(v => ({ value: v, label: options.find(o => o.value === v)?.label }))
    .filter((c): c is { value: string; label: string } => !!c.label);

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-1">{label}</label>
      )}

      {selectedChips.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedChips.map(chip => (
            <span
              key={chip.value}
              className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full px-2 py-0.5 text-xs font-medium"
            >
              {chip.label}
              <button
                type="button"
                onClick={() => toggle(chip.value)}
                className="hover:text-indigo-900 dark:hover:text-indigo-200"
                aria-label={`Remove ${chip.label}`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between h-10 px-3 border border-border-strong rounded-lg text-sm text-left bg-surface hover:border-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span className={value.length === 0 ? 'text-text-muted' : 'text-text-primary'}>
          {value.length === 0 ? placeholder : `${value.length} selected`}
        </span>
        <ChevronDown size={16} className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full text-sm px-2 py-1.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>
          <ul className="max-h-48 overflow-y-auto" role="listbox" aria-multiselectable="true">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-text-muted text-center">No options</li>
            )}
            {filtered.map((option, idx) => {
              const selected = value.includes(option.value);
              const active = idx === safeActiveIndex;
              return (
                <li key={option.value}>
                  <button
                    ref={el => { optionsRef.current[idx] = el; }}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => toggle(option.value)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${active ? 'bg-surface-muted' : 'hover:bg-surface-alt'}`}
                  >
                    <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'bg-indigo-600 border-indigo-600' : 'border-border-strong'}`}>
                      {selected && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className="text-text-primary">{option.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
