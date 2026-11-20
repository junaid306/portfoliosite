import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Eye,
  EyeOff,
  Mail,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { GOOGLE_FONT_OPTIONS } from '../../../data/defaultPortfolioSeed';
import type {
  ContactMessageItem,
  EditableButton,
  MediaAssetItem,
  NavLinkItem,
  PortfolioSnapshot,
} from '../../../types/cms';
import {
  deleteMediaAssetApi,
  deleteMessageApi,
  updateMessageApi,
  uploadImageAsset,
} from '../../../utils/apiClient';
import { ColorField } from '../ColorField';

export const HeaderFooterTab: React.FC<{
  draft: PortfolioSnapshot;
  mediaAssets: MediaAssetItem[];
  onChange: (next: PortfolioSnapshot) => void;
}> = ({ draft, mediaAssets, onChange }) => {
  const imageAssets = mediaAssets.filter((m) => m.type === 'image');
  const updateHeader = (patch: Partial<PortfolioSnapshot['header']>) =>
    onChange({ ...draft, header: { ...draft.header, ...patch } });
  const updateFooter = (patch: Partial<PortfolioSnapshot['footer']>) =>
    onChange({ ...draft, footer: { ...draft.footer, ...patch } });

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Header, Footer & Copyright Manager
        </h2>
        <p className="text-sm text-slate-600">
          Control logo, navbar layout, sticky transparency, mobile menu, footer columns, social links, and copyright text.
        </p>
      </div>

      {/* Header Settings */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <h3 className="text-sm font-semibold text-slate-900">Header & Navbar</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Brand Name</label>
            <input
              type="text"
              value={draft.header.brandName}
              onChange={(e) => updateHeader({ brandName: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Logo Display Text</label>
            <input
              type="text"
              value={draft.header.logoText}
              onChange={(e) => updateHeader({ logoText: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Logo Image URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={draft.header.logoImageUrl}
                onChange={(e) => updateHeader({ logoImageUrl: e.target.value })}
                placeholder="Optional image URL"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
              />
              <select
                value=""
                onChange={(e) => e.target.value && updateHeader({ logoImageUrl: e.target.value })}
                className="px-2 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50"
              >
                <option value="">Pick...</option>
                {imageAssets.map((a) => (
                  <option key={a.id} value={a.url}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ColorField
            label="Header Background"
            value={draft.header.bgColor}
            allowClear
            onChange={(val) => updateHeader({ bgColor: val })}
          />
          <ColorField
            label="Header Text"
            value={draft.header.textColor}
            allowClear
            onChange={(val) => updateHeader({ textColor: val })}
          />
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 tabular-nums">
              Navbar Height ({draft.header.heightPx}px)
            </label>
            <input
              type="range"
              min={52}
              max={104}
              value={draft.header.heightPx}
              onChange={(e) => updateHeader({ heightPx: Number(e.target.value) })}
              className="w-full mt-2"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 tabular-nums">
              Link Spacing ({draft.header.spacingPx}px)
            </label>
            <input
              type="range"
              min={12}
              max={48}
              value={draft.header.spacingPx}
              onChange={(e) => updateHeader({ spacingPx: Number(e.target.value) })}
              className="w-full mt-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Alignment</label>
            <select
              value={draft.header.alignment}
              onChange={(e) =>
                updateHeader({ alignment: e.target.value as 'left' | 'center' | 'split' })
              }
              className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg"
            >
              <option value="split">Split (Logo / Nav / CTA)</option>
              <option value="center">Centered Nav</option>
              <option value="left">Left Grouped</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Mobile Menu Label</label>
            <input
              type="text"
              value={draft.header.mobileMenuLabel}
              onChange={(e) => updateHeader({ mobileMenuLabel: e.target.value })}
              className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          {[
            ['sticky', 'Sticky Header'],
            ['transparentOnTop', 'Transparent at Top'],
            ['showLogoImage', 'Show Logo Image'],
            ['showCtaButton', 'Show Header CTA'],
            ['mobileShowCta', 'Show CTA in Mobile Menu'],
          ].map(([key, label]) => {
            const k = key as 'sticky' | 'transparentOnTop' | 'showLogoImage' | 'showCtaButton' | 'mobileShowCta';
            return (
              <label
                key={k}
                className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={draft.header[k]}
                  onChange={(e) => updateHeader({ [k]: e.target.checked })}
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Footer & Copyright Settings */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <h3 className="text-sm font-semibold text-slate-900">Footer & Copyright Area</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Footer Logo / Brand Text</label>
            <input
              type="text"
              value={draft.footer.logoText}
              onChange={(e) => updateFooter({ logoText: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Footer Logo Image URL</label>
            <input
              type="text"
              value={draft.footer.logoImageUrl}
              onChange={(e) => updateFooter({ logoImageUrl: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">Footer Description</label>
          <textarea
            rows={2}
            value={draft.footer.description}
            onChange={(e) => updateFooter({ description: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <ColorField
            label="Footer Background"
            value={draft.footer.bgColor}
            allowClear
            onChange={(val) => updateFooter({ bgColor: val })}
          />
          <ColorField
            label="Footer Text"
            value={draft.footer.textColor}
            allowClear
            onChange={(val) => updateFooter({ textColor: val })}
          />
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Columns</label>
            <select
              value={draft.footer.columns}
              onChange={(e) => updateFooter({ columns: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
            >
              <option value={1}>1 Column</option>
              <option value={2}>2 Columns</option>
              <option value={3}>3 Columns</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Bottom Alignment</label>
            <select
              value={draft.footer.alignment}
              onChange={(e) =>
                updateFooter({ alignment: e.target.value as 'left' | 'center' | 'between' })
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
            >
              <option value="between">Space Between</option>
              <option value="left">Left Aligned</option>
              <option value="center">Centered</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 tabular-nums">
              Padding Y ({draft.footer.paddingY}px)
            </label>
            <input
              type="range"
              min={28}
              max={120}
              value={draft.footer.paddingY}
              onChange={(e) => updateFooter({ paddingY: Number(e.target.value) })}
              className="w-full mt-2"
            />
          </div>
        </div>

        {/* Editable Copyright */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Editable Copyright Bar
            </h4>
            <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={draft.footer.copyright.showYear}
                onChange={(e) =>
                  updateFooter({
                    copyright: { ...draft.footer.copyright, showYear: e.target.checked },
                  })
                }
              />
              <span>Show Year</span>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Prefix (©)"
              value={draft.footer.copyright.prefix}
              onChange={(e) =>
                updateFooter({
                  copyright: { ...draft.footer.copyright, prefix: e.target.value },
                })
              }
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <input
              type="text"
              placeholder="Year (2026)"
              value={draft.footer.copyright.year}
              onChange={(e) =>
                updateFooter({
                  copyright: { ...draft.footer.copyright, year: e.target.value },
                })
              }
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono"
            />
            <input
              type="text"
              placeholder="Brand Name"
              value={draft.footer.copyright.brandName}
              onChange={(e) =>
                updateFooter({
                  copyright: { ...draft.footer.copyright, brandName: e.target.value },
                })
              }
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <input
              type="text"
              placeholder="Custom Copyright Text"
              value={draft.footer.copyright.customText}
              onChange={(e) =>
                updateFooter({
                  copyright: { ...draft.footer.copyright, customText: e.target.value },
                })
              }
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        {/* Footer Social Links */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Footer Social Links
            </h4>
            <button
              type="button"
              onClick={() =>
                updateFooter({
                  socialLinks: [
                    ...draft.footer.socialLinks,
                    {
                      id: `fsoc-${Date.now()}`,
                      platform: 'Website',
                      label: 'Portfolio',
                      url: 'https://example.com',
                      visible: true,
                    },
                  ],
                })
              }
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-900 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Social Link</span>
            </button>
          </div>

          <div className="space-y-2">
            {draft.footer.socialLinks.map((soc) => (
              <div key={soc.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  value={soc.platform}
                  onChange={(e) =>
                    updateFooter({
                      socialLinks: draft.footer.socialLinks.map((s) =>
                        s.id === soc.id ? { ...s, platform: e.target.value, label: e.target.value } : s
                      ),
                    })
                  }
                  className="sm:col-span-3 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  value={soc.url}
                  onChange={(e) =>
                    updateFooter({
                      socialLinks: draft.footer.socialLinks.map((s) =>
                        s.id === soc.id ? { ...s, url: e.target.value } : s
                      ),
                    })
                  }
                  className="sm:col-span-7 px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
                />
                <div className="sm:col-span-2 flex items-center justify-end gap-2">
                  <input
                    type="checkbox"
                    checked={soc.visible}
                    onChange={(e) =>
                      updateFooter({
                        socialLinks: draft.footer.socialLinks.map((s) =>
                          s.id === soc.id ? { ...s, visible: e.target.checked } : s
                        ),
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateFooter({
                        socialLinks: draft.footer.socialLinks.filter((s) => s.id !== soc.id),
                      })
                    }
                    className="text-red-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const NavigationTab: React.FC<{
  draft: PortfolioSnapshot;
  onChange: (next: PortfolioSnapshot) => void;
}> = ({ draft, onChange }) => {
  const renderList = (
    title: string,
    links: NavLinkItem[],
    onUpdate: (nextLinks: NavLinkItem[]) => void
  ) => {
    const sorted = [...links].sort((a, b) => a.order - b.order);
    const move = (idx: number, dir: -1 | 1) => {
      const target = idx + dir;
      if (target < 0 || target >= sorted.length) return;
      const copy = [...sorted];
      const [item] = copy.splice(idx, 1);
      copy.splice(target, 0, item);
      onUpdate(copy.map((l, i) => ({ ...l, order: i + 1 })));
    };

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={() =>
              onUpdate([
                ...sorted,
                {
                  id: `nav-${Date.now()}`,
                  label: 'New Link',
                  href: '#projects',
                  visible: true,
                  order: sorted.length + 1,
                },
              ])
            }
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Menu Item</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {sorted.map((link, idx) => (
            <div
              key={link.id}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-2.5 border border-slate-200 rounded-lg"
            >
              <input
                type="text"
                value={link.label}
                onChange={(e) =>
                  onUpdate(
                    sorted.map((item) =>
                      item.id === link.id ? { ...item, label: e.target.value } : item
                    )
                  )
                }
                placeholder="Label"
                className="sm:col-span-4 px-2.5 py-1.5 text-xs border border-slate-200 rounded"
              />
              <input
                type="text"
                value={link.href}
                onChange={(e) =>
                  onUpdate(
                    sorted.map((item) =>
                      item.id === link.id ? { ...item, href: e.target.value } : item
                    )
                  )
                }
                placeholder="#section or https://..."
                className="sm:col-span-5 px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded"
              />
              <div className="sm:col-span-3 flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onUpdate(
                      sorted.map((item) =>
                        item.id === link.id ? { ...item, visible: !item.visible } : item
                      )
                    )
                  }
                  className="p-1.5 border border-slate-200 rounded cursor-pointer"
                  title="Toggle visibility"
                >
                  {link.visible ? (
                    <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => move(idx, -1)}
                  className="p-1.5 border border-slate-200 rounded disabled:opacity-35 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === sorted.length - 1}
                  onClick={() => move(idx, 1)}
                  className="p-1.5 border border-slate-200 rounded disabled:opacity-35 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate(sorted.filter((item) => item.id !== link.id))}
                  className="p-1.5 text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Navigation Manager</h2>
        <p className="text-sm text-slate-600">
          Add, edit, hide, or reorder navigation links across Header and Footer menus.
        </p>
      </div>

      {renderList('Primary Header Navigation Links', draft.header.navLinks, (next) =>
        onChange({ ...draft, header: { ...draft.header, navLinks: next } })
      )}

      {renderList('Footer Navigation Links', draft.footer.navLinks, (next) =>
        onChange({ ...draft, footer: { ...draft.footer, navLinks: next } })
      )}
    </div>
  );
};

export const ButtonsCopyTab: React.FC<{
  draft: PortfolioSnapshot;
  onChange: (next: PortfolioSnapshot) => void;
}> = ({ draft, onChange }) => {
  const allFonts = [
    ...GOOGLE_FONT_OPTIONS.map((f) => f.name),
    ...draft.typography.customFonts.map((f) => f.family),
  ];

  const updateButton = (key: string, patch: Partial<EditableButton>) => {
    const existing = draft.buttons[key];
    if (!existing) return;
    onChange({
      ...draft,
      buttons: {
        ...draft.buttons,
        [key]: { ...existing, ...patch },
      },
    });
  };

  const buttonEntries = Object.entries(draft.buttons);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Global Button & Static Text Manager
        </h2>
        <p className="text-sm text-slate-600">
          Customize every button label, link, color, hover color, border, radius, typography, padding, and visibility, plus static UI labels.
        </p>
      </div>

      <div className="space-y-4">
        {buttonEntries.map(([key, btn]) => (
          <div key={key} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-slate-900">{btn.label}</div>
                <div className="text-xs font-mono text-slate-500">Button Key: {key}</div>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={btn.visible}
                  onChange={(e) => updateButton(key, { visible: e.target.checked })}
                />
                <span>Visible</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Button Label</label>
                <input
                  type="text"
                  value={btn.label}
                  onChange={(e) => updateButton(key, { label: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Link / Action</label>
                <input
                  type="text"
                  value={btn.href}
                  placeholder="#contact or https://..."
                  onChange={(e) => updateButton(key, { href: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Font Family</label>
                <select
                  value={btn.fontFamily}
                  onChange={(e) => updateButton(key, { fontFamily: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                >
                  <option value="">Inherit Button Font</option>
                  {allFonts.map((fn) => (
                    <option key={fn} value={fn}>
                      {fn}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Size</label>
                  <select
                    value={btn.size}
                    onChange={(e) =>
                      updateButton(key, { size: e.target.value as 'sm' | 'md' | 'lg' })
                    }
                    className="w-full px-2 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Weight</label>
                  <select
                    value={btn.fontWeight}
                    onChange={(e) => updateButton(key, { fontWeight: Number(e.target.value) })}
                    className="w-full px-2 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                  >
                    {[400, 500, 600, 700].map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ColorField
                label="Background Color"
                value={btn.bgColor}
                allowClear
                onChange={(val) => updateButton(key, { bgColor: val })}
              />
              <ColorField
                label="Text Color"
                value={btn.textColor}
                allowClear
                onChange={(val) => updateButton(key, { textColor: val })}
              />
              <ColorField
                label="Hover Background"
                value={btn.hoverBgColor}
                allowClear
                onChange={(val) => updateButton(key, { hoverBgColor: val })}
              />
              <ColorField
                label="Border Color"
                value={btn.borderColor}
                allowClear
                onChange={(val) => updateButton(key, { borderColor: val })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 tabular-nums">
                  Border Radius ({btn.borderRadius}px)
                </label>
                <input
                  type="range"
                  min={0}
                  max={32}
                  value={btn.borderRadius}
                  onChange={(e) => updateButton(key, { borderRadius: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 tabular-nums">
                  Padding X ({btn.paddingX}px)
                </label>
                <input
                  type="range"
                  min={8}
                  max={44}
                  value={btn.paddingX}
                  onChange={(e) => updateButton(key, { paddingX: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 tabular-nums">
                  Padding Y ({btn.paddingY}px)
                </label>
                <input
                  type="range"
                  min={4}
                  max={24}
                  value={btn.paddingY}
                  onChange={(e) => updateButton(key, { paddingY: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Static Copy Labels */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Static Filter & Timeline Headings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Skills Filter All Label</label>
            <input
              type="text"
              value={draft.skillsSection.allCategoryLabel}
              onChange={(e) =>
                onChange({
                  ...draft,
                  skillsSection: { ...draft.skillsSection, allCategoryLabel: e.target.value },
                })
              }
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Projects Filter All Label</label>
            <input
              type="text"
              value={draft.projectsSection.allFilterLabel}
              onChange={(e) =>
                onChange({
                  ...draft,
                  projectsSection: { ...draft.projectsSection, allFilterLabel: e.target.value },
                })
              }
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Experience Heading</label>
            <input
              type="text"
              value={draft.about.experienceTitle}
              onChange={(e) =>
                onChange({
                  ...draft,
                  about: { ...draft.about, experienceTitle: e.target.value },
                })
              }
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Education Heading</label>
            <input
              type="text"
              value={draft.about.educationTitle}
              onChange={(e) =>
                onChange({
                  ...draft,
                  about: { ...draft.about, educationTitle: e.target.value },
                })
              }
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const MediaLibraryTab: React.FC<{
  mediaAssets: MediaAssetItem[];
  onMediaUpdated: (assets: MediaAssetItem[]) => void;
  onAssignHeroPortrait: (url: string) => void;
  onToast: (msg: string) => void;
}> = ({ mediaAssets, onMediaUpdated, onAssignHeroPortrait, onToast }) => {
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const created = await uploadImageAsset(file, file.name);
      onMediaUpdated([created, ...mediaAssets]);
      onToast(`Uploaded ${created.name}`);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const next = await deleteMediaAssetApi(id);
      onMediaUpdated(next);
      onToast('Asset removed from Media Library');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to delete asset');
    }
  };

  const handleCopy = (asset: MediaAssetItem) => {
    navigator.clipboard?.writeText(asset.url);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Media & Asset Library
          </h2>
          <p className="text-sm text-slate-600">
            Upload portfolio photography, project thumbnails, logos, or inspect custom uploaded fonts.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg cursor-pointer hover:bg-slate-800 shrink-0">
          <Upload className="w-3.5 h-3.5" />
          <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.gif,.svg"
            onChange={handleUploadImage}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaAssets.map((asset) => (
          <div
            key={asset.id}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
          >
            {asset.type === 'image' ? (
              <div className="aspect-[16/10] bg-slate-100 overflow-hidden">
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="aspect-[16/10] bg-slate-900 text-white flex flex-col items-center justify-center p-4">
                <span className="text-lg font-semibold">{asset.name}</span>
                <span className="text-xs font-mono opacity-70 mt-1">{asset.mimeType}</span>
              </div>
            )}

            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900 truncate">{asset.name}</div>
                <div className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                  {asset.url}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(asset)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-slate-200 rounded hover:bg-slate-50 cursor-pointer"
                  >
                    {copiedId === asset.id ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedId === asset.id ? 'Copied' : 'Copy URL'}</span>
                  </button>
                  {asset.type === 'image' && (
                    <button
                      type="button"
                      onClick={() => {
                        onAssignHeroPortrait(asset.url);
                        onToast(`Assigned "${asset.name}" as Hero portrait`);
                      }}
                      className="text-xs font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      Use in Hero
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(asset.id)}
                  className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                  aria-label="Delete asset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MessagesTab: React.FC<{
  messages: ContactMessageItem[];
  onMessagesUpdated: (next: ContactMessageItem[]) => void;
  onToast: (msg: string) => void;
}> = ({ messages, onMessagesUpdated, onToast }) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'archived'>('all');
  const [query, setQuery] = useState('');

  const filtered = messages.filter((m) => {
    if (filter !== 'all' && m.status !== filter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStatusChange = async (id: string, status: 'unread' | 'read' | 'archived') => {
    try {
      const updated = await updateMessageApi(id, { status });
      onMessagesUpdated(messages.map((m) => (m.id === id ? updated : m)));
      onToast(`Message marked as ${status}`);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const remaining = await deleteMessageApi(id);
      onMessagesUpdated(remaining);
      onToast('Message deleted');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Contact Message Inbox
          </h2>
          <p className="text-sm text-slate-600">
            Inquiries submitted via your public portfolio contact form, stored in MongoDB.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search inbox..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-lg">
            {(['all', 'unread', 'read', 'archived'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-2.5 py-1 text-xs font-medium capitalize rounded-md cursor-pointer ${
                  filter === tab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-2">
          <Mail className="w-8 h-8 text-slate-300 mx-auto" />
          <div className="text-sm font-medium text-slate-700">No messages match this filter</div>
          <p className="text-xs text-slate-500">
            Visitor submissions from the Contact section will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((msg) => (
            <div key={msg.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{msg.subject}</span>
                    <span className="text-xs font-mono text-slate-500">· {msg.status}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    From <span className="font-medium text-slate-900">{msg.name}</span> ({msg.email}) ·{' '}
                    <span className="tabular-nums font-mono">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {msg.status !== 'read' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(msg.id, 'read')}
                      className="px-2.5 py-1 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
                    >
                      Mark Read
                    </button>
                  )}
                  {msg.status !== 'archived' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(msg.id, 'archived')}
                      className="px-2.5 py-1 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
                    >
                      Archive
                    </button>
                  )}
                  <a
                    href={`mailto:${msg.email}?subject=${encodeURIComponent(`Re: ${msg.subject}`)}`}
                    className="px-2.5 py-1 text-xs font-medium bg-slate-900 text-white rounded-md"
                  >
                    Reply
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(msg.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                    aria-label="Delete message"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line pt-2 border-t border-slate-100">
                {msg.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
