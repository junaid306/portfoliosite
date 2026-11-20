import React, { useEffect, useState } from 'react';
import {
  Compass,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MousePointerClick,
  Palette,
  PanelTop,
  Save,
  Send,
  Shield,
  Sliders,
  Type,
  X,
} from 'lucide-react';
import type {
  AdminUserPublic,
  ContactMessageItem,
  MediaAssetItem,
  PortfolioSnapshot,
} from '../../types/cms';
import {
  createUserApi,
  deleteUserApi,
  fetchAdminBootstrap,
  fetchCurrentUser,
  getStoredToken,
  publishDraft,
  resetToDefaults,
  saveDraft,
  setStoredToken,
} from '../../utils/apiClient';
import { PortfolioRenderer } from '../PortfolioRenderer';
import { AdminLogin } from './AdminLogin';
import { ContentSectionsTab } from './tabs/ContentSectionsTab';
import {
  GlobalDesignTab,
  ThemeManagerTab,
  TypographyTab,
} from './tabs/DesignThemeTypographyTabs';
import {
  ButtonsCopyTab,
  HeaderFooterTab,
  MediaLibraryTab,
  MessagesTab,
  NavigationTab,
} from './tabs/HeaderFooterNavButtonsMediaMessagesTabs';
import {
  OverviewTab,
  PreviewPublishTab,
  SeoTab,
  TeamUsersTab,
} from './tabs/OverviewAndPublishTabs';

interface AdminDashboardProps {
  onNavigatePublic: () => void;
  onPublishedUpdated: (published: PortfolioSnapshot) => void;
}

