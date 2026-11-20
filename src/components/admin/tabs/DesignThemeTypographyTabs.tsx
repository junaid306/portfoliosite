import React, { useState } from 'react';
import { Check, Eye, Shuffle, Upload } from 'lucide-react';
import { GOOGLE_FONT_OPTIONS } from '../../../data/defaultPortfolioSeed';
import type { PortfolioSnapshot, SectionKey, ThemeConfig, ThemePalette } from '../../../types/cms';
import { buildFontFamily, inferFontFallback, injectCustomFonts, syncGoogleFontsLink } from '../../../utils/themeResolver';
import { uploadFontAsset } from '../../../utils/apiClient';
import { ColorField } from '../ColorField';

const PALETTE_FIELDS: Array<{ key: keyof ThemePalette; label: string }> = [
  { key: 'primary', label: 'Primary Ink' },
  { key: 'secondary', label: 'Secondary Ink' },
  { key: 'accent', label: 'Accent Color' },
  { key: 'background', label: 'Page Background' },
  { key: 'surface', label: 'Surface Canvas' },
  { key: 'headingText', label: 'Heading Text' },
  { key: 'bodyText', label: 'Paragraph Text' },
  { key: 'mutedText', label: 'Muted Metadata' },
  { key: 'cardBg', label: 'Card Background' },
  { key: 'cardText', label: 'Card Text' },
  { key: 'border', label: 'Border Line' },
  { key: 'buttonBg', label: 'Button Background' },
  { key: 'buttonText', label: 'Button Text' },
  { key: 'buttonHoverBg', label: 'Button Hover Bg' },
  { key: 'navbarBg', label: 'Navbar Background' },
  { key: 'navbarText', label: 'Navbar Text' },
  { key: 'footerBg', label: 'Footer Background' },
  { key: 'footerText', label: 'Footer Text' },
  { key: 'inputBg', label: 'Input Background' },
  { key: 'inputText', label: 'Input Text' },
  { key: 'inputBorder', label: 'Input Border' },
  { key: 'iconColor', label: 'Icon Color' },
];

