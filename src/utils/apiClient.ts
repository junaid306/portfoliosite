import type {
  AdminUserPublic,
  ContactMessageItem,
  MediaAssetItem,
  PortfolioSnapshot,
  ProjectItem,
  SkillItem,
  ThemeConfig,
} from '../types/cms';

const TOKEN_STORAGE_KEY = 'atelier_cms_jwt';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

async function apiFetch<T>(url: string, options: RequestInit = {}, auth = false): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (auth) {
    const token = getStoredToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function fetchPublicSite(): Promise<PortfolioSnapshot> {
  const res = await apiFetch<{ site: PortfolioSnapshot }>('/api/public/site');
  return res.site;
}

export async function submitPublicContact(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<ContactMessageItem> {
  const res = await apiFetch<{ message: ContactMessageItem }>('/api/public/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.message;
}

export async function loginAdmin(email: string, password: string): Promise<{
  token: string;
  user: AdminUserPublic;
}> {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchCurrentUser(): Promise<AdminUserPublic> {
  const res = await apiFetch<{ user: AdminUserPublic }>('/api/auth/me', {}, true);
  return res.user;
}

export interface AdminBootstrapPayload {
  draft: PortfolioSnapshot;
  published: PortfolioSnapshot;
  hasUnpublishedChanges: boolean;
  mediaAssets: MediaAssetItem[];
  messages: ContactMessageItem[];
  users: AdminUserPublic[];
  dbEngine: 'mongodb' | 'local-store';
}

export async function fetchAdminBootstrap(): Promise<AdminBootstrapPayload> {
  return apiFetch('/api/admin/bootstrap', {}, true);
}

export async function saveDraft(draft: PortfolioSnapshot): Promise<{
  draft: PortfolioSnapshot;
  hasUnpublishedChanges: boolean;
}> {
  return apiFetch(
    '/api/admin/draft',
    {
      method: 'PUT',
      body: JSON.stringify({ draft }),
    },
    true
  );
}

export async function publishDraft(): Promise<{
  published: PortfolioSnapshot;
  hasUnpublishedChanges: boolean;
}> {
  return apiFetch('/api/admin/publish', { method: 'POST' }, true);
}

export async function resetToDefaults(alsoPublish = false): Promise<{
  draft: PortfolioSnapshot;
  published: PortfolioSnapshot;
  hasUnpublishedChanges: boolean;
}> {
  return apiFetch(
    '/api/admin/reset',
    {
      method: 'POST',
      body: JSON.stringify({ alsoPublish }),
    },
    true
  );
}

export async function saveProjectApi(project: ProjectItem, isNew: boolean): Promise<PortfolioSnapshot> {
  const url = isNew ? '/api/admin/projects' : `/api/admin/projects/${encodeURIComponent(project.id)}`;
  const res = await apiFetch<{ draft: PortfolioSnapshot }>(
    url,
    {
      method: isNew ? 'POST' : 'PUT',
      body: JSON.stringify(project),
    },
    true
  );
  return res.draft;
}

export async function deleteProjectApi(id: string): Promise<PortfolioSnapshot> {
  const res = await apiFetch<{ draft: PortfolioSnapshot }>(
    `/api/admin/projects/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    true
  );
  return res.draft;
}

export async function saveSkillApi(skill: SkillItem, isNew: boolean): Promise<PortfolioSnapshot> {
  const url = isNew ? '/api/admin/skills' : `/api/admin/skills/${encodeURIComponent(skill.id)}`;
  const res = await apiFetch<{ draft: PortfolioSnapshot }>(
    url,
    {
      method: isNew ? 'POST' : 'PUT',
      body: JSON.stringify(skill),
    },
    true
  );
  return res.draft;
}

export async function deleteSkillApi(id: string): Promise<PortfolioSnapshot> {
  const res = await apiFetch<{ draft: PortfolioSnapshot }>(
    `/api/admin/skills/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    true
  );
  return res.draft;
}

export async function updateThemeApi(theme: ThemeConfig): Promise<PortfolioSnapshot> {
  const res = await apiFetch<{ draft: PortfolioSnapshot }>(
    `/api/admin/themes/${encodeURIComponent(theme.id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(theme),
    },
    true
  );
  return res.draft;
}

export async function uploadImageAsset(file: File, name?: string): Promise<MediaAssetItem> {
  const form = new FormData();
  form.append('file', file);
  if (name) form.append('name', name);
  const res = await apiFetch<{ asset: MediaAssetItem }>(
    '/api/admin/upload/image',
    { method: 'POST', body: form },
    true
  );
  return res.asset;
}

export async function uploadFontAsset(
  file: File,
  family: string
): Promise<{ asset: MediaAssetItem; draft: PortfolioSnapshot }> {
  const form = new FormData();
  form.append('file', file);
  form.append('family', family);
  return apiFetch('/api/admin/upload/font', { method: 'POST', body: form }, true);
}

export async function deleteMediaAssetApi(id: string): Promise<MediaAssetItem[]> {
  const res = await apiFetch<{ mediaAssets: MediaAssetItem[] }>(
    `/api/admin/media/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    true
  );
  return res.mediaAssets;
}

export async function updateMessageApi(
  id: string,
  patch: { status?: 'unread' | 'read' | 'archived'; adminNotes?: string }
): Promise<ContactMessageItem> {
  const res = await apiFetch<{ message: ContactMessageItem }>(
    `/api/admin/messages/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(patch),
    },
    true
  );
  return res.message;
}

export async function deleteMessageApi(id: string): Promise<ContactMessageItem[]> {
  const res = await apiFetch<{ messages: ContactMessageItem[] }>(
    `/api/admin/messages/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    true
  );
  return res.messages;
}

export async function createUserApi(input: {
  name: string;
  email: string;
  password: string;
  role: 'super_admin' | 'editor';
}): Promise<AdminUserPublic[]> {
  const res = await apiFetch<{ users: AdminUserPublic[] }>(
    '/api/admin/users',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    true
  );
  return res.users;
}

export async function deleteUserApi(id: string): Promise<AdminUserPublic[]> {
  const res = await apiFetch<{ users: AdminUserPublic[] }>(
    `/api/admin/users/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    true
  );
  return res.users;
}
