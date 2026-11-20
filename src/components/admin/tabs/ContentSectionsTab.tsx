import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import { GOOGLE_FONT_OPTIONS } from '../../../data/defaultPortfolioSeed';
import type {
  MediaAssetItem,
  PortfolioSnapshot,
  ProjectItem,
  SkillItem,
} from '../../../types/cms';
import { deleteProjectApi, deleteSkillApi, saveProjectApi, saveSkillApi } from '../../../utils/apiClient';
import { ColorField } from '../ColorField';

type ContentSubTab = 'sections' | 'hero' | 'about' | 'skills' | 'projects' | 'contact';

export const ContentSectionsTab: React.FC<{
  draft: PortfolioSnapshot;
  mediaAssets: MediaAssetItem[];
  onChange: (next: PortfolioSnapshot) => void;
  onToast: (msg: string) => void;
}> = ({ draft, mediaAssets, onChange, onToast }) => {
  const [subTab, setSubTab] = useState<ContentSubTab>('sections');
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [isNewProject, setIsNewProject] = useState(false);
  const [techInput, setTechInput] = useState('');

  const [editingSkill, setEditingSkill] = useState<SkillItem | null>(null);
  const [isNewSkill, setIsNewSkill] = useState(false);

  const imageAssets = mediaAssets.filter((m) => m.type === 'image');
  const allFonts = [
    ...GOOGLE_FONT_OPTIONS.map((f) => f.name),
    ...draft.typography.customFonts.map((f) => f.family),
  ];

  const sortedSections = [...draft.sections].sort((a, b) => a.order - b.order);

  const moveSection = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sortedSections.length) return;
    const copy = [...sortedSections];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    const reordered = copy.map((sec, idx) => ({ ...sec, order: idx + 1 }));
    onChange({ ...draft, sections: reordered });
  };

  const updateSection = (id: string, patch: Partial<PortfolioSnapshot['sections'][number]>) => {
    onChange({
      ...draft,
      sections: draft.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    try {
      const normalized: ProjectItem = {
        ...editingProject,
        technologies: techInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };
      const updated = await saveProjectApi(normalized, isNewProject);
      onChange(updated);
      setEditingProject(null);
      onToast(isNewProject ? 'Project added to draft' : 'Project updated in draft');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to save project');
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const updated = await deleteProjectApi(id);
      onChange(updated);
      onToast('Project removed from draft');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const handleSaveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSkill) return;
    try {
      const updated = await saveSkillApi(editingSkill, isNewSkill);
      onChange(updated);
      setEditingSkill(null);
      onToast(isNewSkill ? 'Skill added to draft' : 'Skill updated in draft');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to save skill');
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      const updated = await deleteSkillApi(id);
      onChange(updated);
      onToast('Skill removed from draft');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to delete skill');
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Content & Section Management
          </h2>
          <p className="text-sm text-slate-600">
            Reorder, show/hide, and edit every website section, project, skill, and contact detail.
          </p>
        </div>

        <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg self-start">
          {(
            [
              ['sections', 'Section Order & Layout'],
              ['hero', 'Hero'],
              ['about', 'About'],
              ['skills', 'Skills'],
              ['projects', 'Projects'],
              ['contact', 'Contact'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSubTab(id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap shrink-0 ${
                subTab === id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-tab 1: Section Order & Visibility */}
      {subTab === 'sections' && (
        <div className="space-y-4">
          {sortedSections.map((sec, idx) => (
            <div
              key={sec.id}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono tabular-nums px-2 py-1 bg-slate-100 rounded text-slate-700">
                    0{idx + 1}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{sec.label} Section</div>
                    <div className="text-xs text-slate-500">Key: {sec.key}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateSection(sec.id, { visible: !sec.visible })}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                      sec.visible
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-100 text-slate-600'
                    }`}
                  >
                    {sec.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{sec.visible ? 'Visible' : 'Hidden'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveSection(idx, -1)}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    aria-label="Move section up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === sortedSections.length - 1}
                    onClick={() => moveSection(idx, 1)}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    aria-label="Move section down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Section Heading</label>
                  <input
                    type="text"
                    value={sec.title}
                    onChange={(e) => updateSection(sec.id, { title: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Section Font Override</label>
                  <select
                    value={sec.customFont}
                    onChange={(e) => updateSection(sec.id, { customFont: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="">Use Global / Theme Font</option>
                    {allFonts.map((fn) => (
                      <option key={fn} value={fn}>
                        {fn}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 tabular-nums">
                    Vertical Padding ({sec.paddingY}px)
                  </label>
                  <input
                    type="range"
                    min={32}
                    max={140}
                    value={sec.paddingY}
                    onChange={(e) => updateSection(sec.id, { paddingY: Number(e.target.value) })}
                    className="w-full mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ColorField
                  label="Section Background"
                  value={sec.bgColor}
                  allowClear
                  onChange={(val) => updateSection(sec.id, { bgColor: val })}
                />
                <ColorField
                  label="Section Text Color"
                  value={sec.textColor}
                  allowClear
                  onChange={(val) => updateSection(sec.id, { textColor: val })}
                />
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Custom Gradient CSS</label>
                  <input
                    type="text"
                    value={sec.bgGradient}
                    placeholder="Optional linear-gradient(...)"
                    onChange={(e) => updateSection(sec.id, { bgGradient: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sub-tab 2: Hero */}
      {subTab === 'hero' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Kicker / Eyebrow</label>
              <input
                type="text"
                value={draft.hero.kicker}
                onChange={(e) =>
                  onChange({ ...draft, hero: { ...draft.hero, kicker: e.target.value } })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Subtitle</label>
              <input
                type="text"
                value={draft.hero.subtitle}
                onChange={(e) =>
                  onChange({ ...draft, hero: { ...draft.hero, subtitle: e.target.value } })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Hero Heading (H1)</label>
            <input
              type="text"
              value={draft.hero.heading}
              onChange={(e) =>
                onChange({ ...draft, hero: { ...draft.hero, heading: e.target.value } })
              }
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Introduction Copy</label>
            <textarea
              rows={3}
              value={draft.hero.introduction}
              onChange={(e) =>
                onChange({ ...draft, hero: { ...draft.hero, introduction: e.target.value } })
              }
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Profile Image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={draft.hero.profileImageUrl}
                  onChange={(e) =>
                    onChange({ ...draft, hero: { ...draft.hero, profileImageUrl: e.target.value } })
                  }
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                />
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      onChange({
                        ...draft,
                        hero: { ...draft.hero, profileImageUrl: e.target.value },
                      });
                    }
                  }}
                  className="px-2 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50"
                >
                  <option value="">Media...</option>
                  {imageAssets.map((a) => (
                    <option key={a.id} value={a.url}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700">Hero Background Image URL</label>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.hero.showBackgroundImage}
                    onChange={(e) =>
                      onChange({
                        ...draft,
                        hero: { ...draft.hero, showBackgroundImage: e.target.checked },
                      })
                    }
                  />
                  <span>Enable BG Image</span>
                </label>
              </div>
              <input
                type="text"
                value={draft.hero.backgroundImageUrl}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    hero: { ...draft.hero, backgroundImageUrl: e.target.value },
                  })
                }
                placeholder="Optional backdrop image URL"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Hero Layout</label>
              <select
                value={draft.hero.layout}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    hero: { ...draft.hero, layout: e.target.value as 'split' | 'centered' | 'editorial' },
                  })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
              >
                <option value="split">Split Two-Column</option>
                <option value="centered">Centered Editorial</option>
                <option value="editorial">Editorial Wide</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Text Alignment</label>
              <select
                value={draft.hero.alignment}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    hero: { ...draft.hero, alignment: e.target.value as 'left' | 'center' | 'split' },
                  })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
              >
                <option value="left">Left</option>
                <option value="center">Centered</option>
                <option value="split">Split</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 tabular-nums">
                Hero Spacing Y ({draft.hero.spacingY}px)
              </label>
              <input
                type="range"
                min={32}
                max={140}
                value={draft.hero.spacingY}
                onChange={(e) =>
                  onChange({ ...draft, hero: { ...draft.hero, spacingY: Number(e.target.value) } })
                }
                className="w-full mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ColorField
              label="Heading Color"
              value={draft.hero.headingColor}
              allowClear
              onChange={(val) =>
                onChange({ ...draft, hero: { ...draft.hero, headingColor: val } })
              }
            />
            <ColorField
              label="Subtitle / Kicker Color"
              value={draft.hero.subtitleColor}
              allowClear
              onChange={(val) =>
                onChange({ ...draft, hero: { ...draft.hero, subtitleColor: val } })
              }
            />
            <ColorField
              label="Intro Copy Color"
              value={draft.hero.bodyColor}
              allowClear
              onChange={(val) =>
                onChange({ ...draft, hero: { ...draft.hero, bodyColor: val } })
              }
            />
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Hero KPI Strip Metrics
              </h4>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...draft,
                    hero: {
                      ...draft.hero,
                      metrics: [
                        ...draft.hero.metrics,
                        { id: `m-${Date.now()}`, value: '100%', label: 'New Metric' },
                      ],
                    },
                  })
                }
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-800 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Metric</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {draft.hero.metrics.map((m) => (
                <div key={m.id} className="p-3 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={m.value}
                      onChange={(e) =>
                        onChange({
                          ...draft,
                          hero: {
                            ...draft.hero,
                            metrics: draft.hero.metrics.map((item) =>
                              item.id === m.id ? { ...item, value: e.target.value } : item
                            ),
                          },
                        })
                      }
                      className="w-full px-2 py-1 text-sm font-semibold border border-slate-200 rounded"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...draft,
                          hero: {
                            ...draft.hero,
                            metrics: draft.hero.metrics.filter((item) => item.id !== m.id),
                          },
                        })
                      }
                      className="text-red-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={m.label}
                    onChange={(e) =>
                      onChange({
                        ...draft,
                        hero: {
                          ...draft.hero,
                          metrics: draft.hero.metrics.map((item) =>
                            item.id === m.id ? { ...item, label: e.target.value } : item
                          ),
                        },
                      })
                    }
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 3: About */}
      {subTab === 'about' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">About Title</label>
              <input
                type="text"
                value={draft.about.sectionTitle}
                onChange={(e) =>
                  onChange({ ...draft, about: { ...draft.about, sectionTitle: e.target.value } })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Subtitle</label>
              <input
                type="text"
                value={draft.about.subtitle}
                onChange={(e) =>
                  onChange({ ...draft, about: { ...draft.about, subtitle: e.target.value } })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Lead Description</label>
            <input
              type="text"
              value={draft.about.description}
              onChange={(e) =>
                onChange({ ...draft, about: { ...draft.about, description: e.target.value } })
              }
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Full Biography</label>
            <textarea
              rows={5}
              value={draft.about.biography}
              onChange={(e) =>
                onChange({ ...draft, about: { ...draft.about, biography: e.target.value } })
              }
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Location</label>
              <input
                type="text"
                value={draft.about.location}
                onChange={(e) =>
                  onChange({ ...draft, about: { ...draft.about, location: e.target.value } })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Availability</label>
              <input
                type="text"
                value={draft.about.availability}
                onChange={(e) =>
                  onChange({ ...draft, about: { ...draft.about, availability: e.target.value } })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Contact Email</label>
              <input
                type="text"
                value={draft.about.email}
                onChange={(e) =>
                  onChange({ ...draft, about: { ...draft.about, email: e.target.value } })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">About Portrait Image URL</label>
              <input
                type="text"
                value={draft.about.portraitImageUrl}
                onChange={(e) =>
                  onChange({ ...draft, about: { ...draft.about, portraitImageUrl: e.target.value } })
                }
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
              />
            </div>
            <ColorField
              label="Section Background"
              value={draft.about.bgColor}
              allowClear
              onChange={(val) =>
                onChange({ ...draft, about: { ...draft.about, bgColor: val } })
              }
            />
            <label className="inline-flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={draft.about.showIcons}
                onChange={(e) =>
                  onChange({ ...draft, about: { ...draft.about, showIcons: e.target.checked } })
                }
              />
              <span>Show Info Icons</span>
            </label>
          </div>

          {/* Experience & Education CRUD */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Experience Timeline
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...draft,
                      about: {
                        ...draft.about,
                        experience: [
                          ...draft.about.experience,
                          {
                            id: `exp-${Date.now()}`,
                            company: 'New Organization',
                            role: 'Role Title',
                            period: '2026 — Present',
                            summary: 'Describe key architectural contributions.',
                          },
                        ],
                      },
                    })
                  }
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-900 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Role</span>
                </button>
              </div>
              {draft.about.experience.map((exp) => (
                <div key={exp.id} className="p-3 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) =>
                        onChange({
                          ...draft,
                          about: {
                            ...draft.about,
                            experience: draft.about.experience.map((item) =>
                              item.id === exp.id ? { ...item, role: e.target.value } : item
                            ),
                          },
                        })
                      }
                      className="w-full px-2 py-1 text-xs font-semibold border border-slate-200 rounded"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...draft,
                          about: {
                            ...draft.about,
                            experience: draft.about.experience.filter((item) => item.id !== exp.id),
                          },
                        })
                      }
                      className="text-red-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) =>
                        onChange({
                          ...draft,
                          about: {
                            ...draft.about,
                            experience: draft.about.experience.map((item) =>
                              item.id === exp.id ? { ...item, company: e.target.value } : item
                            ),
                          },
                        })
                      }
                      className="px-2 py-1 text-xs border border-slate-200 rounded"
                    />
                    <input
                      type="text"
                      value={exp.period}
                      onChange={(e) =>
                        onChange({
                          ...draft,
                          about: {
                            ...draft.about,
                            experience: draft.about.experience.map((item) =>
                              item.id === exp.id ? { ...item, period: e.target.value } : item
                            ),
                          },
                        })
                      }
                      className="px-2 py-1 text-xs border border-slate-200 rounded"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={exp.summary}
                    onChange={(e) =>
                      onChange({
                        ...draft,
                        about: {
                          ...draft.about,
                          experience: draft.about.experience.map((item) =>
                            item.id === exp.id ? { ...item, summary: e.target.value } : item
                          ),
                        },
                      })
                    }
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Education Timeline
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...draft,
                      about: {
                        ...draft.about,
                        education: [
                          ...draft.about.education,
                          {
                            id: `edu-${Date.now()}`,
                            institution: 'University / Institute',
                            degree: 'Degree Program',
                            period: '2020 — 2024',
                            details: 'Focus area and honors.',
                          },
                        ],
                      },
                    })
                  }
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-900 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Education</span>
                </button>
              </div>
              {draft.about.education.map((edu) => (
                <div key={edu.id} className="p-3 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) =>
                        onChange({
                          ...draft,
                          about: {
                            ...draft.about,
                            education: draft.about.education.map((item) =>
                              item.id === edu.id ? { ...item, institution: e.target.value } : item
                            ),
                          },
                        })
                      }
                      className="w-full px-2 py-1 text-xs font-semibold border border-slate-200 rounded"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...draft,
                          about: {
                            ...draft.about,
                            education: draft.about.education.filter((item) => item.id !== edu.id),
                          },
                        })
                      }
                      className="text-red-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) =>
                        onChange({
                          ...draft,
                          about: {
                            ...draft.about,
                            education: draft.about.education.map((item) =>
                              item.id === edu.id ? { ...item, degree: e.target.value } : item
                            ),
                          },
                        })
                      }
                      className="px-2 py-1 text-xs border border-slate-200 rounded"
                    />
                    <input
                      type="text"
                      value={edu.period}
                      onChange={(e) =>
                        onChange({
                          ...draft,
                          about: {
                            ...draft.about,
                            education: draft.about.education.map((item) =>
                              item.id === edu.id ? { ...item, period: e.target.value } : item
                            ),
                          },
                        })
                      }
                      className="px-2 py-1 text-xs border border-slate-200 rounded"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={edu.details}
                    onChange={(e) =>
                      onChange({
                        ...draft,
                        about: {
                          ...draft.about,
                          education: draft.about.education.map((item) =>
                            item.id === edu.id ? { ...item, details: e.target.value } : item
                          ),
                        },
                      })
                    }
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 4: Skills CRUD & Card Colors */}
      {subTab === 'skills' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Skills Section Styling</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <ColorField
                label="Card Background"
                value={draft.skillsSection.cardBg}
                allowClear
                onChange={(val) =>
                  onChange({ ...draft, skillsSection: { ...draft.skillsSection, cardBg: val } })
                }
              />
              <ColorField
                label="Card Border"
                value={draft.skillsSection.cardBorder}
                allowClear
                onChange={(val) =>
                  onChange({ ...draft, skillsSection: { ...draft.skillsSection, cardBorder: val } })
                }
              />
              <ColorField
                label="Card Text"
                value={draft.skillsSection.cardText}
                allowClear
                onChange={(val) =>
                  onChange({ ...draft, skillsSection: { ...draft.skillsSection, cardText: val } })
                }
              />
              <ColorField
                label="Progress Track"
                value={draft.skillsSection.progressBg}
                allowClear
                onChange={(val) =>
                  onChange({ ...draft, skillsSection: { ...draft.skillsSection, progressBg: val } })
                }
              />
              <ColorField
                label="Progress Fill"
                value={draft.skillsSection.progressFill}
                allowClear
                onChange={(val) =>
                  onChange({
                    ...draft,
                    skillsSection: { ...draft.skillsSection, progressFill: val },
                  })
                }
              />
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.skillsSection.showPercentages}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    skillsSection: { ...draft.skillsSection, showPercentages: e.target.checked },
                  })
                }
              />
              <span>Display Skill Percentage Numbers</span>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Skills List ({draft.skills.length})</h3>
            <button
              type="button"
              onClick={() => {
                setIsNewSkill(true);
                setEditingSkill({
                  id: `sk-${Date.now()}`,
                  name: '',
                  category: 'Engineering',
                  iconName: 'Code2',
                  percentage: 85,
                  order: draft.skills.length + 1,
                  visible: true,
                });
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Skill</span>
            </button>
          </div>

          {editingSkill && (
            <form
              onSubmit={handleSaveSkill}
              className="bg-white border border-slate-900 rounded-xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">
                  {isNewSkill ? 'Add New Skill' : `Edit Skill: ${editingSkill.name}`}
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingSkill(null)}
                  className="p-1 text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Skill Name"
                  value={editingSkill.name}
                  onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  required
                  placeholder="Category (e.g. Design)"
                  value={editingSkill.category}
                  onChange={(e) => setEditingSkill({ ...editingSkill, category: e.target.value })}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
                <select
                  value={editingSkill.iconName}
                  onChange={(e) => setEditingSkill({ ...editingSkill, iconName: e.target.value })}
                  className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                >
                  {['Code2', 'Layers', 'Database', 'Type', 'Cpu', 'ShieldCheck', 'Terminal', 'Palette', 'Globe', 'Zap', 'Compass'].map(
                    (ic) => (
                      <option key={ic} value={ic}>
                        Icon: {ic}
                      </option>
                    )
                  )}
                </select>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Proficiency</span>
                    <span className="font-mono tabular-nums">{editingSkill.percentage}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={editingSkill.percentage}
                    onChange={(e) =>
                      setEditingSkill({ ...editingSkill, percentage: Number(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Skill to Draft</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSkill(null)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Skill</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Level</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {draft.skills.map((sk) => (
                  <tr key={sk.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{sk.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{sk.category}</td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums">{sk.percentage}%</td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewSkill(false);
                          setEditingSkill(sk);
                        }}
                        className="text-xs font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSkill(sk.id)}
                        className="text-xs font-medium text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-tab 5: Projects CRUD & Card Styling */}
      {subTab === 'projects' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Project Card & Button Styling</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ColorField
                label="Card Background"
                value={draft.projectsSection.cardBg}
                allowClear
                onChange={(val) =>
                  onChange({ ...draft, projectsSection: { ...draft.projectsSection, cardBg: val } })
                }
              />
              <ColorField
                label="Card Border"
                value={draft.projectsSection.cardBorder}
                allowClear
                onChange={(val) =>
                  onChange({
                    ...draft,
                    projectsSection: { ...draft.projectsSection, cardBorder: val },
                  })
                }
              />
              <ColorField
                label="Card Text"
                value={draft.projectsSection.cardText}
                allowClear
                onChange={(val) =>
                  onChange({
                    ...draft,
                    projectsSection: { ...draft.projectsSection, cardText: val },
                  })
                }
              />
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 tabular-nums">
                  Card Button Radius ({draft.projectsSection.buttonRadius}px)
                </label>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={draft.projectsSection.buttonRadius}
                  onChange={(e) =>
                    onChange({
                      ...draft,
                      projectsSection: {
                        ...draft.projectsSection,
                        buttonRadius: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full mt-2"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Live Demo Button Text</label>
                <input
                  type="text"
                  value={draft.projectsSection.liveButtonText}
                  onChange={(e) =>
                    onChange({
                      ...draft,
                      projectsSection: { ...draft.projectsSection, liveButtonText: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <ColorField
                label="Live Demo Bg"
                value={draft.projectsSection.liveButtonBg}
                allowClear
                onChange={(val) =>
                  onChange({
                    ...draft,
                    projectsSection: { ...draft.projectsSection, liveButtonBg: val },
                  })
                }
              />
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">GitHub Button Text</label>
                <input
                  type="text"
                  value={draft.projectsSection.githubButtonText}
                  onChange={(e) =>
                    onChange({
                      ...draft,
                      projectsSection: {
                        ...draft.projectsSection,
                        githubButtonText: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <ColorField
                label="GitHub Button Bg"
                value={draft.projectsSection.githubButtonBg}
                allowClear
                onChange={(val) =>
                  onChange({
                    ...draft,
                    projectsSection: { ...draft.projectsSection, githubButtonBg: val },
                  })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Portfolio Projects ({draft.projects.length})
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsNewProject(true);
                setTechInput('React, TypeScript, MongoDB');
                setEditingProject({
                  id: `proj-${Date.now()}`,
                  title: '',
                  category: 'Product Systems',
                  year: '2026',
                  client: '',
                  description: '',
                  imageUrl: imageAssets[0]?.url || '',
                  technologies: ['React', 'TypeScript'],
                  githubUrl: 'https://github.com',
                  liveDemoUrl: 'https://example.com',
                  featured: false,
                  order: draft.projects.length + 1,
                  visible: true,
                });
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          </div>

          {editingProject && (
            <form
              onSubmit={handleSaveProject}
              className="bg-white border border-slate-900 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">
                  {isNewProject ? 'New Project' : `Editing: ${editingProject.title}`}
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="p-1 text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Project Title"
                  value={editingProject.title}
                  onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                  className="md:col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  required
                  placeholder="Category"
                  value={editingProject.category}
                  onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Year"
                  value={editingProject.year}
                  onChange={(e) => setEditingProject({ ...editingProject, year: e.target.value })}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Client / Organization"
                  value={editingProject.client}
                  onChange={(e) => setEditingProject({ ...editingProject, client: e.target.value })}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Technologies (comma-separated)"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Image URL"
                    value={editingProject.imageUrl}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, imageUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                  />
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        setEditingProject({ ...editingProject, imageUrl: e.target.value });
                      }
                    }}
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
                <input
                  type="text"
                  placeholder="Live Demo URL"
                  value={editingProject.liveDemoUrl}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, liveDemoUrl: e.target.value })
                  }
                  className="px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="GitHub URL"
                  value={editingProject.githubUrl}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, githubUrl: e.target.value })
                  }
                  className="px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                />
              </div>

              <textarea
                rows={3}
                placeholder="Project Description"
                value={editingProject.description}
                onChange={(e) =>
                  setEditingProject({ ...editingProject, description: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />

              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProject.visible}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, visible: e.target.checked })
                    }
                  />
                  <span>Visible on Portfolio</span>
                </label>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg cursor-pointer"
                >
                  Save Project
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {draft.projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
              >
                <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
                  {proj.imageUrl && (
                    <img
                      src={proj.imageUrl}
                      alt={proj.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <div className="text-xs font-mono text-slate-500">
                      {proj.category} · {proj.year} {proj.visible ? '' : '· Hidden'}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 mt-0.5">{proj.title}</div>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1">{proj.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-mono text-slate-500 truncate">
                      {proj.technologies.join(' · ')}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewProject(false);
                          setEditingProject(proj);
                          setTechInput(proj.technologies.join(', '));
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(proj.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-tab 6: Contact Section */}
      {subTab === 'contact' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={draft.contact.email}
                onChange={(e) =>
                  onChange({ ...draft, contact: { ...draft.contact, email: e.target.value } })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Phone</label>
              <input
                type="text"
                value={draft.contact.phone}
                onChange={(e) =>
                  onChange({ ...draft, contact: { ...draft.contact, phone: e.target.value } })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Address</label>
              <input
                type="text"
                value={draft.contact.address}
                onChange={(e) =>
                  onChange({ ...draft, contact: { ...draft.contact, address: e.target.value } })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Layout Style</label>
              <select
                value={draft.contact.layout}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    contact: { ...draft.contact, layout: e.target.value as 'split' | 'centered' },
                  })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
              >
                <option value="split">Split Two-Column</option>
                <option value="centered">Centered Single Column</option>
              </select>
            </div>
            <ColorField
              label="Contact Background"
              value={draft.contact.bgColor}
              allowClear
              onChange={(val) =>
                onChange({ ...draft, contact: { ...draft.contact, bgColor: val } })
              }
            />
            <label className="inline-flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg text-xs font-medium self-end cursor-pointer">
              <input
                type="checkbox"
                checked={draft.contact.showIcons}
                onChange={(e) =>
                  onChange({ ...draft, contact: { ...draft.contact, showIcons: e.target.checked } })
                }
              />
              <span>Show Contact Icons</span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Form Labels & Placeholder Text
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(
                [
                  ['nameLabel', 'Name Field Label'],
                  ['namePlaceholder', 'Name Placeholder'],
                  ['emailLabel', 'Email Field Label'],
                  ['emailPlaceholder', 'Email Placeholder'],
                  ['subjectLabel', 'Subject Field Label'],
                  ['subjectPlaceholder', 'Subject Placeholder'],
                  ['messageLabel', 'Message Field Label'],
                  ['messagePlaceholder', 'Message Placeholder'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">{label}</label>
                  <input
                    type="text"
                    value={draft.contact.formLabels[key]}
                    onChange={(e) =>
                      onChange({
                        ...draft,
                        contact: {
                          ...draft.contact,
                          formLabels: { ...draft.contact.formLabels, [key]: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Submission Confirmation Copy</label>
              <input
                type="text"
                value={draft.contact.formLabels.successMessage}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    contact: {
                      ...draft.contact,
                      formLabels: { ...draft.contact.formLabels, successMessage: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
