import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';
import {
  addMediaAsset,
  createAdminUser,
  createContactMessage,
  deleteAdminUser,
  deleteContactMessage,
  deleteDraftProject,
  deleteDraftSkill,
  deleteMediaAsset,
  findAdminByEmail,
  findAdminById,
  getDbEngine,
  getDraftSnapshot,
  getPublishedSnapshot,
  hasUnpublishedChanges,
  listAdminUsers,
  listContactMessages,
  listMediaAssets,
  publishDraftSnapshot,
  resetDraftToDefaults,
  saveDraftSnapshot,
  updateContactMessage,
  updateDraftTheme,
  upsertDraftProject,
  upsertDraftSkill,
} from '../db/database.ts';
import { requireAuth, requireRole, signAuthToken, type AuthenticatedRequest } from '../middleware/auth.ts';
import type { PortfolioSnapshot } from '../../src/types/cms.ts';

const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');
const IMAGES_DIR = path.join(UPLOADS_ROOT, 'images');
const FONTS_DIR = path.join(UPLOADS_ROOT, 'fonts');

for (const dir of [UPLOADS_ROOT, IMAGES_DIR, FONTS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, IMAGES_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.png';
      const base = path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 40);
      cb(null, `${base}_${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('Unsupported image format. Use PNG, JPG, WEBP, GIF, or SVG.'));
    }
    cb(null, true);
  },
});

const fontUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, FONTS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 40);
      cb(null, `${base}_${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.woff', '.woff2', '.ttf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('Unsupported font format. Upload WOFF, WOFF2, or TTF files.'));
    }
    cb(null, true);
  },
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please provide your name.').max(120),
  email: z.string().trim().email('Please provide a valid email address.'),
  subject: z.string().trim().min(2, 'Please provide a subject.').max(200),
  message: z.string().trim().min(5, 'Please include a short message.').max(4000),
});

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  role: z.enum(['super_admin', 'editor']),
});

const projectSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1),
  category: z.string().trim().min(1),
  year: z.string().default('2026'),
  client: z.string().default(''),
  description: z.string().default(''),
  imageUrl: z.string().default(''),
  technologies: z.array(z.string()).default([]),
  githubUrl: z.string().default(''),
  liveDemoUrl: z.string().default(''),
  featured: z.boolean().default(false),
  order: z.number().int().default(1),
  visible: z.boolean().default(true),
});

const skillSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  iconName: z.string().default('Code2'),
  percentage: z.number().min(0).max(100),
  order: z.number().int().default(1),
  visible: z.boolean().default(true),
});

const messagePatchSchema = z.object({
  status: z.enum(['unread', 'read', 'archived']).optional(),
  adminNotes: z.string().max(1000).optional(),
});

