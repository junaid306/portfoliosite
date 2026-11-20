import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import {
  createDefaultPortfolioSnapshot,
  DEFAULT_MEDIA_ASSETS,
} from '../../src/data/defaultPortfolioSeed.ts';
import type {
  AdminUserPublic,
  ContactMessageItem,
  MediaAssetItem,
  PortfolioSnapshot,
  ProjectItem,
  SkillItem,
  ThemeConfig,
} from '../../src/types/cms.ts';
import {
  AdminUserModel,
  ContactMessageModel,
  HeaderFooterModel,
  MediaAssetModel,
  ProjectModel,
  SkillModel,
  ThemeConfigModel,
  TypographySettingModel,
  WebsiteSectionModel,
  WebsiteSettingsModel,
} from '../models/mongooseModels.ts';

export interface StoredAdminUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'super_admin' | 'editor';
  createdAt: string;
}

interface LocalCollectionsStore {
  admin_users: StoredAdminUser[];
  draft: PortfolioSnapshot;
  published: PortfolioSnapshot;
  media_assets: MediaAssetItem[];
  contact_messages: ContactMessageItem[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'mongodb-collections.json');

let dbEngine: 'mongodb' | 'local-store' = 'local-store';
let localStore: LocalCollectionsStore | null = null;
let publishedCache: PortfolioSnapshot | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function persistLocalStore() {
  if (!localStore) return;
  ensureDataDir();
  const tmpPath = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(localStore, null, 2), 'utf-8');
  fs.renameSync(tmpPath, STORE_PATH);
}

