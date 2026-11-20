import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Compass,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  Github,
  Globe,
  Layers,
  Mail,
  MapPin,
  Menu,
  Palette,
  Phone,
  Send,
  ShieldCheck,
  Shuffle,
  Terminal,
  Type,
  X,
  Zap,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import type {
  EditableButton,
  PortfolioSnapshot,
  ProjectItem,
  SectionKey,
  ThemePalette,
} from '../types/cms';
import {
  applySeoMetadata,
  buildFontFamily,
  getResolvedTheme,
  inferFontFallback,
  injectCustomFonts,
  rememberSessionTheme,
  syncGoogleFontsLink,
} from '../utils/themeResolver';
import { submitPublicContact } from '../utils/apiClient';

interface PortfolioRendererProps {
  snapshot: PortfolioSnapshot;
  activeThemeId: string;
  onSelectTheme: (themeId: string) => void;
  onNavigateAdmin?: () => void;
  previewMode?: boolean;
  forcedViewport?: 'desktop' | 'tablet' | 'mobile';
}

const SKILL_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Code2,
  Layers,
  Database,
  Type,
  Cpu,
  ShieldCheck,
  Terminal,
  Palette,
  Globe,
  Zap,
  Compass,
};

function DynamicImage({
  src,
  alt,
  className,
  style,
  fallbackBg,
  fallbackText,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackBg: string;
  fallbackText: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-6 text-center ${className || ''}`}
        style={{ backgroundColor: fallbackBg, color: fallbackText, ...style }}
      >
        <Layers className="w-8 h-8 opacity-40 mb-2" />
        <span className="text-xs font-medium opacity-70">{alt || 'Visual asset'}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
      style={style}
    />
  );
}

function DynamicButton({
  button,
  palette,
  defaultFont,
  defaultRadius,
  variant = 'primary',
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  children,
}: {
  button: EditableButton;
  palette: ThemePalette;
  defaultFont: string;
  defaultRadius: number;
  variant?: 'primary' | 'secondary';
  onClick?: (e: React.MouseEvent) => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  if (!button.visible) return null;

  const isSecondary = variant === 'secondary' || button.bgColor === 'transparent';
  const bg = button.bgColor && button.bgColor !== ''
    ? button.bgColor
    : isSecondary
    ? 'transparent'
    : palette.buttonBg;
  const hoverBg =
    button.hoverBgColor && button.hoverBgColor !== ''
      ? button.hoverBgColor
      : isSecondary
      ? palette.surface
      : palette.buttonHoverBg;
  const text =
    button.textColor && button.textColor !== ''
      ? button.textColor
      : isSecondary
      ? palette.headingText
      : palette.buttonText;
  const border =
    button.borderColor && button.borderColor !== ''
      ? button.borderColor
      : isSecondary
      ? palette.border
      : 'transparent';

  const sizeScale =
    button.size === 'sm'
      ? { fontSize: '13px', px: button.paddingX || 14, py: button.paddingY || 8 }
      : button.size === 'lg'
      ? { fontSize: '15px', px: button.paddingX || 24, py: button.paddingY || 12 }
      : { fontSize: '14px', px: button.paddingX || 18, py: button.paddingY || 10 };

  const fontName = button.fontFamily || defaultFont;
  const sharedStyle: React.CSSProperties = {
    backgroundColor: hovered ? hoverBg : bg,
    color: text,
    border: `1px solid ${border}`,
    borderRadius: `${button.borderRadius ?? defaultRadius}px`,
    fontFamily: buildFontFamily(fontName, inferFontFallback(fontName)),
    fontWeight: button.fontWeight || 500,
    fontSize: sizeScale.fontSize,
    padding: `${sizeScale.py}px ${sizeScale.px}px`,
    transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
  };

  if (button.href && type !== 'submit') {
    const isExternal = button.href.startsWith('http');
    return (
      <a
        href={button.href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onClick}
        style={sharedStyle}
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}
      >
        {children || button.label}
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={sharedStyle}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}
    >
      {children || button.label}
    </button>
  );
}

export const PortfolioRenderer: React.FC<PortfolioRendererProps> = ({
  snapshot,
  activeThemeId,
  onSelectTheme,
  onNavigateAdmin,
  previewMode = false,
  forcedViewport,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [skillFilter, setSkillFilter] = useState<string>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [contactState, setContactState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [contactFeedback, setContactFeedback] = useState('');

  const { theme, palette } = useMemo(
    () => getResolvedTheme(snapshot, activeThemeId),
    [snapshot, activeThemeId]
  );

  useEffect(() => {
    injectCustomFonts(snapshot.typography.customFonts);
    syncGoogleFontsLink(snapshot.typography, theme);
    if (!previewMode) {
      applySeoMetadata(snapshot.seo);
    }
  }, [snapshot.typography, snapshot.seo, theme, previewMode]);

  useEffect(() => {
    if (previewMode) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [previewMode]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedProject(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const enabledThemes = useMemo(
    () => snapshot.themes.filter((t) => t.enabled),
    [snapshot.themes]
  );

  // Typography resolution (theme font vs global font settings)
  const headingFontName =
    snapshot.typography.headingFont || theme.typography.headingFont;
  const bodyFontName =
    snapshot.typography.bodyFont || theme.typography.bodyFont;
  const buttonFontName =
    snapshot.typography.buttonFont || theme.typography.buttonFont;
  const navFontName =
    snapshot.typography.navFont || theme.typography.navFont;
  const monoFontName = snapshot.typography.monoFont || 'JetBrains Mono';

  const headingFamily = buildFontFamily(headingFontName, inferFontFallback(headingFontName));
  const bodyFamily = buildFontFamily(bodyFontName, inferFontFallback(bodyFontName));
  const navFamily = buildFontFamily(navFontName, inferFontFallback(navFontName));
  const monoFamily = buildFontFamily(monoFontName, 'mono');

  const scale = snapshot.typography.scale;
  const spacing = snapshot.globalDesign.spacing;
  const cardRadius = spacing.borderRadius ?? theme.styles.borderRadius;
  const btnRadius = theme.styles.buttonRadius ?? cardRadius;

  const getSectionFont = (key: SectionKey, customSectionFont: string, fallback: string) => {
    const chosen = customSectionFont || snapshot.typography.sectionFonts[key];
    if (!chosen) return fallback;
    return buildFontFamily(chosen, inferFontFallback(chosen));
  };

  const visibleHeaderLinks = useMemo(
    () => [...snapshot.header.navLinks].filter((l) => l.visible).sort((a, b) => a.order - b.order),
    [snapshot.header.navLinks]
  );

  const visibleFooterLinks = useMemo(
    () => [...snapshot.footer.navLinks].filter((l) => l.visible),
    [snapshot.footer.navLinks]
  );

  const visibleSkills = useMemo(
    () => [...snapshot.skills].filter((s) => s.visible).sort((a, b) => a.order - b.order),
    [snapshot.skills]
  );
  const skillCategories = useMemo(
    () => Array.from(new Set(visibleSkills.map((s) => s.category))),
    [visibleSkills]
  );
  const filteredSkills = useMemo(
    () => (skillFilter === 'ALL' ? visibleSkills : visibleSkills.filter((s) => s.category === skillFilter)),
    [visibleSkills, skillFilter]
  );

  const visibleProjects = useMemo(
    () => [...snapshot.projects].filter((p) => p.visible).sort((a, b) => a.order - b.order),
    [snapshot.projects]
  );
  const projectCategories = useMemo(
    () => Array.from(new Set(visibleProjects.map((p) => p.category))),
    [visibleProjects]
  );
  const filteredProjects = useMemo(
    () =>
      projectFilter === 'ALL'
        ? visibleProjects
        : visibleProjects.filter((p) => p.category === projectFilter),
    [visibleProjects, projectFilter]
  );

  const orderedSections = useMemo(
    () => [...snapshot.sections].filter((s) => s.visible).sort((a, b) => a.order - b.order),
    [snapshot.sections]
  );

  const handleShuffleTheme = () => {
    const pool = enabledThemes.filter((t) => t.id !== activeThemeId);
    const targetPool = pool.length > 0 ? pool : enabledThemes;
    if (targetPool.length === 0) return;
    const next = targetPool[Math.floor(Math.random() * targetPool.length)];
    if (!previewMode) rememberSessionTheme(next.id);
    onSelectTheme(next.id);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (previewMode) {
      setContactState('success');
      setContactFeedback(
        `Preview mode: "${contactForm.subject || 'Inquiry'}" would be saved to MongoDB.`
      );
      return;
    }
    setContactState('submitting');
    setContactFeedback('');
    try {
      await submitPublicContact(contactForm);
      setContactState('success');
      setContactFeedback(snapshot.contact.formLabels.successMessage);
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setContactState('error');
      setContactFeedback(err instanceof Error ? err.message : 'Unable to send message.');
    }
  };

  const isMobileFrame = forcedViewport === 'mobile';
  const headerBg =
    snapshot.header.transparentOnTop && !scrolled
      ? 'transparent'
      : snapshot.header.bgColor || palette.navbarBg;
  const headerText = snapshot.header.textColor || palette.navbarText;

  const containerStyle: React.CSSProperties = {
    maxWidth: `${spacing.containerMaxWidth || 1200}px`,
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: '24px',
    paddingRight: '24px',
  };

  const renderSection = (sec: PortfolioSnapshot['sections'][number]) => {
    const sectionFont = getSectionFont(sec.key, sec.customFont, bodyFamily);
    const sectionHeadingFont = getSectionFont(sec.key, sec.customFont, headingFamily);
    const gradientKey = `${sec.key}Gradient` as keyof typeof snapshot.globalDesign.gradients;
    const globalGrad = snapshot.globalDesign.gradients.useSectionGradients
      ? (snapshot.globalDesign.gradients[gradientKey] as string)
      : '';
    const bgStyle: React.CSSProperties = {
      backgroundColor: sec.bgColor || undefined,
      backgroundImage: sec.bgGradient || globalGrad || undefined,
      color: sec.textColor || undefined,
      paddingTop: `${sec.paddingY || spacing.sectionPaddingY}px`,
      paddingBottom: `${sec.paddingY || spacing.sectionPaddingY}px`,
      fontFamily: sectionFont,
    };

    if (sec.key === 'hero') {
      const { hero } = snapshot;
      const isCentered = hero.layout === 'centered' || hero.alignment === 'center';
      const heroBgImage =
        hero.showBackgroundImage && hero.backgroundImageUrl
          ? hero.backgroundImageUrl
          : '';

      return (
        <section
          key={sec.id}
          id="hero"
          className="relative overflow-hidden"
          style={{
            ...bgStyle,
            paddingTop: `${hero.spacingY || sec.paddingY || 72}px`,
            paddingBottom: `${hero.spacingY || sec.paddingY || 72}px`,
          }}
        >
          {heroBgImage && (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center pointer-events-none"
                style={{ backgroundImage: `url(${heroBgImage})` }}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(10,10,12,0.68) 0%, rgba(10,10,12,0.52) 55%, rgba(10,10,12,0.8) 100%)',
                }}
              />
            </>
          )}
          <div className="relative z-10" style={containerStyle}>
            <div
              className={
                isCentered
                  ? 'max-w-3xl mx-auto text-center flex flex-col items-center'
                  : `grid grid-cols-1 ${isMobileFrame ? '' : 'lg:grid-cols-12'} gap-10 lg:gap-12 items-stretch`
              }
            >
              <div
                className={
                  isCentered
                    ? 'space-y-6'
                    : `${isMobileFrame ? '' : 'lg:col-span-7'} flex flex-col justify-center space-y-6`
                }
              >
                {hero.kicker && (
                  <p
                    className="text-sm font-medium tracking-wide"
                    style={{
                      color: heroBgImage ? '#E4E4E7' : hero.subtitleColor || palette.accent,
                      fontFamily: monoFamily,
                    }}
                  >
                    {hero.kicker}
                  </p>
                )}
                <h1
                  className="leading-[1.08] tracking-tight"
                  style={{
                    fontFamily: sectionHeadingFont,
                    fontSize: isMobileFrame
                      ? `${Math.max(32, Math.round(scale.h1Size * 0.65))}px`
                      : `clamp(2.25rem, 4.2vw, ${scale.h1Size}px)`,
                    fontWeight: scale.headingWeight,
                    letterSpacing: `${scale.letterSpacing}em`,
                    color: heroBgImage ? '#FFFFFF' : hero.headingColor || palette.headingText,
                    textWrap: 'balance',
                  }}
                >
                  {hero.heading}
                </h1>
                {hero.subtitle && (
                  <p
                    className="text-base font-medium"
                    style={{
                      color: heroBgImage ? '#D4D4D8' : hero.subtitleColor || palette.secondary,
                    }}
                  >
                    {hero.subtitle}
                  </p>
                )}
                <p
                  className="max-w-2xl"
                  style={{
                    fontSize: `${scale.bodySize}px`,
                    lineHeight: scale.lineHeight,
                    fontWeight: scale.bodyWeight,
                    color: heroBgImage ? '#E4E4E7' : hero.bodyColor || palette.bodyText,
                  }}
                >
                  {hero.introduction}
                </p>

                <div
                  className={`flex flex-wrap items-center gap-4 pt-2 ${
                    isCentered ? 'justify-center' : ''
                  }`}
                >
                  {snapshot.buttons.heroPrimary && (
                    <DynamicButton
                      button={snapshot.buttons.heroPrimary}
                      palette={palette}
                      defaultFont={buttonFontName}
                      defaultRadius={btnRadius}
                      variant="primary"
                    />
                  )}
                  {snapshot.buttons.heroSecondary && (
                    <DynamicButton
                      button={snapshot.buttons.heroSecondary}
                      palette={palette}
                      defaultFont={buttonFontName}
                      defaultRadius={btnRadius}
                      variant="secondary"
                    />
                  )}
                </div>
              </div>

              {!isCentered && (
                <div className={`${isMobileFrame ? '' : 'lg:col-span-5'} flex`}>
                  <div
                    className="w-full overflow-hidden border"
                    style={{
                      borderRadius: `${cardRadius}px`,
                      borderColor: palette.border,
                      backgroundColor: palette.surface,
                      boxShadow: theme.styles.cardShadow,
                      minHeight: isMobileFrame ? '320px' : '440px',
                    }}
                  >
                    <DynamicImage
                      src={hero.profileImageUrl}
                      alt={hero.profileImageAlt || snapshot.siteTitle}
                      className="w-full h-full object-cover"
                      fallbackBg={palette.surface}
                      fallbackText={palette.mutedText}
                    />
                  </div>
                </div>
              )}
            </div>

            {hero.metrics && hero.metrics.length > 0 && (
              <div
                className={`mt-14 pt-8 border-t grid grid-cols-2 ${
                  isMobileFrame ? '' : 'md:grid-cols-4'
                } gap-8`}
                style={{ borderColor: heroBgImage ? 'rgba(255,255,255,0.2)' : palette.border }}
              >
                {hero.metrics.map((metric) => (
                  <div key={metric.id} className="space-y-1">
                    <div
                      className="text-2xl md:text-3xl font-semibold tabular-nums tracking-tight"
                      style={{
                        fontFamily: sectionHeadingFont,
                        color: heroBgImage ? '#FFFFFF' : palette.headingText,
                      }}
                    >
                      {metric.value}
                    </div>
                    <div
                      className="text-sm"
                      style={{ color: heroBgImage ? '#D4D4D8' : palette.mutedText }}
                    >
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      );
    }

    if (sec.key === 'about') {
      const { about } = snapshot;
      return (
        <section
          key={sec.id}
          id="about"
          className="border-t"
          style={{
            ...bgStyle,
            backgroundColor: sec.bgColor || about.bgColor || palette.surface,
            borderColor: palette.border,
          }}
        >
          <div style={containerStyle}>
            <div className="max-w-3xl mb-12 space-y-3">
              <h2
                className="tracking-tight"
                style={{
                  fontFamily: sectionHeadingFont,
                  fontSize: `${scale.h2Size}px`,
                  fontWeight: scale.headingWeight,
                  color: sec.textColor || palette.headingText,
                  textWrap: 'balance',
                }}
              >
                {sec.title || about.sectionTitle}
              </h2>
              {(sec.subtitle || about.subtitle) && (
                <p className="text-lg font-medium" style={{ color: palette.secondary }}>
                  {sec.subtitle || about.subtitle}
                </p>
              )}
              {(sec.description || about.description) && (
                <p style={{ color: palette.bodyText, lineHeight: scale.lineHeight }}>
                  {sec.description || about.description}
                </p>
              )}
            </div>

            <div className={`grid grid-cols-1 ${isMobileFrame ? '' : 'lg:grid-cols-12'} gap-12`}>
              <div className={`${isMobileFrame ? '' : 'lg:col-span-5'} space-y-6`}>
                {about.portraitImageUrl && (
                  <div
                    className="overflow-hidden border aspect-[4/3]"
                    style={{
                      borderRadius: `${cardRadius}px`,
                      borderColor: palette.border,
                      backgroundColor: palette.cardBg,
                    }}
                  >
                    <DynamicImage
                      src={about.portraitImageUrl}
                      alt={snapshot.siteTitle}
                      className="w-full h-full object-cover"
                      fallbackBg={palette.cardBg}
                      fallbackText={palette.mutedText}
                    />
                  </div>
                )}

                <div
                  className="p-6 border space-y-4"
                  style={{
                    backgroundColor: palette.cardBg,
                    borderColor: palette.border,
                    borderRadius: `${cardRadius}px`,
                    color: palette.cardText,
                  }}
                >
                  <div className="flex items-center gap-3 text-sm">
                    {about.showIcons && (
                      <MapPin className="w-4 h-4 shrink-0" style={{ color: palette.iconColor }} />
                    )}
                    <span>{about.location}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {about.showIcons && (
                      <Calendar className="w-4 h-4 shrink-0" style={{ color: palette.iconColor }} />
                    )}
                    <span>{about.availability}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {about.showIcons && (
                      <Mail className="w-4 h-4 shrink-0" style={{ color: palette.iconColor }} />
                    )}
                    <a href={`mailto:${about.email}`} className="underline-offset-4 hover:underline">
                      {about.email}
                    </a>
                  </div>
                </div>
              </div>

              <div className={`${isMobileFrame ? '' : 'lg:col-span-7'} space-y-10`}>
                <div className="space-y-4 whitespace-pre-line" style={{ fontSize: `${scale.bodySize}px`, lineHeight: scale.lineHeight, color: sec.textColor || palette.bodyText }}>
                  {about.biography}
                </div>

                {snapshot.buttons.aboutCta && (
                  <div>
                    <DynamicButton
                      button={snapshot.buttons.aboutCta}
                      palette={palette}
                      defaultFont={buttonFontName}
                      defaultRadius={btnRadius}
                    />
                  </div>
                )}

                <div className={`grid grid-cols-1 ${isMobileFrame ? '' : 'md:grid-cols-2'} gap-8 pt-6 border-t`} style={{ borderColor: palette.border }}>
                  <div className="space-y-5">
                    <h3
                      className="text-base font-semibold tracking-tight"
                      style={{ fontFamily: sectionHeadingFont, color: palette.headingText }}
                    >
                      {about.experienceTitle || 'Experience'}
                    </h3>
                    <div className="space-y-5">
                      {about.experience.map((exp) => (
                        <div
                          key={exp.id}
                          className="pb-4 border-b last:border-b-0 last:pb-0 space-y-1"
                          style={{ borderColor: palette.border }}
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-medium text-sm" style={{ color: palette.headingText }}>
                              {exp.role}
                            </span>
                            <span className="text-xs tabular-nums shrink-0" style={{ color: palette.mutedText, fontFamily: monoFamily }}>
                              {exp.period}
                            </span>
                          </div>
                          <div className="text-xs font-medium" style={{ color: palette.accent }}>
                            {exp.company}
                          </div>
                          <p className="text-sm" style={{ color: palette.bodyText }}>
                            {exp.summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <h3
                      className="text-base font-semibold tracking-tight"
                      style={{ fontFamily: sectionHeadingFont, color: palette.headingText }}
                    >
                      {about.educationTitle || 'Education'}
                    </h3>
                    <div className="space-y-5">
                      {about.education.map((edu) => (
                        <div
                          key={edu.id}
                          className="pb-4 border-b last:border-b-0 last:pb-0 space-y-1"
                          style={{ borderColor: palette.border }}
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-medium text-sm" style={{ color: palette.headingText }}>
                              {edu.institution}
                            </span>
                            <span className="text-xs tabular-nums shrink-0" style={{ color: palette.mutedText, fontFamily: monoFamily }}>
                              {edu.period}
                            </span>
                          </div>
                          <div className="text-xs font-medium" style={{ color: palette.accent }}>
                            {edu.degree}
                          </div>
                          <p className="text-sm" style={{ color: palette.bodyText }}>
                            {edu.details}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (sec.key === 'skills') {
      const { skillsSection } = snapshot;
      const cardBg = skillsSection.cardBg || palette.cardBg;
      const cardBorder = skillsSection.cardBorder || palette.border;
      const cardText = skillsSection.cardText || palette.cardText;
      const progressBg = skillsSection.progressBg || palette.surface;
      const progressFill = skillsSection.progressFill || palette.accent;

      return (
        <section
          key={sec.id}
          id="skills"
          className="border-t"
          style={{ ...bgStyle, borderColor: palette.border }}
        >
          <div style={containerStyle}>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div className="max-w-2xl space-y-2">
                <h2
                  className="tracking-tight"
                  style={{
                    fontFamily: sectionHeadingFont,
                    fontSize: `${scale.h2Size}px`,
                    fontWeight: scale.headingWeight,
                    color: sec.textColor || palette.headingText,
                    textWrap: 'balance',
                  }}
                >
                  {sec.title || skillsSection.sectionTitle}
                </h2>
                <p style={{ color: palette.secondary }}>
                  {sec.subtitle || skillsSection.subtitle}
                </p>
                {(sec.description || skillsSection.description) && (
                  <p className="text-sm" style={{ color: palette.mutedText }}>
                    {sec.description || skillsSection.description}
                  </p>
                )}
              </div>

              <div
                className="inline-flex flex-wrap items-center gap-1 p-1 border self-start"
                style={{
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                  borderRadius: `${Math.max(6, cardRadius - 2)}px`,
                }}
              >
                <button
                  type="button"
                  onClick={() => setSkillFilter('ALL')}
                  className="px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                  style={{
                    borderRadius: `${Math.max(4, cardRadius - 4)}px`,
                    backgroundColor: skillFilter === 'ALL' ? palette.cardBg : 'transparent',
                    color: skillFilter === 'ALL' ? palette.headingText : palette.mutedText,
                  }}
                >
                  {skillsSection.allCategoryLabel || 'All'}
                </button>
                {skillCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSkillFilter(cat)}
                    className="px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                    style={{
                      borderRadius: `${Math.max(4, cardRadius - 4)}px`,
                      backgroundColor: skillFilter === cat ? palette.cardBg : 'transparent',
                      color: skillFilter === cat ? palette.headingText : palette.mutedText,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`grid grid-cols-1 ${
                isMobileFrame ? '' : 'md:grid-cols-2 lg:grid-cols-3'
              }`}
              style={{ gap: `${spacing.elementGap || 24}px` }}
            >
              {filteredSkills.map((skill) => {
                const IconComp = SKILL_ICONS[skill.iconName] || Code2;
                return (
                  <div
                    key={skill.id}
                    className="border flex flex-col justify-between gap-4"
                    style={{
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                      color: cardText,
                      borderRadius: `${cardRadius}px`,
                      padding: `${spacing.cardPadding || 24}px`,
                      boxShadow: theme.styles.cardShadow,
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 flex items-center justify-center border shrink-0"
                          style={{
                            borderColor: cardBorder,
                            backgroundColor: palette.surface,
                            borderRadius: `${Math.max(6, cardRadius - 4)}px`,
                          }}
                        >
                          <IconComp className="w-4 h-4" style={{ color: palette.iconColor }} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold truncate">{skill.name}</h3>
                          <p className="text-xs" style={{ color: palette.mutedText }}>
                            {skill.category}
                          </p>
                        </div>
                      </div>
                      {skillsSection.showPercentages && (
                        <span
                          className="text-sm font-semibold tabular-nums shrink-0"
                          style={{ fontFamily: monoFamily, color: palette.headingText }}
                        >
                          {skill.percentage}%
                        </span>
                      )}
                    </div>

                    <div
                      className="w-full h-1.5 overflow-hidden"
                      style={{
                        backgroundColor: progressBg,
                        borderRadius: '999px',
                      }}
                    >
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, skill.percentage))}%`,
                          backgroundColor: progressFill,
                          borderRadius: '999px',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    if (sec.key === 'projects') {
      const { projectsSection } = snapshot;
      const cardBg = projectsSection.cardBg || palette.cardBg;
      const cardBorder = projectsSection.cardBorder || palette.border;
      const cardText = projectsSection.cardText || palette.cardText;

      return (
        <section
          key={sec.id}
          id="projects"
          className="border-t"
          style={{
            ...bgStyle,
            backgroundColor: sec.bgColor || palette.surface,
            borderColor: palette.border,
          }}
        >
          <div style={containerStyle}>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div className="max-w-2xl space-y-2">
                <h2
                  className="tracking-tight"
                  style={{
                    fontFamily: sectionHeadingFont,
                    fontSize: `${scale.h2Size}px`,
                    fontWeight: scale.headingWeight,
                    color: sec.textColor || palette.headingText,
                    textWrap: 'balance',
                  }}
                >
                  {sec.title || projectsSection.sectionTitle}
                </h2>
                <p style={{ color: palette.secondary }}>
                  {sec.subtitle || projectsSection.subtitle}
                </p>
                {(sec.description || projectsSection.description) && (
                  <p className="text-sm" style={{ color: palette.mutedText }}>
                    {sec.description || projectsSection.description}
                  </p>
                )}
              </div>

              <div
                className="inline-flex flex-wrap items-center gap-1 p-1 border self-start"
                style={{
                  backgroundColor: palette.cardBg,
                  borderColor: palette.border,
                  borderRadius: `${Math.max(6, cardRadius - 2)}px`,
                }}
              >
                <button
                  type="button"
                  onClick={() => setProjectFilter('ALL')}
                  className="px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                  style={{
                    borderRadius: `${Math.max(4, cardRadius - 4)}px`,
                    backgroundColor: projectFilter === 'ALL' ? palette.surface : 'transparent',
                    color: projectFilter === 'ALL' ? palette.headingText : palette.mutedText,
                  }}
                >
                  {projectsSection.allFilterLabel || 'All Works'}
                </button>
                {projectCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setProjectFilter(cat)}
                    className="px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                    style={{
                      borderRadius: `${Math.max(4, cardRadius - 4)}px`,
                      backgroundColor: projectFilter === cat ? palette.surface : 'transparent',
                      color: projectFilter === cat ? palette.headingText : palette.mutedText,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`grid grid-cols-1 ${isMobileFrame ? '' : 'md:grid-cols-2'}`}
              style={{ gap: `${spacing.elementGap || 24}px` }}
            >
              {filteredProjects.map((project) => (
                <article
                  key={project.id}
                  className="border overflow-hidden flex flex-col justify-between group transition-transform duration-200 hover:-translate-y-0.5"
                  style={{
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                    color: cardText,
                    borderRadius: `${cardRadius}px`,
                    boxShadow: theme.styles.cardShadow,
                  }}
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => setSelectedProject(project)}
                      className="block w-full text-left overflow-hidden aspect-[4/3] cursor-pointer focus-visible:outline-2"
                      aria-label={`Inspect ${project.title}`}
                    >
                      <DynamicImage
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        fallbackBg={palette.surface}
                        fallbackText={palette.mutedText}
                      />
                    </button>

                    <div
                      className="space-y-3"
                      style={{ padding: `${spacing.cardPadding || 24}px` }}
                    >
                      <div
                        className="flex items-center gap-2 text-xs tabular-nums"
                        style={{ color: palette.mutedText, fontFamily: monoFamily }}
                      >
                        <span>{project.category}</span>
                        {project.year && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{project.year}</span>
                          </>
                        )}
                        {project.client && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{project.client}</span>
                          </>
                        )}
                      </div>

                      <h3
                        className="text-xl font-semibold tracking-tight cursor-pointer hover:underline underline-offset-4"
                        style={{ fontFamily: sectionHeadingFont, color: cardText }}
                        onClick={() => setSelectedProject(project)}
                      >
                        {project.title}
                      </h3>

                      <p
                        className="text-sm line-clamp-3"
                        style={{ color: palette.bodyText, lineHeight: 1.6 }}
                      >
                        {project.description}
                      </p>

                      {project.technologies.length > 0 && (
                        <div
                          className="pt-1 text-xs flex flex-wrap items-center gap-x-2 gap-y-1"
                          style={{ color: palette.mutedText, fontFamily: monoFamily }}
                        >
                          {project.technologies.map((tech, idx) => (
                            <React.Fragment key={`${project.id}-${tech}-${idx}`}>
                              <span>{tech}</span>
                              {idx < project.technologies.length - 1 && (
                                <span aria-hidden="true">·</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className="flex flex-wrap items-center justify-between gap-3 border-t"
                    style={{
                      borderColor: cardBorder,
                      padding: `14px ${spacing.cardPadding || 24}px`,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      {project.liveDemoUrl && (
                        <a
                          href={project.liveDemoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-opacity hover:opacity-90"
                          style={{
                            backgroundColor: projectsSection.liveButtonBg || palette.buttonBg,
                            color: projectsSection.liveButtonTextColor || palette.buttonText,
                            borderRadius: `${projectsSection.buttonRadius ?? btnRadius}px`,
                          }}
                        >
                          <span>{projectsSection.liveButtonText || 'Live Demo'}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border whitespace-nowrap shrink-0 transition-opacity hover:opacity-85"
                          style={{
                            backgroundColor: projectsSection.githubButtonBg || 'transparent',
                            color: projectsSection.githubButtonTextColor || cardText,
                            borderColor: cardBorder,
                            borderRadius: `${projectsSection.buttonRadius ?? btnRadius}px`,
                          }}
                        >
                          <Github className="w-3.5 h-3.5" />
                          <span>{projectsSection.githubButtonText || 'Source Code'}</span>
                        </a>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedProject(project)}
                      className="text-xs font-medium cursor-pointer hover:underline underline-offset-4 whitespace-nowrap shrink-0"
                      style={{ color: palette.accent }}
                    >
                      Details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (sec.key === 'contact') {
      const { contact } = snapshot;
      const isCentered = contact.layout === 'centered';

      return (
        <section
          key={sec.id}
          id="contact"
          className="border-t"
          style={{
            ...bgStyle,
            backgroundColor: sec.bgColor || contact.bgColor || undefined,
            borderColor: palette.border,
          }}
        >
          <div style={containerStyle}>
            <div
              className={
                isCentered
                  ? 'max-w-2xl mx-auto space-y-10'
                  : `grid grid-cols-1 ${isMobileFrame ? '' : 'lg:grid-cols-12'} gap-12`
              }
            >
              <div className={isCentered ? 'text-center space-y-4' : `${isMobileFrame ? '' : 'lg:col-span-5'} space-y-6`}>
                <h2
                  className="tracking-tight"
                  style={{
                    fontFamily: sectionHeadingFont,
                    fontSize: `${scale.h2Size}px`,
                    fontWeight: scale.headingWeight,
                    color: sec.textColor || palette.headingText,
                    textWrap: 'balance',
                  }}
                >
                  {sec.title || contact.sectionTitle}
                </h2>
                <p className="text-base font-medium" style={{ color: palette.secondary }}>
                  {sec.subtitle || contact.subtitle}
                </p>
                <p className="text-sm" style={{ color: palette.bodyText, lineHeight: scale.lineHeight }}>
                  {sec.description || contact.description}
                </p>

                <div className={`space-y-3 pt-2 ${isCentered ? 'inline-block text-left' : ''}`}>
                  {contact.email && (
                    <div className="flex items-center gap-3 text-sm">
                      {contact.showIcons && (
                        <Mail className="w-4 h-4 shrink-0" style={{ color: palette.iconColor }} />
                      )}
                      <a href={`mailto:${contact.email}`} className="hover:underline underline-offset-4">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-3 text-sm tabular-nums">
                      {contact.showIcons && (
                        <Phone className="w-4 h-4 shrink-0" style={{ color: palette.iconColor }} />
                      )}
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {contact.address && (
                    <div className="flex items-center gap-3 text-sm">
                      {contact.showIcons && (
                        <MapPin className="w-4 h-4 shrink-0" style={{ color: palette.iconColor }} />
                      )}
                      <span>{contact.address}</span>
                    </div>
                  )}
                </div>

                {contact.socialLinks.some((s) => s.visible) && (
                  <div className={`flex flex-wrap gap-4 pt-3 ${isCentered ? 'justify-center' : ''}`}>
                    {contact.socialLinks
                      .filter((s) => s.visible)
                      .map((soc) => (
                        <a
                          key={soc.id}
                          href={soc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline underline-offset-4"
                          style={{ color: palette.accent }}
                        >
                          <span>{soc.platform}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ))}
                  </div>
                )}
              </div>

              <div className={isCentered ? '' : `${isMobileFrame ? '' : 'lg:col-span-7'}`}>
                <form
                  onSubmit={handleContactSubmit}
                  className="border space-y-5"
                  style={{
                    backgroundColor: palette.cardBg,
                    borderColor: palette.border,
                    borderRadius: `${cardRadius}px`,
                    padding: `${spacing.cardPadding || 28}px`,
                    boxShadow: theme.styles.cardShadow,
                  }}
                >
                  <div className={`grid grid-cols-1 ${isMobileFrame ? '' : 'md:grid-cols-2'} gap-4`}>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium" style={{ color: palette.headingText }}>
                        {contact.formLabels.nameLabel}
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder={contact.formLabels.namePlaceholder}
                        className="w-full px-3.5 py-2.5 text-sm border focus:outline-none focus:ring-2"
                        style={{
                          backgroundColor: palette.inputBg,
                          color: palette.inputText,
                          borderColor: palette.inputBorder,
                          borderRadius: `${Math.max(4, btnRadius - 2)}px`,
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium" style={{ color: palette.headingText }}>
                        {contact.formLabels.emailLabel}
                      </label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder={contact.formLabels.emailPlaceholder}
                        className="w-full px-3.5 py-2.5 text-sm border focus:outline-none focus:ring-2"
                        style={{
                          backgroundColor: palette.inputBg,
                          color: palette.inputText,
                          borderColor: palette.inputBorder,
                          borderRadius: `${Math.max(4, btnRadius - 2)}px`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium" style={{ color: palette.headingText }}>
                      {contact.formLabels.subjectLabel}
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.subject}
                      onChange={(e) => setContactForm((f) => ({ ...f, subject: e.target.value }))}
                      placeholder={contact.formLabels.subjectPlaceholder}
                      className="w-full px-3.5 py-2.5 text-sm border focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: palette.inputBg,
                        color: palette.inputText,
                        borderColor: palette.inputBorder,
                        borderRadius: `${Math.max(4, btnRadius - 2)}px`,
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium" style={{ color: palette.headingText }}>
                      {contact.formLabels.messageLabel}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                      placeholder={contact.formLabels.messagePlaceholder}
                      className="w-full px-3.5 py-2.5 text-sm border focus:outline-none focus:ring-2 resize-y"
                      style={{
                        backgroundColor: palette.inputBg,
                        color: palette.inputText,
                        borderColor: palette.inputBorder,
                        borderRadius: `${Math.max(4, btnRadius - 2)}px`,
                      }}
                    />
                  </div>

                  {contactState === 'success' && (
                    <div
                      className="flex items-center gap-2.5 p-3 text-sm border"
                      style={{
                        borderColor: palette.accent,
                        backgroundColor: palette.surface,
                        color: palette.headingText,
                        borderRadius: `${Math.max(4, btnRadius - 2)}px`,
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: palette.accent }} />
                      <span>{contactFeedback}</span>
                    </div>
                  )}

                  {contactState === 'error' && (
                    <div className="p-3 text-sm border border-red-400 text-red-700 bg-red-50 rounded">
                      {contactFeedback}
                    </div>
                  )}

                  {snapshot.buttons.contactSubmit && (
                    <DynamicButton
                      button={snapshot.buttons.contactSubmit}
                      palette={palette}
                      defaultFont={buttonFontName}
                      defaultRadius={btnRadius}
                      type="submit"
                      disabled={contactState === 'submitting'}
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {contactState === 'submitting'
                          ? 'Sending...'
                          : snapshot.buttons.contactSubmit.label}
                      </span>
                    </DynamicButton>
                  )}
                </form>
              </div>
            </div>
          </div>
        </section>
      );
    }

    return null;
  };

  const footerBg = snapshot.footer.bgColor || palette.footerBg;
  const footerText = snapshot.footer.textColor || palette.footerText;
  const copyrightYear = snapshot.footer.copyright.showYear
    ? snapshot.footer.copyright.year || String(new Date().getFullYear())
    : '';

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-200"
      style={{
        backgroundColor: palette.background,
        color: palette.bodyText,
        fontFamily: bodyFamily,
      }}
    >
      {/* Dynamic Header & Navbar (3-Zone Contract) */}
      <header
        className={`w-full z-40 transition-colors duration-200 ${
          snapshot.header.sticky ? 'sticky top-0' : 'relative'
        }`}
        style={{
          backgroundColor: headerBg,
          color: headerText,
          borderBottom: theme.styles.navbarBorder,
          minHeight: `${snapshot.header.heightPx || 72}px`,
        }}
      >
        <div
          className="h-full flex items-center justify-between gap-8"
          style={{
            ...containerStyle,
            minHeight: `${snapshot.header.heightPx || 72}px`,
          }}
        >
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#hero"
            className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight whitespace-nowrap shrink-0"
            style={{ fontFamily: headingFamily, color: headerText }}
          >
            {snapshot.header.showLogoImage && snapshot.header.logoImageUrl && (
              <img
                src={snapshot.header.logoImageUrl}
                alt={snapshot.header.brandName}
                className="w-7 h-7 object-contain rounded"
                referrerPolicy="no-referrer"
              />
            )}
            <span>{snapshot.header.logoText || snapshot.header.brandName}</span>
          </a>

          {/* Zone 2: Clean Single-Line Nav Links */}
          {!isMobileFrame && (
            <nav
              className={`hidden md:flex items-center ${
                snapshot.header.alignment === 'center'
                  ? 'mx-auto'
                  : snapshot.header.alignment === 'left'
                  ? 'mr-auto ml-8'
                  : ''
              }`}
              style={{ gap: `${snapshot.header.spacingPx || 28}px`, fontFamily: navFamily }}
            >
              {visibleHeaderLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  className="text-sm font-medium whitespace-nowrap shrink-0 hover:underline underline-offset-4 transition-opacity hover:opacity-80"
                  style={{ color: headerText }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          {/* Zone 3: 1 Primary CTA + Mobile Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            {!isMobileFrame && snapshot.header.showCtaButton && snapshot.buttons.headerCta && (
              <div className="hidden md:block">
                <DynamicButton
                  button={snapshot.buttons.headerCta}
                  palette={palette}
                  defaultFont={buttonFontName}
                  defaultRadius={btnRadius}
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className={`${isMobileFrame ? 'inline-flex' : 'md:hidden inline-flex'} items-center gap-1.5 px-3 py-2 text-xs font-medium border cursor-pointer whitespace-nowrap shrink-0`}
              style={{
                borderColor: palette.border,
                color: headerText,
                borderRadius: `${Math.max(4, btnRadius - 2)}px`,
              }}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span>{snapshot.header.mobileMenuLabel || 'Menu'}</span>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div
            className="border-t px-6 py-4 space-y-3"
            style={{
              backgroundColor: palette.navbarBg,
              borderColor: palette.border,
              color: headerText,
            }}
          >
            <div className="flex flex-col space-y-2.5">
              {visibleHeaderLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium py-1"
                  style={{ color: headerText }}
                >
                  {link.label}
                </a>
              ))}
            </div>
            {snapshot.header.mobileShowCta && snapshot.buttons.headerCta && (
              <div className="pt-2">
                <DynamicButton
                  button={snapshot.buttons.headerCta}
                  palette={palette}
                  defaultFont={buttonFontName}
                  defaultRadius={btnRadius}
                  onClick={() => setMobileMenuOpen(false)}
                />
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Dynamic Sections */}
      <main className="flex-1">{orderedSections.map((sec) => renderSection(sec))}</main>

      {/* Dynamic Footer & Copyright */}
      <footer
        className="border-t"
        style={{
          backgroundColor: footerBg,
          color: footerText,
          borderColor: palette.border,
          paddingTop: `${snapshot.footer.paddingY || 64}px`,
          paddingBottom: `${Math.max(36, Math.round((snapshot.footer.paddingY || 64) * 0.7))}px`,
        }}
      >
        <div style={containerStyle}>
          <div
            className={`grid grid-cols-1 ${
              isMobileFrame
                ? ''
                : snapshot.footer.columns === 1
                ? 'md:grid-cols-1'
                : snapshot.footer.columns === 2
                ? 'md:grid-cols-2'
                : 'md:grid-cols-12'
            } gap-10 pb-10 border-b`}
            style={{ borderColor: 'rgba(255,255,255,0.12)' }}
          >
            <div
              className={`${
                snapshot.footer.columns === 3 && !isMobileFrame ? 'md:col-span-5' : ''
              } space-y-3 ${snapshot.footer.alignment === 'center' ? 'text-center mx-auto max-w-md' : ''}`}
            >
              <div className="flex items-center gap-2.5">
                {snapshot.footer.logoImageUrl && (
                  <img
                    src={snapshot.footer.logoImageUrl}
                    alt={snapshot.footer.brandName}
                    className="w-7 h-7 object-contain rounded"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span
                  className="text-lg font-bold tracking-tight"
                  style={{ fontFamily: headingFamily, color: footerText }}
                >
                  {snapshot.footer.logoText || snapshot.footer.brandName}
                </span>
              </div>
              <p className="text-sm opacity-80 leading-relaxed max-w-md">
                {snapshot.footer.description}
              </p>
            </div>

            {snapshot.footer.columns >= 2 && (
              <div
                className={`${
                  snapshot.footer.columns === 3 && !isMobileFrame ? 'md:col-span-3' : ''
                } space-y-3`}
              >
                <div className="text-xs font-semibold uppercase tracking-wider opacity-60">
                  Navigation
                </div>
                <ul className="space-y-2 text-sm">
                  {visibleFooterLinks.map((link) => (
                    <li key={link.id}>
                      <a href={link.href} className="opacity-85 hover:opacity-100 hover:underline underline-offset-4">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {snapshot.footer.columns >= 3 && (
              <div className={`${!isMobileFrame ? 'md:col-span-4' : ''} space-y-3`}>
                <div className="text-xs font-semibold uppercase tracking-wider opacity-60">
                  Connect & Themes
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  {snapshot.footer.socialLinks
                    .filter((s) => s.visible)
                    .map((soc) => (
                      <a
                        key={soc.id}
                        href={soc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-85 hover:opacity-100 hover:underline underline-offset-4"
                      >
                        {soc.label || soc.platform}
                      </a>
                    ))}
                </div>

                {/* Theme Studio Switcher */}
                <div className="pt-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs opacity-65">
                      Theme: <strong className="font-medium opacity-100">{theme.name}</strong>
                    </span>
                    {enabledThemes.length > 1 && (
                      <button
                        type="button"
                        onClick={handleShuffleTheme}
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 border border-current/25 rounded cursor-pointer hover:opacity-90 whitespace-nowrap shrink-0"
                      >
                        <Shuffle className="w-3 h-3" />
                        <span>Shuffle Theme</span>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {enabledThemes.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (!previewMode) rememberSessionTheme(t.id);
                          onSelectTheme(t.id);
                        }}
                        title={t.name}
                        className="w-6 h-6 rounded border cursor-pointer transition-transform hover:scale-110 flex items-center justify-center"
                        style={{
                          backgroundColor: t.colors.background,
                          borderColor:
                            t.id === theme.id ? palette.accent : 'rgba(255,255,255,0.28)',
                          boxShadow: t.id === theme.id ? `0 0 0 2px ${palette.accent}` : undefined,
                        }}
                        aria-label={`Switch to ${t.name} theme`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: t.colors.accent }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            className={`pt-6 flex flex-col sm:flex-row items-center gap-4 text-xs opacity-75 ${
              snapshot.footer.alignment === 'center'
                ? 'justify-center text-center'
                : 'justify-between'
            }`}
          >
            <div>
              {[
                snapshot.footer.copyright.prefix,
                copyrightYear,
                snapshot.footer.copyright.brandName,
                snapshot.footer.copyright.customText,
              ]
                .filter(Boolean)
                .join(' ')}
            </div>

            {onNavigateAdmin && (
              <button
                type="button"
                onClick={onNavigateAdmin}
                className="underline-offset-4 hover:underline cursor-pointer opacity-80 hover:opacity-100 whitespace-nowrap shrink-0"
              >
                Admin CMS
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Project Lightbox Modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/75 backdrop-blur-xs"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto border"
            style={{
              backgroundColor: palette.cardBg,
              color: palette.cardText,
              borderColor: palette.border,
              borderRadius: `${cardRadius}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between gap-4 px-6 py-4 border-b"
              style={{ borderColor: palette.border }}
            >
              <div className="min-w-0">
                <div className="text-xs tabular-nums" style={{ color: palette.mutedText, fontFamily: monoFamily }}>
                  {selectedProject.category} · {selectedProject.year}
                  {selectedProject.client ? ` · ${selectedProject.client}` : ''}
                </div>
                <h3 className="text-lg font-semibold truncate" style={{ fontFamily: headingFamily }}>
                  {selectedProject.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="p-2 border cursor-pointer hover:opacity-80"
                style={{
                  borderColor: palette.border,
                  borderRadius: `${Math.max(4, btnRadius - 2)}px`,
                }}
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-[16/9] w-full overflow-hidden bg-neutral-900">
              <DynamicImage
                src={selectedProject.imageUrl}
                alt={selectedProject.title}
                className="w-full h-full object-cover"
                fallbackBg={palette.surface}
                fallbackText={palette.mutedText}
              />
            </div>

            <div className="p-6 md:p-8 space-y-5">
              <p className="text-base leading-relaxed" style={{ color: palette.bodyText }}>
                {selectedProject.description}
              </p>

              <div className="text-xs flex flex-wrap gap-2" style={{ color: palette.mutedText, fontFamily: monoFamily }}>
                <span className="font-semibold" style={{ color: palette.headingText }}>Stack:</span>
                {selectedProject.technologies.join(' · ')}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {selectedProject.liveDemoUrl && (
                  <a
                    href={selectedProject.liveDemoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
                    style={{
                      backgroundColor: snapshot.projectsSection.liveButtonBg || palette.buttonBg,
                      color: snapshot.projectsSection.liveButtonTextColor || palette.buttonText,
                      borderRadius: `${snapshot.projectsSection.buttonRadius ?? btnRadius}px`,
                    }}
                  >
                    <span>{snapshot.projectsSection.liveButtonText || 'Live Demo'}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                )}
                {selectedProject.githubUrl && (
                  <a
                    href={selectedProject.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border"
                    style={{
                      backgroundColor: snapshot.projectsSection.githubButtonBg || 'transparent',
                      color: snapshot.projectsSection.githubButtonTextColor || palette.headingText,
                      borderColor: palette.border,
                      borderRadius: `${snapshot.projectsSection.buttonRadius ?? btnRadius}px`,
                    }}
                  >
                    <Github className="w-4 h-4" />
                    <span>{snapshot.projectsSection.githubButtonText || 'Source Code'}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
