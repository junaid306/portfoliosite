import React from 'react';
import { RotateCcw } from 'lucide-react';

interface ColorFieldProps {
  label: string;
  value: string;
  fallbackColor?: string;
  onChange: (nextValue: string) => void;
  allowClear?: boolean;
}

export const ColorField: React.FC<ColorFieldProps> = ({
  label,
  value,
  fallbackColor = '#161616',
  onChange,
  allowClear = false,
}) => {
  const effectiveHex = /^#[0-9A-Fa-f]{6}$/.test(value)
    ? value
    : /^#[0-9A-Fa-f]{6}$/.test(fallbackColor)
    ? fallbackColor
    : '#161616';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-slate-700 truncate">{label}</label>
        {allowClear && value !== '' && (
          <button
            type="button"
            onClick={() => onChange('')}
            title="Inherit from active theme"
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Inherit</span>
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={effectiveHex}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="w-9 h-9 p-0.5 rounded-md border border-slate-200 bg-white cursor-pointer shrink-0"
          aria-label={`${label} color picker`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={allowClear ? 'Theme default' : '#000000'}
          className="w-full px-2.5 py-2 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
        />
      </div>
    </div>
  );
};
