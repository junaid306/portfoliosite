import type {
  CustomFontItem,
  PortfolioSnapshot,
  SeoSettings,
  ThemeConfig,
  ThemePalette,
  TypographySettings,
} from '../types/cms';

const SESSION_THEME_KEY = 'atelier_active_theme_id';

export function resolveInitialThemeId(snapshot: PortfolioSnapshot): string {
  const enabledThemes = snapshot.themes.filter((t) => t.enabled);
  const pool = enabledThemes.length > 0 ? enabledThemes : snapshot.themes;
  if (pool.length === 0) return '';

  const { enableRandomTheme, changeOnEveryVisit, defaultThemeId } = snapshot.themeControl;

  if (!enableRandomTheme) {
    const found = pool.find((t) => t.id === defaultThemeId);
    return found ? found.id : pool[0].id;
  }

  if (!changeOnEveryVisit && typeof window !== 'undefined') {
    const cached = window.sessionStorage.getItem(SESSION_THEME_KEY);
    if (cached && pool.some((t) => t.id === cached)) {
      return cached;
    }
  }

  const picked = pool[Math.floor(Math.random() * pool.length)];
  if (!changeOnEveryVisit && typeof window !== 'undefined') {
    window.sessionStorage.setItem(SESSION_THEME_KEY, picked.id);
  }
  return picked.id;
}

export function rememberSessionTheme(themeId: string) {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(SESSION_THEME_KEY, themeId);
  }
}

export function getResolvedTheme(snapshot: PortfolioSnapshot, activeThemeId: string): {
  theme: ThemeConfig;
  palette: ThemePalette;
} {
  const theme =
    snapshot.themes.find((t) => t.id === activeThemeId) ||
    snapshot.themes.find((t) => t.id === snapshot.themeControl.defaultThemeId) ||
    snapshot.themes[0];

  const basePalette = theme.colors;
  if (!snapshot.globalDesign.useGlobalColorOverrides) {
    return { theme, palette: basePalette };
  }

  // Merge non-empty global overrides onto the active theme palette
  const overrides = snapshot.globalDesign.colors;
  const merged: ThemePalette = { ...basePalette };
  (Object.keys(basePalette) as Array<keyof ThemePalette>).forEach((key) => {
    const val = overrides[key];
    if (val && val.trim() !== '') {
      merged[key] = val;
    }
  });

  return { theme, palette: merged };
}

export function buildFontFamily(fontName: string, fallback: 'sans' | 'serif' | 'mono' = 'sans'): string {
  const clean = fontName?.trim();
  const tail =
    fallback === 'serif'
      ? 'Georgia, "Times New Roman", serif'
      : fallback === 'mono'
      ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
      : 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  if (!clean) return tail;
  return `"${clean.replace(/"/g, '')}", ${tail}`;
}

export function inferFontFallback(fontName: string): 'sans' | 'serif' | 'mono' {
  const lower = fontName.toLowerCase();
  if (
    lower.includes('playfair') ||
    lower.includes('fraunces') ||
    lower.includes('serif') ||
    lower.includes('garamond') ||
    lower.includes('lora')
  ) {
    return 'serif';
  }
  if (lower.includes('mono') || lower.includes('code')) {
    return 'mono';
  }
  return 'sans';
}

export function injectCustomFonts(customFonts: CustomFontItem[]) {
  if (typeof document === 'undefined') return;
  const styleId = 'cms-custom-fonts-style';
  let el = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = styleId;
    document.head.appendChild(el);
  }
  const rules = customFonts
    .map((font) => {
      const fmt = font.format === 'ttf' ? 'truetype' : font.format;
      return `@font-face {
  font-family: "${font.family.replace(/"/g, '')}";
  src: url("${font.url}") format("${fmt}");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}`;
    })
    .join('\n');
  el.textContent = rules;
}

export function syncGoogleFontsLink(typography: TypographySettings, theme?: ThemeConfig) {
  if (typeof document === 'undefined') return;
  const customNames = new Set(typography.customFonts.map((f) => f.family));
  const candidates = [
    typography.headingFont,
    typography.bodyFont,
    typography.buttonFont,
    typography.navFont,
    typography.monoFont,
    typography.sectionFonts.hero,
    typography.sectionFonts.about,
    typography.sectionFonts.skills,
    typography.sectionFonts.projects,
    typography.sectionFonts.contact,
    theme?.typography.headingFont || '',
    theme?.typography.bodyFont || '',
    theme?.typography.buttonFont || '',
    theme?.typography.navFont || '',
  ]
    .map((f) => f?.trim())
    .filter((f): f is string => Boolean(f) && !customNames.has(f));

  const unique = Array.from(new Set(candidates));
  if (unique.length === 0) return;

  const linkId = 'cms-dynamic-google-fonts';
  let link = document.getElementById(linkId) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  const familiesQuery = unique
    .map((name) => `family=${encodeURIComponent(name).replace(/%20/g, '+')}:wght@300;400;500;600;700;800`)
    .join('&');
  const nextHref = `https://fonts.googleapis.com/css2?${familiesQuery}&display=swap`;
  if (link.href !== nextHref) {
    link.href = nextHref;
  }
}

export function applySeoMetadata(seo: SeoSettings) {
  if (typeof document === 'undefined') return;
  if (seo.metaTitle) {
    document.title = seo.metaTitle;
  }
  const setMeta = (selector: string, attr: 'name' | 'property', key: string, value: string) => {
    if (!value) return;
    let tag = document.querySelector(selector) as HTMLMetaElement | null;
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attr, key);
      document.head.appendChild(tag);
    }
    tag.content = value;
  };
  setMeta('meta[name="description"]', 'name', 'description', seo.metaDescription);
  setMeta('meta[name="keywords"]', 'name', 'keywords', seo.keywords);
  setMeta('meta[property="og:title"]', 'property', 'og:title', seo.ogTitle || seo.metaTitle);
  setMeta(
    'meta[property="og:description"]',
    'property',
    'og:description',
    seo.ogDescription || seo.metaDescription
  );
}
