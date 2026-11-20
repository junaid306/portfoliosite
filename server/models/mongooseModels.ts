import mongoose, { Schema } from 'mongoose';

const AdminUserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['super_admin', 'editor'], default: 'editor' },
  },
  { timestamps: true, collection: 'admin_users' }
);

const WebsiteSettingsSchema = new Schema(
  {
    status: { type: String, enum: ['draft', 'published'], required: true, unique: true },
    siteTitle: { type: String, required: true },
    tagline: { type: String, default: '' },
    seo: { type: Schema.Types.Mixed, required: true },
    themeControl: { type: Schema.Types.Mixed, required: true },
    globalDesign: { type: Schema.Types.Mixed, required: true },
    hero: { type: Schema.Types.Mixed, required: true },
    about: { type: Schema.Types.Mixed, required: true },
    skillsSection: { type: Schema.Types.Mixed, required: true },
    projectsSection: { type: Schema.Types.Mixed, required: true },
    contact: { type: Schema.Types.Mixed, required: true },
    buttons: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true, collection: 'website_settings' }
);

const ThemeConfigSchema = new Schema(
  {
    status: { type: String, enum: ['draft', 'published'], required: true, index: true },
    themeId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    isDark: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
    colors: { type: Schema.Types.Mixed, required: true },
    typography: { type: Schema.Types.Mixed, required: true },
    styles: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true, collection: 'theme_configs' }
);
ThemeConfigSchema.index({ status: 1, themeId: 1 }, { unique: true });

const TypographySettingSchema = new Schema(
  {
    status: { type: String, enum: ['draft', 'published'], required: true, unique: true },
    headingFont: { type: String, required: true },
    bodyFont: { type: String, required: true },
    buttonFont: { type: String, required: true },
    navFont: { type: String, required: true },
    monoFont: { type: String, required: true },
    sectionFonts: { type: Schema.Types.Mixed, required: true },
    scale: { type: Schema.Types.Mixed, required: true },
    customFonts: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true, collection: 'typography_settings' }
);

const HeaderFooterSchema = new Schema(
  {
    status: { type: String, enum: ['draft', 'published'], required: true, unique: true },
    header: { type: Schema.Types.Mixed, required: true },
    footer: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true, collection: 'header_footers' }
);

const WebsiteSectionSchema = new Schema(
  {
    status: { type: String, enum: ['draft', 'published'], required: true, index: true },
    sectionId: { type: String, required: true },
    key: { type: String, required: true },
    label: { type: String, required: true },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    description: { type: String, default: '' },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    customFont: { type: String, default: '' },
    bgColor: { type: String, default: '' },
    bgGradient: { type: String, default: '' },
    textColor: { type: String, default: '' },
    paddingY: { type: Number, default: 80 },
  },
  { timestamps: true, collection: 'website_sections' }
);
WebsiteSectionSchema.index({ status: 1, sectionId: 1 }, { unique: true });

const ProjectSchema = new Schema(
  {
    status: { type: String, enum: ['draft', 'published'], required: true, index: true },
    projectId: { type: String, required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    year: { type: String, default: '' },
    client: { type: String, default: '' },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    technologies: { type: [String], default: [] },
    githubUrl: { type: String, default: '' },
    liveDemoUrl: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'projects' }
);
ProjectSchema.index({ status: 1, projectId: 1 }, { unique: true });

const SkillSchema = new Schema(
  {
    status: { type: String, enum: ['draft', 'published'], required: true, index: true },
    skillId: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    iconName: { type: String, default: 'Code2' },
    percentage: { type: Number, default: 80 },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'skills' }
);
SkillSchema.index({ status: 1, skillId: 1 }, { unique: true });

const MediaAssetSchema = new Schema(
  {
    assetId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'font'], required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'media_assets' }
);

const ContactMessageSchema = new Schema(
  {
    messageId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['unread', 'read', 'archived'], default: 'unread' },
    adminNotes: { type: String, default: '' },
  },
  { timestamps: true, collection: 'contact_messages' }
);

export const AdminUserModel = mongoose.models.AdminUser || mongoose.model('AdminUser', AdminUserSchema);
export const WebsiteSettingsModel =
  mongoose.models.WebsiteSettings || mongoose.model('WebsiteSettings', WebsiteSettingsSchema);
export const ThemeConfigModel = mongoose.models.ThemeConfig || mongoose.model('ThemeConfig', ThemeConfigSchema);
export const TypographySettingModel =
  mongoose.models.TypographySetting || mongoose.model('TypographySetting', TypographySettingSchema);
export const HeaderFooterModel = mongoose.models.HeaderFooter || mongoose.model('HeaderFooter', HeaderFooterSchema);
export const WebsiteSectionModel =
  mongoose.models.WebsiteSection || mongoose.model('WebsiteSection', WebsiteSectionSchema);
export const ProjectModel = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
export const SkillModel = mongoose.models.Skill || mongoose.model('Skill', SkillSchema);
export const MediaAssetModel = mongoose.models.MediaAsset || mongoose.model('MediaAsset', MediaAssetSchema);
export const ContactMessageModel =
  mongoose.models.ContactMessage || mongoose.model('ContactMessage', ContactMessageSchema);