function createInitialMessages(): ContactMessageItem[] {
  return [
    {
      id: 'msg-welcome-1',
      name: 'Henrik Lindqvist',
      email: 'henrik@nordarchitects.dk',
      subject: 'Digital Monograph Platform Commission',
      message:
        'Hello Clara — we loved the responsive broadsheet layout from your Copenhagen case study. We are preparing a 2027 exhibition catalog and would like to discuss architecture and timeline.',
      status: 'unread',
      adminNotes: '',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: 'msg-welcome-2',
      name: 'Maya Chen',
      email: 'maya.chen@meridianlabs.io',
      subject: 'Design System Audit Follow-Up',
      message:
        'Hi Clara, thanks for sharing the token architecture documentation. Our engineering team is ready to schedule the Phase 2 handoff workshop next Tuesday.',
      status: 'read',
      adminNotes: 'Scheduled for Tuesday 10:00 CET.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
  ];
}

async function saveSnapshotToMongoose(status: 'draft' | 'published', snapshot: PortfolioSnapshot) {
  await WebsiteSettingsModel.findOneAndUpdate(
    { status },
    {
      status,
      siteTitle: snapshot.siteTitle,
      tagline: snapshot.tagline,
      seo: snapshot.seo,
      themeControl: snapshot.themeControl,
      globalDesign: snapshot.globalDesign,
      hero: snapshot.hero,
      about: snapshot.about,
      skillsSection: snapshot.skillsSection,
      projectsSection: snapshot.projectsSection,
      contact: snapshot.contact,
      buttons: snapshot.buttons,
    },
    { upsert: true, new: true }
  );

  await TypographySettingModel.findOneAndUpdate(
    { status },
    {
      status,
      ...snapshot.typography,
    },
    { upsert: true, new: true }
  );

  await HeaderFooterModel.findOneAndUpdate(
    { status },
    {
      status,
      header: snapshot.header,
      footer: snapshot.footer,
    },
    { upsert: true, new: true }
  );

  await ThemeConfigModel.deleteMany({ status });
  if (snapshot.themes.length > 0) {
    await ThemeConfigModel.insertMany(
      snapshot.themes.map((t) => ({
        status,
        themeId: t.id,
        name: t.name,
        description: t.description,
        isDark: t.isDark,
        enabled: t.enabled,
        colors: t.colors,
        typography: t.typography,
        styles: t.styles,
      }))
    );
  }

  await WebsiteSectionModel.deleteMany({ status });
  if (snapshot.sections.length > 0) {
    await WebsiteSectionModel.insertMany(
      snapshot.sections.map((s) => ({
        status,
        sectionId: s.id,
        key: s.key,
        label: s.label,
        title: s.title,
        subtitle: s.subtitle,
        description: s.description,
        visible: s.visible,
        order: s.order,
        customFont: s.customFont,
        bgColor: s.bgColor,
        bgGradient: s.bgGradient,
        textColor: s.textColor,
        paddingY: s.paddingY,
      }))
    );
  }

  await ProjectModel.deleteMany({ status });
  if (snapshot.projects.length > 0) {
    await ProjectModel.insertMany(
      snapshot.projects.map((p) => ({
        status,
        projectId: p.id,
        title: p.title,
        category: p.category,
        year: p.year,
        client: p.client,
        description: p.description,
        imageUrl: p.imageUrl,
        technologies: p.technologies,
        githubUrl: p.githubUrl,
        liveDemoUrl: p.liveDemoUrl,
        featured: p.featured,
        order: p.order,
        visible: p.visible,
      }))
    );
  }

  await SkillModel.deleteMany({ status });
  if (snapshot.skills.length > 0) {
    await SkillModel.insertMany(
      snapshot.skills.map((s) => ({
        status,
        skillId: s.id,
        name: s.name,
        category: s.category,
        iconName: s.iconName,
        percentage: s.percentage,
        order: s.order,
        visible: s.visible,
      }))
    );
  }
}

async function loadSnapshotFromMongoose(status: 'draft' | 'published'): Promise<PortfolioSnapshot | null> {
  const settings = await WebsiteSettingsModel.findOne({ status }).lean<Record<string, any>>();
  if (!settings) return null;

  const [typography, headerFooter, themes, sections, projects, skills] = await Promise.all([
    TypographySettingModel.findOne({ status }).lean<Record<string, any>>(),
    HeaderFooterModel.findOne({ status }).lean<Record<string, any>>(),
    ThemeConfigModel.find({ status }).lean<Record<string, any>[]>(),
    WebsiteSectionModel.find({ status }).sort({ order: 1 }).lean<Record<string, any>[]>(),
    ProjectModel.find({ status }).sort({ order: 1 }).lean<Record<string, any>[]>(),
    SkillModel.find({ status }).sort({ order: 1 }).lean<Record<string, any>[]>(),
  ]);

  const fallback = createDefaultPortfolioSnapshot();

  return {
    siteTitle: settings.siteTitle ?? fallback.siteTitle,
    tagline: settings.tagline ?? fallback.tagline,
    seo: settings.seo ?? fallback.seo,
    themeControl: settings.themeControl ?? fallback.themeControl,
    globalDesign: settings.globalDesign ?? fallback.globalDesign,
    hero: settings.hero ?? fallback.hero,
    about: settings.about ?? fallback.about,
    skillsSection: settings.skillsSection ?? fallback.skillsSection,
    projectsSection: settings.projectsSection ?? fallback.projectsSection,
    contact: settings.contact ?? fallback.contact,
    buttons: settings.buttons ?? fallback.buttons,
    typography: typography
      ? {
          headingFont: typography.headingFont,
          bodyFont: typography.bodyFont,
          buttonFont: typography.buttonFont,
          navFont: typography.navFont,
          monoFont: typography.monoFont,
          sectionFonts: typography.sectionFonts,
          scale: typography.scale,
          customFonts: typography.customFonts || [],
        }
      : fallback.typography,
    header: headerFooter?.header ?? fallback.header,
    footer: headerFooter?.footer ?? fallback.footer,
    themes:
      themes.length > 0
        ? themes.map((t) => ({
            id: t.themeId,
            name: t.name,
            description: t.description,
            isDark: t.isDark,
            enabled: t.enabled,
            colors: t.colors,
            typography: t.typography,
            styles: t.styles,
          }))
        : fallback.themes,
    sections:
      sections.length > 0
        ? sections.map((s) => ({
            id: s.sectionId,
            key: s.key,
            label: s.label,
            title: s.title,
            subtitle: s.subtitle,
            description: s.description,
            visible: s.visible,
            order: s.order,
            customFont: s.customFont,
            bgColor: s.bgColor,
            bgGradient: s.bgGradient,
            textColor: s.textColor,
            paddingY: s.paddingY,
          }))
        : fallback.sections,
    projects: projects.map((p) => ({
      id: p.projectId,
      title: p.title,
      category: p.category,
      year: p.year,
      client: p.client,
      description: p.description,
      imageUrl: p.imageUrl,
      technologies: p.technologies || [],
      githubUrl: p.githubUrl,
      liveDemoUrl: p.liveDemoUrl,
      featured: p.featured,
      order: p.order,
      visible: p.visible,
    })),
    skills: skills.map((s) => ({
      id: s.skillId,
      name: s.name,
      category: s.category,
      iconName: s.iconName,
      percentage: s.percentage,
      order: s.order,
      visible: s.visible,
    })),
    updatedAt: settings.updatedAt ? new Date(settings.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export async function initDatabase(): Promise<'mongodb' | 'local-store'> {
  const mongoUri = process.env.MONGODB_URI?.trim();

  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
      dbEngine = 'mongodb';
      await seedMongooseIfEmpty();
      publishedCache = await loadSnapshotFromMongoose('published');
      return dbEngine;
    } catch (err) {
      console.warn(
        '[DB] Could not connect to MONGODB_URI, falling back to local persistent MongoDB-compatible store:',
        err instanceof Error ? err.message : err
      );
    }
  }

  dbEngine = 'local-store';
  ensureDataDir();

  if (fs.existsSync(STORE_PATH)) {
    try {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      localStore = JSON.parse(raw) as LocalCollectionsStore;
    } catch {
      localStore = null;
    }
  }

  if (!localStore) {
    const adminPasswordHash = await bcrypt.hash('Admin@2026!', 10);
    const editorPasswordHash = await bcrypt.hash('Editor@2026!', 10);
    const initialSnapshot = createDefaultPortfolioSnapshot();

    localStore = {
      admin_users: [
        {
          id: 'usr-super-admin',
          name: 'Clara Vance (Super Admin)',
          email: 'admin@ateliervance.studio',
          passwordHash: adminPasswordHash,
          role: 'super_admin',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'usr-editor',
          name: 'Studio Editor',
          email: 'editor@ateliervance.studio',
          passwordHash: editorPasswordHash,
          role: 'editor',
          createdAt: new Date().toISOString(),
        },
      ],
      draft: JSON.parse(JSON.stringify(initialSnapshot)),
      published: JSON.parse(JSON.stringify(initialSnapshot)),
      media_assets: JSON.parse(JSON.stringify(DEFAULT_MEDIA_ASSETS)),
      contact_messages: createInitialMessages(),
    };
    persistLocalStore();
  }

  publishedCache = JSON.parse(JSON.stringify(localStore.published));
  return dbEngine;
}

async function seedMongooseIfEmpty() {
  const userCount = await AdminUserModel.countDocuments();
  if (userCount === 0) {
    const adminHash = await bcrypt.hash('Admin@2026!', 10);
    const editorHash = await bcrypt.hash('Editor@2026!', 10);
    await AdminUserModel.insertMany([
      {
        name: 'Clara Vance (Super Admin)',
        email: 'admin@ateliervance.studio',
        passwordHash: adminHash,
        role: 'super_admin',
      },
      {
        name: 'Studio Editor',
        email: 'editor@ateliervance.studio',
        passwordHash: editorHash,
        role: 'editor',
      },
    ]);
  }

  const settingsCount = await WebsiteSettingsModel.countDocuments();
  if (settingsCount === 0) {
    const initial = createDefaultPortfolioSnapshot();
    await saveSnapshotToMongoose('draft', initial);
    await saveSnapshotToMongoose('published', initial);
  }

  const mediaCount = await MediaAssetModel.countDocuments();
  if (mediaCount === 0) {
    await MediaAssetModel.insertMany(
      DEFAULT_MEDIA_ASSETS.map((a) => ({
        assetId: a.id,
        name: a.name,
        url: a.url,
        type: a.type,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
      }))
    );
  }

  const msgCount = await ContactMessageModel.countDocuments();
  if (msgCount === 0) {
    await ContactMessageModel.insertMany(
      createInitialMessages().map((m) => ({
        messageId: m.id,
        name: m.name,
        email: m.email,
        subject: m.subject,
        message: m.message,
        status: m.status,
        adminNotes: m.adminNotes,
      }))
    );
  }
}

export function getDbEngine(): 'mongodb' | 'local-store' {
  return dbEngine;
}

export async function getPublishedSnapshot(): Promise<PortfolioSnapshot> {
  if (publishedCache) {
    return publishedCache;
  }
  if (dbEngine === 'mongodb') {
    const loaded = await loadSnapshotFromMongoose('published');
    publishedCache = loaded || createDefaultPortfolioSnapshot();
    return publishedCache;
  }
  publishedCache = JSON.parse(JSON.stringify(localStore!.published));
  return publishedCache!;
}

export async function getDraftSnapshot(): Promise<PortfolioSnapshot> {
  if (dbEngine === 'mongodb') {
    const loaded = await loadSnapshotFromMongoose('draft');
    return loaded || createDefaultPortfolioSnapshot();
  }
  return JSON.parse(JSON.stringify(localStore!.draft));
}

export async function saveDraftSnapshot(nextDraft: PortfolioSnapshot): Promise<PortfolioSnapshot> {
  const stamped: PortfolioSnapshot = {
    ...nextDraft,
    updatedAt: new Date().toISOString(),
  };

  if (dbEngine === 'mongodb') {
    await saveSnapshotToMongoose('draft', stamped);
    return stamped;
  }

  localStore!.draft = stamped;
  persistLocalStore();
  return JSON.parse(JSON.stringify(stamped));
}

export async function publishDraftSnapshot(): Promise<PortfolioSnapshot> {
  const draft = await getDraftSnapshot();
  const stamped: PortfolioSnapshot = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };

  if (dbEngine === 'mongodb') {
    await saveSnapshotToMongoose('draft', stamped);
    await saveSnapshotToMongoose('published', stamped);
  } else {
    localStore!.draft = stamped;
    localStore!.published = JSON.parse(JSON.stringify(stamped));
    persistLocalStore();
  }

  publishedCache = JSON.parse(JSON.stringify(stamped));
  return publishedCache!;
}

export async function resetDraftToDefaults(alsoPublish: boolean): Promise<{
  draft: PortfolioSnapshot;
  published: PortfolioSnapshot;
}> {
  const defaults = createDefaultPortfolioSnapshot();

  if (dbEngine === 'mongodb') {
    await saveSnapshotToMongoose('draft', defaults);
    if (alsoPublish) {
      await saveSnapshotToMongoose('published', defaults);
      publishedCache = JSON.parse(JSON.stringify(defaults));
    }
  } else {
    localStore!.draft = JSON.parse(JSON.stringify(defaults));
    if (alsoPublish) {
      localStore!.published = JSON.parse(JSON.stringify(defaults));
      publishedCache = JSON.parse(JSON.stringify(defaults));
    }
    persistLocalStore();
  }

  const published = await getPublishedSnapshot();
  return { draft: defaults, published };
}

export async function hasUnpublishedChanges(): Promise<boolean> {
  const [draft, published] = await Promise.all([getDraftSnapshot(), getPublishedSnapshot()]);
  const d = { ...draft, updatedAt: '' };
  const p = { ...published, updatedAt: '' };
  return JSON.stringify(d) !== JSON.stringify(p);
}

// Users
export async function findAdminByEmail(email: string): Promise<StoredAdminUser | null> {
  const normalized = email.trim().toLowerCase();
  if (dbEngine === 'mongodb') {
    const doc = await AdminUserModel.findOne({ email: normalized }).lean<Record<string, any>>();
    if (!doc) return null;
    return {
      id: String(doc._id),
      name: doc.name,
      email: doc.email,
      passwordHash: doc.passwordHash,
      role: doc.role,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    };
  }
  return localStore!.admin_users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export async function findAdminById(id: string): Promise<AdminUserPublic | null> {
  if (dbEngine === 'mongodb') {
    const doc = await AdminUserModel.findById(id).lean<Record<string, any>>();
    if (!doc) return null;
    return {
      id: String(doc._id),
      name: doc.name,
      email: doc.email,
      role: doc.role,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    };
  }
  const u = localStore!.admin_users.find((item) => item.id === id);
  if (!u) return null;
  return { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt };
}

export async function listAdminUsers(): Promise<AdminUserPublic[]> {
  if (dbEngine === 'mongodb') {
    const docs = await AdminUserModel.find().sort({ createdAt: 1 }).lean<Record<string, any>[]>();
    return docs.map((d) => ({
      id: String(d._id),
      name: d.name,
      email: d.email,
      role: d.role,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
    }));
  }
  return localStore!.admin_users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
  }));
}