export function createApiRouter() {
  const router = express.Router();

  router.get('/health', (_req, res) => {
    res.json({
      ok: true,
      dbEngine: getDbEngine(),
      timestamp: new Date().toISOString(),
    });
  });

  // Public site payload (served from cached published snapshot)
  router.get('/public/site', async (_req, res) => {
    try {
      const site = await getPublishedSnapshot();
      res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
      res.json({ site });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load site data.' });
    }
  });

  router.post('/public/contact', async (req, res) => {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid contact form data.' });
    }
    try {
      const saved = await createContactMessage(parsed.data);
      res.status(201).json({ message: saved });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to save message.' });
    }
  });

  // Auth routes
  router.post('/auth/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Valid email and password are required.' });
    }
    const user = await findAdminByEmail(parsed.data.email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const token = signAuthToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  });

  router.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
    const user = await findAdminById(req.user!.sub);
    if (!user) {
      return res.status(401).json({ error: 'Account no longer exists.' });
    }
    res.json({ user });
  });

  // Protected Admin CMS routes
  router.get('/admin/bootstrap', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const [draft, published, mediaAssets, messages, dirty] = await Promise.all([
        getDraftSnapshot(),
        getPublishedSnapshot(),
        listMediaAssets(),
        listContactMessages(),
        hasUnpublishedChanges(),
      ]);
      const users = req.user?.role === 'super_admin' ? await listAdminUsers() : [];
      res.json({
        draft,
        published,
        hasUnpublishedChanges: dirty,
        mediaAssets,
        messages,
        users,
        dbEngine: getDbEngine(),
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load CMS workspace.' });
    }
  });

  router.put('/admin/draft', requireAuth, requireRole(['super_admin', 'editor']), async (req, res) => {
    try {
      const incoming = req.body?.draft as PortfolioSnapshot | undefined;
      if (!incoming || typeof incoming !== 'object' || !incoming.siteTitle || !Array.isArray(incoming.themes)) {
        return res.status(400).json({ error: 'Invalid portfolio draft payload.' });
      }
      const saved = await saveDraftSnapshot(incoming);
      const dirty = await hasUnpublishedChanges();
      res.json({ draft: saved, hasUnpublishedChanges: dirty });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to save draft.' });
    }
  });

  router.post('/admin/publish', requireAuth, requireRole(['super_admin', 'editor']), async (_req, res) => {
    try {
      const published = await publishDraftSnapshot();
      res.json({ published, hasUnpublishedChanges: false });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to publish changes.' });
    }
  });

  router.post('/admin/reset', requireAuth, requireRole(['super_admin']), async (req, res) => {
    try {
      const alsoPublish = Boolean(req.body?.alsoPublish);
      const result = await resetDraftToDefaults(alsoPublish);
      const dirty = await hasUnpublishedChanges();
      res.json({ ...result, hasUnpublishedChanges: dirty });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to reset settings.' });
    }
  });

  // Projects CRUD
  router.post('/admin/projects', requireAuth, requireRole(['super_admin', 'editor']), async (req, res) => {
    const parsed = projectSchema.safeParse({
      ...req.body,
      id: req.body?.id || `proj-${crypto.randomUUID().slice(0, 8)}`,
    });
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid project data.' });
    }
    const draft = await upsertDraftProject(parsed.data);
    res.status(201).json({ draft, hasUnpublishedChanges: true });
  });

  router.put('/admin/projects/:id', requireAuth, requireRole(['super_admin', 'editor']), async (req, res) => {
    const parsed = projectSchema.safeParse({ ...req.body, id: req.params.id });
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid project data.' });
    }
    const draft = await upsertDraftProject(parsed.data);
    res.json({ draft, hasUnpublishedChanges: true });
  });

  router.delete('/admin/projects/:id', requireAuth, requireRole(['super_admin', 'editor']), async (req, res) => {
    const draft = await deleteDraftProject(req.params.id);
    res.json({ draft, hasUnpublishedChanges: true });
  });

  // Skills CRUD
  router.post('/admin/skills', requireAuth, requireRole(['super_admin', 'editor']), async (req, res) => {
    const parsed = skillSchema.safeParse({
      ...req.body,
      id: req.body?.id || `sk-${crypto.randomUUID().slice(0, 8)}`,
    });
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid skill data.' });
    }
    const draft = await upsertDraftSkill(parsed.data);
    res.status(201).json({ draft, hasUnpublishedChanges: true });
  });

  router.put('/admin/skills/:id', requireAuth, requireRole(['super_admin', 'editor']), async (req, res) => {
    const parsed = skillSchema.safeParse({ ...req.body, id: req.params.id });
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid skill data.' });
    }
    const draft = await upsertDraftSkill(parsed.data);
    res.json({ draft, hasUnpublishedChanges: true });
  });

  router.delete('/admin/skills/:id', requireAuth, requireRole(['super_admin', 'editor']), async (req, res) => {
    const draft = await deleteDraftSkill(req.params.id);
    res.json({ draft, hasUnpublishedChanges: true });
  });

  // Theme update
  router.put('/admin/themes/:id', requireAuth, requireRole(['super_admin', 'editor']), async (req, res) => {
    if (!req.body || typeof req.body !== 'object' || !req.body.colors) {
      return res.status(400).json({ error: 'Invalid theme configuration.' });
    }
    const draft = await updateDraftTheme({ ...req.body, id: req.params.id });
    res.json({ draft, hasUnpublishedChanges: true });
  });

  // Media uploads (Images & Custom Fonts)
  router.post(
    '/admin/upload/image',
    requireAuth,
    requireRole(['super_admin', 'editor']),
    imageUpload.single('file'),
    async (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided.' });
      }
      const asset = await addMediaAsset({
        id: `img-${crypto.randomUUID().slice(0, 8)}`,
        name: req.body?.name?.trim() || req.file.originalname,
        url: `/uploads/images/${req.file.filename}`,
        type: 'image',
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        createdAt: new Date().toISOString(),
      });
      res.status(201).json({ asset });
    }
  );

  router.post(
    '/admin/upload/font',
    requireAuth,
    requireRole(['super_admin', 'editor']),
    fontUpload.single('file'),
    async (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: 'No font file provided.' });
      }
      const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '') as
        | 'woff2'
        | 'woff'
        | 'ttf';
      const family =
        req.body?.family?.trim() ||
        path
          .basename(req.file.originalname, path.extname(req.file.originalname))
          .replace(/[^a-zA-Z0-9 ]/g, ' ')
          .trim() ||
        'CustomFont';
      const url = `/uploads/fonts/${req.file.filename}`;

      const asset = await addMediaAsset({
        id: `fnt-${crypto.randomUUID().slice(0, 8)}`,
        name: family,
        url,
        type: 'font',
        mimeType: req.file.mimetype || `font/${ext}`,
        sizeBytes: req.file.size,
        createdAt: new Date().toISOString(),
      });

      const draft = await getDraftSnapshot();
      const customFont = {
        id: asset.id,
        name: family,
        family,
        url,
        format: ext,
        uploadedAt: asset.createdAt,
      };
      draft.typography.customFonts = [
        ...draft.typography.customFonts.filter((f) => f.family !== family),
        customFont,
      ];
      const updatedDraft = await saveDraftSnapshot(draft);

      res.status(201).json({ asset, customFont, draft: updatedDraft });
    }
  );

  router.delete('/admin/media/:id', requireAuth, requireRole(['super_admin', 'editor']), async (req, res) => {
    await deleteMediaAsset(req.params.id);
    const mediaAssets = await listMediaAssets();
    res.json({ mediaAssets });
  });

  // Contact Messages
  router.get('/admin/messages', requireAuth, async (_req, res) => {
    const messages = await listContactMessages();
    res.json({ messages });
  });

  router.patch('/admin/messages/:id', requireAuth, async (req, res) => {
    const parsed = messagePatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid message update.' });
    }
    const updated = await updateContactMessage(req.params.id, parsed.data);
    if (!updated) {
      return res.status(404).json({ error: 'Message not found.' });
    }
    res.json({ message: updated });
  });

  router.delete('/admin/messages/:id', requireAuth, requireRole(['super_admin', 'editor']), async (req, res) => {
    await deleteContactMessage(req.params.id);
    const messages = await listContactMessages();
    res.json({ messages });
  });

  // Admin Users RBAC (super_admin only)
  router.get('/admin/users', requireAuth, requireRole(['super_admin']), async (_req, res) => {
    const users = await listAdminUsers();
    res.json({ users });
  });

  router.post('/admin/users', requireAuth, requireRole(['super_admin']), async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid user payload.' });
    }
    try {
      const user = await createAdminUser(parsed.data);
      const users = await listAdminUsers();
      res.status(201).json({ user, users });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to create user.' });
    }
  });

  router.delete('/admin/users/:id', requireAuth, requireRole(['super_admin']), async (req: AuthenticatedRequest, res) => {
    if (req.params.id === req.user?.sub) {
      return res.status(400).json({ error: 'You cannot delete your own active admin account.' });
    }
    await deleteAdminUser(req.params.id);
    const users = await listAdminUsers();
    res.json({ users });
  });

  // Multer error handler
  router.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(400).json({ error: err.message || 'Request failed.' });
  });

  return router;
}
