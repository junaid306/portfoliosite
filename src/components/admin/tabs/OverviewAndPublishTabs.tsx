import React, { useState } from 'react';
import {
  CheckCircle2,
  Eye,
  Globe,
  Image as ImageIcon,
  Layers,
  Mail,
  Monitor,
  Palette,
  RotateCcw,
  Save,
  Send,
  Smartphone,
  Tablet,
  Trash2,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import type {
  AdminUserPublic,
  ContactMessageItem,
  MediaAssetItem,
  PortfolioSnapshot,
} from '../../../types/cms';
import { PortfolioRenderer } from '../../PortfolioRenderer';

export const OverviewTab: React.FC<{
  draft: PortfolioSnapshot;
  published: PortfolioSnapshot;
  hasUnpublishedChanges: boolean;
  mediaAssets: MediaAssetItem[];
  messages: ContactMessageItem[];
  dbEngine: 'mongodb' | 'local-store';
  onNavigateTab: (tab: string) => void;
  onPublish: () => void;
  publishing: boolean;
}> = ({
  draft,
  published,
  hasUnpublishedChanges,
  mediaAssets,
  messages,
  dbEngine,
  onNavigateTab,
  onPublish,
  publishing,
}) => {
  const unreadCount = messages.filter((m) => m.status === 'unread').length;
  const enabledThemes = draft.themes.filter((t) => t.enabled).length;

  const stats = [
    { label: 'Projects', value: String(draft.projects.length), hint: `${draft.projects.filter((p) => p.visible).length} visible`, tab: 'content' },
    { label: 'Skills', value: String(draft.skills.length), hint: `${draft.skills.filter((s) => s.visible).length} active`, tab: 'content' },
    { label: 'Active Themes', value: `${enabledThemes} / 6`, hint: draft.themeControl.enableRandomTheme ? 'Random mode on' : 'Fixed default', tab: 'themes' },
    { label: 'Inbox Messages', value: String(messages.length), hint: `${unreadCount} unread`, tab: 'messages' },
    { label: 'Media Assets', value: String(mediaAssets.length), hint: `${draft.typography.customFonts.length} custom fonts`, tab: 'media' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Dashboard Overview</h2>
          <p className="text-sm text-slate-600">
            Database engine: <span className="font-mono text-xs text-slate-800">{dbEngine === 'mongodb' ? 'MongoDB Atlas / Mongoose' : 'Persistent Local MongoDB Collections'}</span> · Last published {new Date(published.updatedAt).toLocaleString()}
          </p>
        </div>

        {hasUnpublishedChanges ? (
          <button
            type="button"
            onClick={onPublish}
            disabled={publishing}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{publishing ? 'Publishing...' : 'Publish Draft Changes'}</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Live Site Synced</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onNavigateTab(s.tab)}
            className="text-left p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer space-y-1"
          >
            <div className="text-xs font-medium text-slate-500">{s.label}</div>
            <div className="text-2xl font-semibold text-slate-900 tabular-nums">{s.value}</div>
            <div className="text-xs text-slate-500">{s.hint}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Quick Studio Controls</h3>
            <span className="text-xs text-slate-500">All edits save to draft before publishing</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: 'Content & Sections', desc: 'Reorder, hide/show, edit Hero, About, Skills, Projects, Contact.', tab: 'content', icon: Layers },
              { title: '6-Theme Manager', desc: 'Customize palettes, enable/disable themes, control random visits.', tab: 'themes', icon: Palette },
              { title: 'Global Design Tokens', desc: 'Override colors, spacing, border radius, and section gradients.', tab: 'design', icon: Eye },
              { title: 'Media & Custom Fonts', desc: 'Upload images and WOFF/WOFF2/TTF typography files.', tab: 'media', icon: ImageIcon },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => onNavigateTab(card.tab)}
                  className="text-left p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Icon className="w-4 h-4 text-slate-600" />
                    <span>{card.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{card.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Recent Contact Messages</h3>
            <button
              type="button"
              onClick={() => onNavigateTab('messages')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Open Inbox
            </button>
          </div>
          {messages.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No visitor inquiries yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {messages.slice(0, 4).map((msg) => (
                <div key={msg.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900 truncate">{msg.name}</span>
                    <span className="text-[11px] font-mono text-slate-500 tabular-nums shrink-0">
                      {msg.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 truncate">{msg.subject}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const PreviewPublishTab: React.FC<{
  draft: PortfolioSnapshot;
  published: PortfolioSnapshot;
  hasUnpublishedChanges: boolean;
  previewThemeId: string;
  onChangePreviewTheme: (id: string) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onResetDefaults: (alsoPublish: boolean) => void;
  saving: boolean;
  publishing: boolean;
  isSuperAdmin: boolean;
}> = ({
  draft,
  published,
  hasUnpublishedChanges,
  previewThemeId,
  onChangePreviewTheme,
  onSaveDraft,
  onPublish,
  onResetDefaults,
  saving,
  publishing,
  isSuperAdmin,
}) => {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Live Preview & Publishing</h2>
          <p className="text-sm text-slate-600">
            Inspect draft changes across viewports and all 6 themes before publishing to the live portfolio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center p-1 bg-slate-100 border border-slate-200 rounded-lg">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                viewport === 'desktop' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setViewport('tablet')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                viewport === 'tablet' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                viewport === 'mobile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
          </div>

          <select
            value={previewThemeId}
            onChange={(e) => onChangePreviewTheme(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-800"
          >
            {draft.themes.map((t) => (
              <option key={t.id} value={t.id}>
                Theme: {t.name} {t.enabled ? '' : '(Disabled)'}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onSaveDraft}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={onPublish}
            disabled={publishing}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{publishing ? 'Publishing...' : 'Publish Live'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <div className="text-xs text-slate-500">Sync Status</div>
          <div className="text-sm font-semibold text-slate-900">
            {hasUnpublishedChanges ? 'Draft contains unpublished edits' : 'Draft matches published live site'}
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <div className="text-xs text-slate-500">Draft Timestamp</div>
          <div className="text-sm font-mono tabular-nums text-slate-900">
            {new Date(draft.updatedAt).toLocaleString()}
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <div className="text-xs text-slate-500">Published Timestamp</div>
          <div className="text-sm font-mono tabular-nums text-slate-900">
            {new Date(published.updatedAt).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="bg-slate-200/70 border border-slate-300 rounded-xl p-4 overflow-x-auto flex justify-center">
        <div
          className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm transition-all duration-200"
          style={{
            width: viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '390px',
            maxHeight: '720px',
            overflowY: 'auto',
          }}
        >
          <PortfolioRenderer
            snapshot={draft}
            activeThemeId={previewThemeId}
            onSelectTheme={onChangePreviewTheme}
            previewMode
            forcedViewport={viewport === 'mobile' ? 'mobile' : undefined}
          />
        </div>
      </div>

      {isSuperAdmin && (
        <div className="p-5 bg-white border border-red-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <span>Reset to Default Settings</span>
            </div>
            <p className="text-xs text-slate-600">
              Restore all sections, 6 themes, typography, and global design tokens back to factory defaults.
            </p>
          </div>
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-red-700 border border-red-300 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onResetDefaults(false);
                  setConfirmReset(false);
                }}
                className="px-3 py-2 text-xs font-medium bg-red-600 text-white rounded-lg cursor-pointer"
              >
                Reset Draft Only
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetDefaults(true);
                  setConfirmReset(false);
                }}
                className="px-3 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg cursor-pointer"
              >
                Reset & Publish
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const SeoTab: React.FC<{
  draft: PortfolioSnapshot;
  onChange: (next: PortfolioSnapshot) => void;
}> = ({ draft, onChange }) => {
  const updateSeo = (patch: Partial<PortfolioSnapshot['seo']>) =>
    onChange({ ...draft, seo: { ...draft.seo, ...patch } });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">SEO & Metadata</h2>
        <p className="text-sm text-slate-600">
          Configure search engine titles, OpenGraph social sharing tags, and canonical metadata.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Site Title</label>
            <input
              type="text"
              value={draft.siteTitle}
              onChange={(e) => onChange({ ...draft, siteTitle: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Tagline</label>
            <input
              type="text"
              value={draft.tagline}
              onChange={(e) => onChange({ ...draft, tagline: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">HTML Meta Title</label>
          <input
            type="text"
            value={draft.seo.metaTitle}
            onChange={(e) => updateSeo({ metaTitle: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">Meta Description</label>
          <textarea
            rows={3}
            value={draft.seo.metaDescription}
            onChange={(e) => updateSeo({ metaDescription: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">OpenGraph Title</label>
            <input
              type="text"
              value={draft.seo.ogTitle}
              onChange={(e) => updateSeo({ ogTitle: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Canonical URL</label>
            <input
              type="text"
              value={draft.seo.canonicalUrl}
              onChange={(e) => updateSeo({ canonicalUrl: e.target.value })}
              placeholder="https://ateliervance.studio"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">OpenGraph Description</label>
          <textarea
            rows={2}
            value={draft.seo.ogDescription}
            onChange={(e) => updateSeo({ ogDescription: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">Keywords (comma-separated)</label>
          <input
            type="text"
            value={draft.seo.keywords}
            onChange={(e) => updateSeo({ keywords: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

export const TeamUsersTab: React.FC<{
  users: AdminUserPublic[];
  currentUserId: string;
  onCreateUser: (input: { name: string; email: string; password: string; role: 'super_admin' | 'editor' }) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}> = ({ users, currentUserId, onCreateUser, onDeleteUser }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'editor' as 'super_admin' | 'editor' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onCreateUser(form);
      setForm({ name: '', email: '', password: '', role: 'editor' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add user.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Team & Role-Based Access</h2>
        <p className="text-sm text-slate-600">
          Super Admins manage team accounts, system resets, and full design settings. Editors manage content, media, and drafts.
        </p>
      </div>

      <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          <span>Add Admin User</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            required
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Password (min 8 chars)"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as 'super_admin' | 'editor' }))}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
          >
            <option value="editor">Editor</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        {error && <div className="text-xs text-red-600">{error}</div>}
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg cursor-pointer"
        >
          {submitting ? 'Creating...' : 'Create Account'}
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{u.email}</td>
                <td className="px-4 py-3 text-xs text-slate-700">{u.role}</td>
                <td className="px-4 py-3 text-right">
                  {u.id !== currentUserId ? (
                    <button
                      type="button"
                      onClick={() => onDeleteUser(u.id)}
                      className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Active session</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