export async function createAdminUser(input: {
  name: string;
  email: string;
  password: string;
  role: 'super_admin' | 'editor';
}): Promise<AdminUserPublic> {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const email = input.email.trim().toLowerCase();

  if (dbEngine === 'mongodb') {
    const doc = await AdminUserModel.create({
      name: input.name.trim(),
      email,
      passwordHash,
      role: input.role,
    });
    return {
      id: String(doc._id),
      name: doc.name,
      email: doc.email,
      role: doc.role,
      createdAt: new Date(doc.createdAt).toISOString(),
    };
  }

  if (localStore!.admin_users.some((u) => u.email.toLowerCase() === email)) {
    throw new Error('An admin account with this email already exists.');
  }

  const created: StoredAdminUser = {
    id: `usr-${crypto.randomUUID().slice(0, 8)}`,
    name: input.name.trim(),
    email,
    passwordHash,
    role: input.role,
    createdAt: new Date().toISOString(),
  };
  localStore!.admin_users.push(created);
  persistLocalStore();
  return {
    id: created.id,
    name: created.name,
    email: created.email,
    role: created.role,
    createdAt: created.createdAt,
  };
}

export async function deleteAdminUser(id: string): Promise<void> {
  if (dbEngine === 'mongodb') {
    await AdminUserModel.findByIdAndDelete(id);
    return;
  }
  localStore!.admin_users = localStore!.admin_users.filter((u) => u.id !== id);
  persistLocalStore();
}