export const ThemeManagerTab: React.FC<{
  draft: PortfolioSnapshot;
  onChange: (next: PortfolioSnapshot) => void;
  previewThemeId: string;
  onPreviewTheme: (id: string) => void;
}> = ({ draft, onChange, previewThemeId, onPreviewTheme }) => {
  const [selectedThemeId, setSelectedThemeId] = useState(draft.themes[0]?.id || '');

  const activeEditingTheme =
    draft.themes.find((t) => t.id === selectedThemeId) || draft.themes[0];

  const updateControl = (patch: Partial<PortfolioSnapshot['themeControl']>) => {
    onChange({ ...draft, themeControl: { ...draft.themeControl, ...patch } });
  };

  const updateTheme = (themeId: string, updater: (t: ThemeConfig) => ThemeConfig) => {
    onChange({
      ...draft,
      themes: draft.themes.map((t) => (t.id === themeId ? updater(t) : t)),
    });
  };

  const allFontChoices = [
    ...GOOGLE_FONT_OPTIONS.map((f) => f.name),
    ...draft.typography.customFonts.map((f) => f.family),
  ];

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Six Random Themes Manager</h2>
          <p className="text-sm text-slate-600">
            Enable/disable any of the 6 themes, customize each theme palette and typography, set defaults, and control randomization.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const enabled = draft.themes.filter((t) => t.enabled);
            if (enabled.length > 0) {
              const picked = enabled[Math.floor(Math.random() * enabled.length)];
              setSelectedThemeId(picked.id);
              onPreviewTheme(picked.id);
            }
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer shrink-0"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span>Test Random Selection</span>
        </button>
      </div>

      {/* Randomization & Default Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">Default Fallback Theme</label>
          <select
            value={draft.themeControl.defaultThemeId}
            onChange={(e) => updateControl({ defaultThemeId: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
          >
            {draft.themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={draft.themeControl.enableRandomTheme}
            onChange={(e) => updateControl({ enableRandomTheme: e.target.checked })}
            className="mt-0.5"
          />
          <div>
            <div className="text-xs font-semibold text-slate-900">Enable Random Themes</div>
            <div className="text-[11px] text-slate-500">Pick randomly among enabled themes</div>
          </div>
        </label>

        <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={draft.themeControl.changeOnEveryVisit}
            onChange={(e) => updateControl({ changeOnEveryVisit: e.target.checked })}
            className="mt-0.5"
          />
          <div>
            <div className="text-xs font-semibold text-slate-900">Change on Every Visit</div>
            <div className="text-[11px] text-slate-500">New random theme on every page load</div>
          </div>
        </label>

        <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={draft.themeControl.respectDesignOverrides}
            onChange={(e) => updateControl({ respectDesignOverrides: e.target.checked })}
            className="mt-0.5"
          />
          <div>
            <div className="text-xs font-semibold text-slate-900">Respect Global Overrides</div>
            <div className="text-[11px] text-slate-500">Apply global design tokens over themes</div>
          </div>
        </label>
      </div>

      {/* 6 Theme Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {draft.themes.map((theme) => {
          const isEditing = activeEditingTheme?.id === theme.id;
          const isPreviewing = previewThemeId === theme.id;
          return (
            <div
              key={theme.id}
              className={`bg-white border rounded-xl p-4 space-y-3 transition-colors ${
                isEditing ? 'border-slate-900 ring-1 ring-slate-900/15' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 truncate">{theme.name}</span>
                    {draft.themeControl.defaultThemeId === theme.id && (
                      <span className="text-[11px] font-medium text-slate-600">· Default</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{theme.description}</p>
                </div>
                <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={theme.enabled}
                    onChange={(e) =>
                      updateTheme(theme.id, (prev) => ({ ...prev, enabled: e.target.checked }))
                    }
                  />
                  <span>Enabled</span>
                </label>
              </div>

              <div className="flex items-center gap-1.5 h-6">
                {[
                  theme.colors.background,
                  theme.colors.surface,
                  theme.colors.headingText,
                  theme.colors.accent,
                  theme.colors.buttonBg,
                ].map((swatch, idx) => (
                  <div
                    key={idx}
                    className="flex-1 h-full rounded border border-black/10"
                    style={{ backgroundColor: swatch }}
                    title={swatch}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedThemeId(theme.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                    isEditing
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  {isEditing ? 'Editing Theme' : 'Edit Palette & Styles'}
                </button>
                <button
                  type="button"
                  onClick={() => onPreviewTheme(theme.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border cursor-pointer ${
                    isPreviewing
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {isPreviewing ? <Check className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{isPreviewing ? 'In Preview' : 'Preview'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Theme Editor */}
      {activeEditingTheme && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Editing: {activeEditingTheme.name}
              </h3>
              <p className="text-xs text-slate-500">
                Adjust every color token, font pairing, border radius, and navbar/footer styling for this theme.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onPreviewTheme(activeEditingTheme.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg cursor-pointer self-start"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview This Theme</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Theme Name</label>
              <input
                type="text"
                value={activeEditingTheme.name}
                onChange={(e) =>
                  updateTheme(activeEditingTheme.id, (prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Description</label>
              <input
                type="text"
                value={activeEditingTheme.description}
                onChange={(e) =>
                  updateTheme(activeEditingTheme.id, (prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Theme Color Palette (Picker + HEX)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PALETTE_FIELDS.map((field) => (
                <ColorField
                  key={field.key}
                  label={field.label}
                  value={activeEditingTheme.colors[field.key]}
                  onChange={(nextVal) =>
                    updateTheme(activeEditingTheme.id, (prev) => ({
                      ...prev,
                      colors: { ...prev.colors, [field.key]: nextVal },
                    }))
                  }
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
            {(
              [
                ['headingFont', 'Theme Heading Font'],
                ['bodyFont', 'Theme Body Font'],
                ['buttonFont', 'Theme Button Font'],
                ['navFont', 'Theme Nav Font'],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">{label}</label>
                <select
                  value={activeEditingTheme.typography[key]}
                  onChange={(e) =>
                    updateTheme(activeEditingTheme.id, (prev) => ({
                      ...prev,
                      typography: { ...prev.typography, [key]: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                >
                  {allFontChoices.map((fn) => (
                    <option key={fn} value={fn}>
                      {fn}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 tabular-nums">
                Card Radius ({activeEditingTheme.styles.borderRadius}px)
              </label>
              <input
                type="range"
                min={0}
                max={28}
                value={activeEditingTheme.styles.borderRadius}
                onChange={(e) =>
                  updateTheme(activeEditingTheme.id, (prev) => ({
                    ...prev,
                    styles: { ...prev.styles, borderRadius: Number(e.target.value) },
                  }))
                }
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 tabular-nums">
                Button Radius ({activeEditingTheme.styles.buttonRadius}px)
              </label>
              <input
                type="range"
                min={0}
                max={28}
                value={activeEditingTheme.styles.buttonRadius}
                onChange={(e) =>
                  updateTheme(activeEditingTheme.id, (prev) => ({
                    ...prev,
                    styles: { ...prev.styles, buttonRadius: Number(e.target.value) },
                  }))
                }
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Card Shadow CSS</label>
              <input
                type="text"
                value={activeEditingTheme.styles.cardShadow}
                onChange={(e) =>
                  updateTheme(activeEditingTheme.id, (prev) => ({
                    ...prev,
                    styles: { ...prev.styles, cardShadow: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Navbar Border CSS</label>
              <input
                type="text"
                value={activeEditingTheme.styles.navbarBorder}
                onChange={(e) =>
                  updateTheme(activeEditingTheme.id, (prev) => ({
                    ...prev,
                    styles: { ...prev.styles, navbarBorder: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const GlobalDesignTab: React.FC<{
  draft: PortfolioSnapshot;
  onChange: (next: PortfolioSnapshot) => void;
}> = ({ draft, onChange }) => {
  const { globalDesign } = draft;

  const updateGlobal = (patch: Partial<PortfolioSnapshot['globalDesign']>) => {
    onChange({ ...draft, globalDesign: { ...globalDesign, ...patch } });
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Global Design Customizer</h2>
          <p className="text-sm text-slate-600">
            Override colors globally across the site, adjust container spacing, border radius, and section background gradients.
          </p>
        </div>

        <label className="inline-flex items-center gap-2.5 px-4 py-2 bg-white border border-slate-200 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={globalDesign.useGlobalColorOverrides}
            onChange={(e) => updateGlobal({ useGlobalColorOverrides: e.target.checked })}
          />
          <span className="text-xs font-semibold text-slate-900">Enable Global Color Overrides</span>
        </label>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Global Color Tokens</h3>
          <span className="text-xs text-slate-500">
            {globalDesign.useGlobalColorOverrides
              ? 'Active: Overrides active theme colors'
              : 'Inactive: Active theme palette leads'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PALETTE_FIELDS.map((field) => (
            <ColorField
              key={field.key}
              label={field.label}
              value={globalDesign.colors[field.key]}
              allowClear
              onChange={(val) =>
                updateGlobal({ colors: { ...globalDesign.colors, [field.key]: val } })
              }
            />
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <h3 className="text-sm font-semibold text-slate-900">Layout, Radius & Spacing</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {[
            ['borderRadius', 'Border Radius', 0, 28, 'px'],
            ['containerMaxWidth', 'Max Container', 960, 1440, 'px'],
            ['sectionPaddingY', 'Section Padding Y', 40, 140, 'px'],
            ['cardPadding', 'Card Padding', 12, 48, 'px'],
            ['elementGap', 'Grid Gap', 12, 48, 'px'],
          ].map(([key, label, min, max, unit]) => {
            const k = key as keyof typeof globalDesign.spacing;
            const val = globalDesign.spacing[k];
            return (
              <div key={k} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{label}</span>
                  <span className="font-mono tabular-nums text-slate-900">
                    {val}
                    {unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={min as number}
                  max={max as number}
                  value={val}
                  onChange={(e) =>
                    updateGlobal({
                      spacing: { ...globalDesign.spacing, [k]: Number(e.target.value) },
                    })
                  }
                  className="w-full"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Section Background Gradients</h3>
            <p className="text-xs text-slate-500">Optional CSS gradients applied per section</p>
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={globalDesign.gradients.useSectionGradients}
              onChange={(e) =>
                updateGlobal({
                  gradients: { ...globalDesign.gradients, useSectionGradients: e.target.checked },
                })
              }
            />
            <span>Apply Gradients</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(
            [
              ['heroGradient', 'Hero Gradient'],
              ['aboutGradient', 'About Gradient'],
              ['skillsGradient', 'Skills Gradient'],
              ['projectsGradient', 'Projects Gradient'],
              ['contactGradient', 'Contact Gradient'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">{label}</label>
              <input
                type="text"
                value={globalDesign.gradients[key]}
                placeholder="e.g. linear-gradient(135deg, rgba(0,0,0,0.03), transparent)"
                onChange={(e) =>
                  updateGlobal({
                    gradients: { ...globalDesign.gradients, [key]: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const TypographyTab: React.FC<{
  draft: PortfolioSnapshot;
  onChange: (next: PortfolioSnapshot) => void;
  onToast: (msg: string) => void;
}> = ({ draft, onChange, onToast }) => {
  const { typography } = draft;
  const [fontFamilyInput, setFontFamilyInput] = useState('');
  const [uploadingFont, setUploadingFont] = useState(false);

  const allFonts = [
    ...GOOGLE_FONT_OPTIONS.map((f) => f.name),
    ...typography.customFonts.map((f) => f.family),
  ];

  const updateTypography = (patch: Partial<PortfolioSnapshot['typography']>) => {
    const nextTypo = { ...typography, ...patch };
    injectCustomFonts(nextTypo.customFonts);
    syncGoogleFontsLink(nextTypo);
    onChange({ ...draft, typography: nextTypo });
  };

  const handleUploadFont = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFont(true);
    try {
      const familyName =
        fontFamilyInput.trim() || file.name.replace(/\.(woff2|woff|ttf)$/i, '');
      const res = await uploadFontAsset(file, familyName);
      injectCustomFonts(res.draft.typography.customFonts);
      onChange(res.draft);
      setFontFamilyInput('');
      onToast(`Uploaded custom font "${familyName}"`);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Font upload failed');
    } finally {
      setUploadingFont(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Typography & Custom Fonts
        </h2>
        <p className="text-sm text-slate-600">
          Configure global font pairings, per-section font overrides, typographic scale, or upload custom WOFF/WOFF2/TTF font files.
        </p>
      </div>

      {/* Global Font Combination */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <h3 className="text-sm font-semibold text-slate-900">Global Font Combination</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {(
            [
              ['headingFont', 'Headings Font'],
              ['bodyFont', 'Body Prose Font'],
              ['buttonFont', 'Buttons Font'],
              ['navFont', 'Navigation Font'],
              ['monoFont', 'Monospace / Metrics'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">{label}</label>
              <select
                value={typography[key]}
                onChange={(e) => updateTypography({ [key]: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
              >
                {allFonts.map((fn) => (
                  <option key={fn} value={fn}>
                    {fn}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Scale Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-4 border-t border-slate-200">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-700">H1 Display Size</span>
              <span className="font-mono tabular-nums">{typography.scale.h1Size}px</span>
            </div>
            <input
              type="range"
              min={34}
              max={84}
              value={typography.scale.h1Size}
              onChange={(e) =>
                updateTypography({
                  scale: { ...typography.scale, h1Size: Number(e.target.value) },
                })
              }
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-700">H2 Section Size</span>
              <span className="font-mono tabular-nums">{typography.scale.h2Size}px</span>
            </div>
            <input
              type="range"
              min={22}
              max={54}
              value={typography.scale.h2Size}
              onChange={(e) =>
                updateTypography({
                  scale: { ...typography.scale, h2Size: Number(e.target.value) },
                })
              }
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-700">Body Font Size</span>
              <span className="font-mono tabular-nums">{typography.scale.bodySize}px</span>
            </div>
            <input
              type="range"
              min={13}
              max={20}
              value={typography.scale.bodySize}
              onChange={(e) =>
                updateTypography({
                  scale: { ...typography.scale, bodySize: Number(e.target.value) },
                })
              }
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-700">Line Height</span>
              <span className="font-mono tabular-nums">{typography.scale.lineHeight}</span>
            </div>
            <input
              type="range"
              min={1.2}
              max={2.0}
              step={0.05}
              value={typography.scale.lineHeight}
              onChange={(e) =>
                updateTypography({
                  scale: { ...typography.scale, lineHeight: Number(e.target.value) },
                })
              }
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-700">Letter Spacing</span>
              <span className="font-mono tabular-nums">{typography.scale.letterSpacing}em</span>
            </div>
            <input
              type="range"
              min={-0.05}
              max={0.08}
              step={0.005}
              value={typography.scale.letterSpacing}
              onChange={(e) =>
                updateTypography({
                  scale: { ...typography.scale, letterSpacing: Number(e.target.value) },
                })
              }
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Heading Weight</label>
            <select
              value={typography.scale.headingWeight}
              onChange={(e) =>
                updateTypography({
                  scale: { ...typography.scale, headingWeight: Number(e.target.value) },
                })
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
            >
              {[400, 500, 600, 700, 800].map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Body Weight</label>
            <select
              value={typography.scale.bodyWeight}
              onChange={(e) =>
                updateTypography({
                  scale: { ...typography.scale, bodyWeight: Number(e.target.value) },
                })
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
            >
              {[300, 400, 500, 600].map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Per-Section Font Overrides */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Individual Section Fonts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {(['hero', 'about', 'skills', 'projects', 'contact'] as SectionKey[]).map((key) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 capitalize">{key} Section</label>
              <select
                value={typography.sectionFonts[key]}
                onChange={(e) =>
                  updateTypography({
                    sectionFonts: { ...typography.sectionFonts, [key]: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
              >
                <option value="">Inherit Global</option>
                {allFonts.map((fn) => (
                  <option key={fn} value={fn}>
                    {fn}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Live Font Specimen + Custom Font Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Live Typography Specimen
          </div>
          <div
            style={{
              fontFamily: buildFontFamily(
                typography.headingFont,
                inferFontFallback(typography.headingFont)
              ),
              fontWeight: typography.scale.headingWeight,
              letterSpacing: `${typography.scale.letterSpacing}em`,
              fontSize: `${Math.min(44, typography.scale.h1Size)}px`,
              lineHeight: 1.12,
            }}
            className="text-slate-900"
          >
            Architecture of clarity and enduring digital craft.
          </div>
          <p
            style={{
              fontFamily: buildFontFamily(
                typography.bodyFont,
                inferFontFallback(typography.bodyFont)
              ),
              fontSize: `${typography.scale.bodySize}px`,
              fontWeight: typography.scale.bodyWeight,
              lineHeight: typography.scale.lineHeight,
            }}
            className="text-slate-600"
          >
            Previewing {typography.headingFont} paired with {typography.bodyFont}. Every heading, button, and paragraph updates dynamically across your portfolio and saves to MongoDB.
          </p>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Upload Custom Font (.woff, .woff2, .ttf)</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Font Family Name (e.g. Neue Haas)"
              value={fontFamilyInput}
              onChange={(e) => setFontFamilyInput(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <label className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>{uploadingFont ? 'Uploading Font...' : 'Choose WOFF / WOFF2 / TTF File'}</span>
              <input
                type="file"
                accept=".woff,.woff2,.ttf"
                onChange={handleUploadFont}
                disabled={uploadingFont}
                className="hidden"
              />
            </label>
          </div>

          {typography.customFonts.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="text-xs font-medium text-slate-500">Uploaded Custom Fonts</div>
              {typography.customFonts.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-slate-50 rounded border border-slate-200"
                >
                  <span className="font-medium text-slate-900">{f.family}</span>
                  <span className="font-mono text-slate-500 uppercase">{f.format}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
