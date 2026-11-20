export type SectionKey = 'hero' | 'about' | 'skills' | 'projects' | 'contact';

export interface EditableButton {
  id: string;
  key: string;
  label: string;
  href: string;
  bgColor: string;
  textColor: string;
  hoverBgColor: string;
  borderColor: string;
  borderRadius: number;
  fontFamily: string;
  fontWeight: number;
  size: 'sm' | 'md' | 'lg';
  paddingX: number;
  paddingY: number;
  visible: boolean;
}

export interface NavLinkItem {
  id: string;
  label: string;
  href: string;
  visible: boolean;
  order: number;
}

export interface SocialLinkItem {
  id: string;
  platform: string;
  label: string;
  url: string;
  visible: boolean;
}

export interface CustomFontItem {
  id: string;
  name: string;
  family: string;
  url: string;
  format: 'woff2' | 'woff' | 'ttf';
  uploadedAt: string;
}

export interface ThemePalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  headingText: string;
  bodyText: string;
  mutedText: string;
  border: string;
  shadow: string;
  cardBg: string;
  cardText: string;
  navbarBg: string;
  navbarText: string;
  footerBg: string;
  footerText: string;
  inputBg: string;
  inputText: string;
  inputBorder: string;
  iconColor: string;
  buttonBg: string;
  buttonText: string;
  buttonHoverBg: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  isDark: boolean;
  enabled: boolean;
  colors: ThemePalette;
  typography: {
    headingFont: string;
    bodyFont: string;
    buttonFont: string;
    navFont: string;
  };
  styles: {
    borderRadius: number;
    buttonRadius: number;
    cardShadow: string;
    navbarBorder: string;
    footerBorder: string;
  };
}

export interface ThemeControlSettings {
  defaultThemeId: string;
  enableRandomTheme: boolean;
  changeOnEveryVisit: boolean;
  respectDesignOverrides: boolean;
}

export interface GlobalDesignSettings {
  useGlobalColorOverrides: boolean;
  colors: ThemePalette;
  spacing: {
    borderRadius: number;
    containerMaxWidth: number;
    sectionPaddingY: number;
    cardPadding: number;
    elementGap: number;
  };
  gradients: {
    useSectionGradients: boolean;
    heroGradient: string;
    aboutGradient: string;
    skillsGradient: string;
    projectsGradient: string;
    contactGradient: string;
  };
}

export interface TypographySettings {
  headingFont: string;
  bodyFont: string;
  buttonFont: string;
  navFont: string;
  monoFont: string;
  sectionFonts: Record<SectionKey, string>;
  scale: {
    h1Size: number;
    h2Size: number;
    bodySize: number;
    headingWeight: number;
    bodyWeight: number;
    letterSpacing: number;
    lineHeight: number;
  };
  customFonts: CustomFontItem[];
}

export interface HeaderConfig {
  brandName: string;
  logoText: string;
  logoImageUrl: string;
  showLogoImage: boolean;
  navLinks: NavLinkItem[];
  bgColor: string;
  textColor: string;
  heightPx: number;
  spacingPx: number;
  alignment: 'left' | 'center' | 'split';
  sticky: boolean;
  transparentOnTop: boolean;
  showCtaButton: boolean;
  mobileMenuLabel: string;
  mobileShowCta: boolean;
}

export interface FooterConfig {
  brandName: string;
  logoText: string;
  logoImageUrl: string;
  description: string;
  navLinks: NavLinkItem[];
  socialLinks: SocialLinkItem[];
  copyright: {
    prefix: string;
    year: string;
    brandName: string;
    customText: string;
    showYear: boolean;
  };
  bgColor: string;
  textColor: string;
  columns: number;
  paddingY: number;
  alignment: 'left' | 'center' | 'between';
}

export interface WebsiteSectionConfig {
  id: string;
  key: SectionKey;
  label: string;
  title: string;
  subtitle: string;
  description: string;
  visible: boolean;
  order: number;
  customFont: string;
  bgColor: string;
  bgGradient: string;
  textColor: string;
  paddingY: number;
}

export interface HeroMetricItem {
  id: string;
  value: string;
  label: string;
}

export interface HeroContent {
  kicker: string;
  heading: string;
  subtitle: string;
  introduction: string;
  profileImageUrl: string;
  profileImageAlt: string;
  backgroundImageUrl: string;
  showBackgroundImage: boolean;
  alignment: 'left' | 'center' | 'split';
  layout: 'split' | 'centered' | 'editorial';
  spacingY: number;
  headingColor: string;
  subtitleColor: string;
  bodyColor: string;
  metrics: HeroMetricItem[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  period: string;
  details: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  period: string;
  summary: string;
}

export interface AboutContent {
  sectionTitle: string;
  subtitle: string;
  description: string;
  biography: string;
  location: string;
  availability: string;
  email: string;
  portraitImageUrl: string;
  bgColor: string;
  showIcons: boolean;
  educationTitle: string;
  experienceTitle: string;
  education: EducationItem[];
  experience: ExperienceItem[];
}

export interface SkillItem {
  id: string;
  name: string;
  category: string;
  iconName: string;
  percentage: number;
  order: number;
  visible: boolean;
}

export interface SkillsSectionStyle {
  sectionTitle: string;
  subtitle: string;
  description: string;
  allCategoryLabel: string;
  cardBg: string;
  cardBorder: string;
  cardText: string;
  progressBg: string;
  progressFill: string;
  showPercentages: boolean;
}

export interface ProjectItem {
  id: string;
  title: string;
  category: string;
  year: string;
  client: string;
  description: string;
  imageUrl: string;
  technologies: string[];
  githubUrl: string;
  liveDemoUrl: string;
  featured: boolean;
  order: number;
  visible: boolean;
}

export interface ProjectsSectionStyle {
  sectionTitle: string;
  subtitle: string;
  description: string;
  allFilterLabel: string;
  cardBg: string;
  cardBorder: string;
  cardText: string;
  liveButtonText: string;
  liveButtonBg: string;
  liveButtonTextColor: string;
  githubButtonText: string;
  githubButtonBg: string;
  githubButtonTextColor: string;
  buttonRadius: number;
}

export interface ContactContent {
  sectionTitle: string;
  subtitle: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  socialLinks: SocialLinkItem[];
  formLabels: {
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    subjectLabel: string;
    subjectPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    successMessage: string;
  };
  bgColor: string;
  layout: 'split' | 'centered';
  showIcons: boolean;
}

export interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  keywords: string;
  canonicalUrl: string;
}

export interface MediaAssetItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'font';
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface ContactMessageItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  adminNotes: string;
  createdAt: string;
}

export interface PortfolioSnapshot {
  siteTitle: string;
  tagline: string;
  seo: SeoSettings;
  themeControl: ThemeControlSettings;
  themes: ThemeConfig[];
  globalDesign: GlobalDesignSettings;
  typography: TypographySettings;
  header: HeaderConfig;
  footer: FooterConfig;
  sections: WebsiteSectionConfig[];
  hero: HeroContent;
  about: AboutContent;
  skillsSection: SkillsSectionStyle;
  skills: SkillItem[];
  projectsSection: ProjectsSectionStyle;
  projects: ProjectItem[];
  contact: ContactContent;
  buttons: Record<string, EditableButton>;
  updatedAt: string;
}

export interface AdminUserPublic {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'editor';
  createdAt: string;
}