// Media Assets
export async function listMediaAssets(): Promise<MediaAssetItem[]> {
  if (dbEngine === 'mongodb') {
    const docs = await MediaAssetModel.find().sort({ createdAt: -1 }).lean<Record<string, any>[]>();
    return docs.map((d) => ({
      id: d.assetId,
      name: d.name,
      url: d.url,
      type: d.type,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
    }));
  }
  return [...localStore!.media_assets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addMediaAsset(asset: MediaAssetItem): Promise<MediaAssetItem> {
  if (dbEngine === 'mongodb') {
    await MediaAssetModel.create({
      assetId: asset.id,
      name: asset.name,
      url: asset.url,
      type: asset.type,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
    });
    return asset;
  }
  localStore!.media_assets.unshift(asset);
  persistLocalStore();
  return asset;
}

export async function deleteMediaAsset(id: string): Promise<void> {
  if (dbEngine === 'mongodb') {
    await MediaAssetModel.deleteOne({ assetId: id });
    return;
  }
  localStore!.media_assets = localStore!.media_assets.filter((m) => m.id !== id);
  persistLocalStore();
}

// Contact Messages
export async function listContactMessages(): Promise<ContactMessageItem[]> {
  if (dbEngine === 'mongodb') {
    const docs = await ContactMessageModel.find().sort({ createdAt: -1 }).lean<Record<string, any>[]>();
    return docs.map((d) => ({
      id: d.messageId,
      name: d.name,
      email: d.email,
      subject: d.subject,
      message: d.message,
      status: d.status,
      adminNotes: d.adminNotes || '',
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
    }));
  }
  return [...localStore!.contact_messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<ContactMessageItem> {
  const item: ContactMessageItem = {
    id: `msg-${crypto.randomUUID().slice(0, 8)}`,
    name: input.name.trim(),
    email: input.email.trim(),
    subject: input.subject.trim(),
    message: input.message.trim(),
    status: 'unread',
    adminNotes: '',
    createdAt: new Date().toISOString(),
  };

  if (dbEngine === 'mongodb') {
    await ContactMessageModel.create({
      messageId: item.id,
      name: item.name,
      email: item.email,
      subject: item.subject,
      message: item.message,
      status: item.status,
      adminNotes: item.adminNotes,
    });
    return item;
  }

  localStore!.contact_messages.unshift(item);
  persistLocalStore();
  return item;
}

export async function updateContactMessage(
  id: string,
  patch: { status?: 'unread' | 'read' | 'archived'; adminNotes?: string }
): Promise<ContactMessageItem | null> {
  if (dbEngine === 'mongodb') {
    const doc = await ContactMessageModel.findOneAndUpdate(
      { messageId: id },
      { $set: patch },
      { new: true }
    ).lean<Record<string, any>>();
    if (!doc) return null;
    return {
      id: doc.messageId,
      name: doc.name,
      email: doc.email,
      subject: doc.subject,
      message: doc.message,
      status: doc.status,
      adminNotes: doc.adminNotes || '',
      createdAt: new Date(doc.createdAt).toISOString(),
    };
  }
  const idx = localStore!.contact_messages.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  localStore!.contact_messages[idx] = { ...localStore!.contact_messages[idx], ...patch };
  persistLocalStore();
  return localStore!.contact_messages[idx];
}

export async function deleteContactMessage(id: string): Promise<void> {
  if (dbEngine === 'mongodb') {
    await ContactMessageModel.deleteOne({ messageId: id });
    return;
  }
  localStore!.contact_messages = localStore!.contact_messages.filter((m) => m.id !== id);
  persistLocalStore();
}

// Helper CRUD on draft items
export async function upsertDraftProject(project: ProjectItem): Promise<PortfolioSnapshot> {
  const draft = await getDraftSnapshot();
  const idx = draft.projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    draft.projects[idx] = project;
  } else {
    draft.projects.push(project);
  }
  return saveDraftSnapshot(draft);
}

export async function deleteDraftProject(projectId: string): Promise<PortfolioSnapshot> {
  const draft = await getDraftSnapshot();
  draft.projects = draft.projects.filter((p) => p.id !== projectId);
  return saveDraftSnapshot(draft);
}

export async function upsertDraftSkill(skill: SkillItem): Promise<PortfolioSnapshot> {
  const draft = await getDraftSnapshot();
  const idx = draft.skills.findIndex((s) => s.id === skill.id);
  if (idx >= 0) {
    draft.skills[idx] = skill;
  } else {
    draft.skills.push(skill);
  }
  return saveDraftSnapshot(draft);
}

export async function deleteDraftSkill(skillId: string): Promise<PortfolioSnapshot> {
  const draft = await getDraftSnapshot();
  draft.skills = draft.skills.filter((s) => s.id !== skillId);
  return saveDraftSnapshot(draft);
}

export async function updateDraftTheme(theme: ThemeConfig): Promise<PortfolioSnapshot> {
  const draft = await getDraftSnapshot();
  const idx = draft.themes.findIndex((t) => t.id === theme.id);
  if (idx >= 0) {
    draft.themes[idx] = theme;
  } else {
    draft.themes.push(theme);
  }
  return saveDraftSnapshot(draft);
}