type AdminTabId =
  | 'overview'
  | 'content'
  | 'themes'
  | 'design'
  | 'typography'
  | 'header-footer'
  | 'navigation'
  | 'buttons'
  | 'media'
  | 'seo'
  | 'messages'
  | 'preview'
  | 'team';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigatePublic,
  onPublishedUpdated,
}) => {
  const [user, setUser] = useState<AdminUserPublic | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [draft, setDraft] = useState<PortfolioSnapshot | null>(null);
  const [published, setPublished] = useState<PortfolioSnapshot | null>(null);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  const [mediaAssets, setMediaAssets] = useState<MediaAssetItem[]>([]);
  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [users, setUsers] = useState<AdminUserPublic[]>([]);
  const [dbEngine, setDbEngine] = useState<'mongodb' | 'local-store'>('local-store');

  const [activeTab, setActiveTab] = useState<AdminTabId>('overview');
  const [previewThemeId, setPreviewThemeId] = useState<string>('nordic-monograph');
  const [splitPreviewOpen, setSplitPreviewOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((curr) => (curr === msg ? null : curr)), 3200);
  };

  const loadWorkspace = async () => {
    const data = await fetchAdminBootstrap();
    setDraft(data.draft);
    setPublished(data.published);
    setHasUnpublishedChanges(data.hasUnpublishedChanges);
    setMediaAssets(data.mediaAssets);
    setMessages(data.messages);
    setUsers(data.users);
    setDbEngine(data.dbEngine);
    setPreviewThemeId(data.draft.themeControl.defaultThemeId || data.draft.themes[0]?.id || '');
  };

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthChecking(false);
      return;
    }
    fetchCurrentUser()
      .then(async (u) => {
        setUser(u);
        await loadWorkspace();
      })
      .catch(() => {
        setStoredToken(null);
      })
      .finally(() => setAuthChecking(false));
  }, []);

  const handleLoginSuccess = async (loggedInUser: AdminUserPublic) => {
    setUser(loggedInUser);
    await loadWorkspace();
  };

  const handleSignOut = () => {
    setStoredToken(null);
    setUser(null);
    setDraft(null);
  };

  const handleDraftChange = (next: PortfolioSnapshot) => {
    setDraft(next);
    setHasUnpublishedChanges(true);
  };

  const handleSaveDraft = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await saveDraft(draft);
      setDraft(res.draft);
      setHasUnpublishedChanges(res.hasUnpublishedChanges);
      showToast('Draft saved to database');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!draft) return;
    setPublishing(true);
    try {
      await saveDraft(draft);
      const res = await publishDraft();
      setPublished(res.published);
      setHasUnpublishedChanges(false);
      onPublishedUpdated(res.published);
      showToast('Published changes to live portfolio');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const handleResetDefaults = async (alsoPublish: boolean) => {
    try {
      const res = await resetToDefaults(alsoPublish);
      setDraft(res.draft);
      setPublished(res.published);
      setHasUnpublishedChanges(res.hasUnpublishedChanges);
      if (alsoPublish) {
        onPublishedUpdated(res.published);
      }
      showToast(alsoPublish ? 'Reset defaults and published live' : 'Reset draft to defaults');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Reset failed');
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-600">
        Verifying admin session...
      </div>
    );
  }

  if (!user) {
    return <AdminLogin onSuccess={handleLoginSuccess} onBackToSite={onNavigatePublic} />;
  }

  if (!draft || !published) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-600">
        Loading CMS workspace...
      </div>
    );
  }

  const unreadCount = messages.filter((m) => m.status === 'unread').length;

  const navItems: Array<{
    id: AdminTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'content', label: 'Content & Sections', icon: Layers },
    { id: 'themes', label: '6-Theme Manager', icon: Palette },
    { id: 'design', label: 'Global Design', icon: Sliders },
    { id: 'typography', label: 'Typography & Fonts', icon: Type },
    { id: 'header-footer', label: 'Header & Footer', icon: PanelTop },
    { id: 'navigation', label: 'Navigation', icon: Compass },
    { id: 'buttons', label: 'Buttons & Copy', icon: MousePointerClick },
    { id: 'media', label: 'Media Library', icon: ImageIcon },
    { id: 'seo', label: 'SEO Settings', icon: Globe },
    { id: 'messages', label: 'Messages', icon: Mail, badge: unreadCount },
    { id: 'preview', label: 'Preview & Publish', icon: Eye },
    ...(user.role === 'super_admin'
      ? [{ id: 'team' as AdminTabId, label: 'Team & RBAC', icon: Shield }]
      : []),
  ];

  const activeNavLabel = navItems.find((i) => i.id === activeTab)?.label || 'Overview';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-['Plus_Jakarta_Sans',system-ui,sans-serif]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-white border-r border-slate-200 flex-col justify-between">
        <div>
          <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-tight text-slate-900 truncate">
                Atelier CMS
              </div>
              <div className="text-[11px] text-slate-500 truncate">{user.role}</div>
            </div>
            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          <nav className="p-3 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[11px] font-mono tabular-nums ${
                        active ? 'text-white/80' : 'text-slate-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 space-y-2.5">
          <div className="text-xs">
            <div className="font-semibold text-slate-900 truncate">{user.name}</div>
            <div className="text-slate-500 truncate font-mono text-[11px]">{user.email}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNavigatePublic}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Live Site</span>
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center justify-center p-1.5 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-white h-full flex flex-col justify-between p-4 z-10 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Atelier CMS</span>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 border border-slate-200 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg ${
                        activeTab === item.id ? 'bg-slate-900 text-white' : 'text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-4 w-full py-2 text-xs font-medium border border-slate-200 rounded-lg"
            >
              Sign Out
            </button>
          </aside>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 border border-slate-200 rounded-lg"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-xs text-slate-500 truncate">
              <span>Atelier CMS</span>
              <span className="mx-1.5">/</span>
              <span className="font-semibold text-slate-900">{activeNavLabel}</span>
            </div>
            {hasUnpublishedChanges && (
              <span className="hidden sm:inline-block text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                Unpublished Draft
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeTab !== 'preview' && (
              <button
                type="button"
                onClick={() => setSplitPreviewOpen((v) => !v)}
                className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-lg cursor-pointer whitespace-nowrap shrink-0 ${
                  splitPreviewOpen
                    ? 'bg-slate-100 border-slate-400 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{splitPreviewOpen ? 'Hide Live Preview' : 'Split Live Preview'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{publishing ? 'Publishing...' : 'Publish Changes'}</span>
            </button>
          </div>
        </header>

        {/* Content + Optional Split Preview */}
        <div className="flex-1 flex min-h-0">
          <main className="flex-1 min-w-0 p-4 lg:p-8 overflow-y-auto">
            {activeTab === 'overview' && (
              <OverviewTab
                draft={draft}
                published={published}
                hasUnpublishedChanges={hasUnpublishedChanges}
                mediaAssets={mediaAssets}
                messages={messages}
                dbEngine={dbEngine}
                onNavigateTab={(t) => setActiveTab(t as AdminTabId)}
                onPublish={handlePublish}
                publishing={publishing}
              />
            )}

            {activeTab === 'content' && (
              <ContentSectionsTab
                draft={draft}
                mediaAssets={mediaAssets}
                onChange={handleDraftChange}
                onToast={showToast}
              />
            )}

            {activeTab === 'themes' && (
              <ThemeManagerTab
                draft={draft}
                onChange={handleDraftChange}
                previewThemeId={previewThemeId}
                onPreviewTheme={(id) => {
                  setPreviewThemeId(id);
                  if (!splitPreviewOpen) setSplitPreviewOpen(true);
                }}
              />
            )}

            {activeTab === 'design' && (
              <GlobalDesignTab draft={draft} onChange={handleDraftChange} />
            )}

            {activeTab === 'typography' && (
              <TypographyTab
                draft={draft}
                onChange={handleDraftChange}
                onToast={showToast}
              />
            )}

            {activeTab === 'header-footer' && (
              <HeaderFooterTab
                draft={draft}
                mediaAssets={mediaAssets}
                onChange={handleDraftChange}
              />
            )}

            {activeTab === 'navigation' && (
              <NavigationTab draft={draft} onChange={handleDraftChange} />
            )}

            {activeTab === 'buttons' && (
              <ButtonsCopyTab draft={draft} onChange={handleDraftChange} />
            )}

            {activeTab === 'media' && (
              <MediaLibraryTab
                mediaAssets={mediaAssets}
                onMediaUpdated={setMediaAssets}
                onAssignHeroPortrait={(url) =>
                  handleDraftChange({
                    ...draft,
                    hero: { ...draft.hero, profileImageUrl: url },
                  })
                }
                onToast={showToast}
              />
            )}

            {activeTab === 'seo' && <SeoTab draft={draft} onChange={handleDraftChange} />}

            {activeTab === 'messages' && (
              <MessagesTab
                messages={messages}
                onMessagesUpdated={setMessages}
                onToast={showToast}
              />
            )}

            {activeTab === 'preview' && (
              <PreviewPublishTab
                draft={draft}
                published={published}
                hasUnpublishedChanges={hasUnpublishedChanges}
                previewThemeId={previewThemeId}
                onChangePreviewTheme={setPreviewThemeId}
                onSaveDraft={handleSaveDraft}
                onPublish={handlePublish}
                onResetDefaults={handleResetDefaults}
                saving={saving}
                publishing={publishing}
                isSuperAdmin={user.role === 'super_admin'}
              />
            )}

            {activeTab === 'team' && user.role === 'super_admin' && (
              <TeamUsersTab
                users={users}
                currentUserId={user.id}
                onCreateUser={async (input) => {
                  const next = await createUserApi(input);
                  setUsers(next);
                  showToast('Admin user created');
                }}
                onDeleteUser={async (id) => {
                  const next = await deleteUserApi(id);
                  setUsers(next);
                  showToast('Admin user removed');
                }}
              />
            )}
          </main>

          {/* Instant Split Live Preview Pane */}
          {splitPreviewOpen && activeTab !== 'preview' && (
            <aside className="hidden xl:flex w-[540px] shrink-0 border-l border-slate-200 bg-slate-100 flex-col">
              <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-900">Instant Draft Preview</span>
                <select
                  value={previewThemeId}
                  onChange={(e) => setPreviewThemeId(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                >
                  {draft.themes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 overflow-y-auto">
                <PortfolioRenderer
                  snapshot={draft}
                  activeThemeId={previewThemeId}
                  onSelectTheme={setPreviewThemeId}
                  previewMode
                  forcedViewport="mobile"
                />
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 text-xs font-medium text-white bg-slate-900 rounded-lg shadow-lg border border-slate-700">
          {toast}
        </div>
      )}
    </div>
  );
};
