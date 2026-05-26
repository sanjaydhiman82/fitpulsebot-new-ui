import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

import '../themes/theme-ocean-dark.css';
import '../themes/theme-ember.css';
import '../themes/theme-royal-purple.css';
import '../themes/theme-arctic.css';
import '../themes/theme-midnight-gold.css';
import '../themes/theme-forest.css';
import '../themes/theme-rose.css';

export interface BrandingData {
  appName?: string;
  logoUrl?: string;
  loginBannerUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  fontFamily?: string;
  borderRadius?: 'sharp' | 'soft' | 'rounded';
  sidebarStyle?: 'solid' | 'gradient' | 'glass';
  theme?: string;
  customCss?: string;
  source?: 'organization' | 'branch';
}

interface BrandingCtxValue { branding: BrandingData; loading: boolean; }
const BrandingContext = createContext<BrandingCtxValue>({ branding: {}, loading: false });
export function useBranding() { return useContext(BrandingContext); }

const CUSTOM_ID = 'org-branding-custom';
const VARS_ID   = 'org-branding-vars';

function injectStyle(id: string, css: string) {
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
  el.textContent = css;
}
function removeStyle(id: string) { document.getElementById(id)?.remove(); }

function buildVars(b: BrandingData): string {
  const L: string[] = [];
  if (b.primaryColor) {
    L.push(`--accent:${b.primaryColor};`);
    L.push(`--shadow-accent:0 6px 24px ${b.primaryColor}44;`);
    L.push(`--accent-glow:${b.primaryColor}28;`);
    L.push(`--accent-light:${b.primaryColor}22;`);
  }
  if (b.secondaryColor) L.push(`--accent-2:${b.secondaryColor};`);
  if (b.accentColor)    L.push(`--accent-3:${b.accentColor};`);
  if (b.backgroundColor) L.push(`--bg-base:${b.backgroundColor};`);
  if (b.foregroundColor) L.push(`--text-primary:${b.foregroundColor};`);
  if (b.fontFamily) {
    const FM: Record<string,string> = {
      inter:"'Inter',sans-serif", jakarta:"'Plus Jakarta Sans',sans-serif",
      poppins:"'Poppins',sans-serif", nunito:"'Nunito',sans-serif", roboto:"'Roboto',sans-serif",
    };
    L.push(`--font:${FM[b.fontFamily] || b.fontFamily};`);
  }
  if (b.borderRadius) {
    const RM: Record<string,string> = {
      sharp:  '--radius-xs:4px;--radius-sm:6px;--radius-md:8px;--radius-lg:12px;--radius-xl:16px;',
      soft:   '--radius-xs:6px;--radius-sm:10px;--radius-md:14px;--radius-lg:20px;--radius-xl:28px;',
      rounded:'--radius-xs:10px;--radius-sm:16px;--radius-md:20px;--radius-lg:28px;--radius-xl:40px;',
    };
    if (RM[b.borderRadius]) L.push(RM[b.borderRadius]);
  }
  return L.length ? `:root,[data-theme],[data-org-theme]{${L.join('')}}` : '';
}

// Normalize raw API response to BrandingData
// Advanced fields (theme, font, radius, css) are stored inside metadata JSON
function normalizeRaw(raw: any): BrandingData {
  const meta = raw?.metadata || {};
  return {
    appName:         raw?.appName        ?? raw?.app_name,
    logoUrl:         raw?.logoUrl        ?? raw?.logo_url,
    loginBannerUrl:  raw?.loginBannerUrl ?? raw?.login_banner_url,
    primaryColor:    raw?.primaryColor   ?? raw?.primary_color,
    secondaryColor:  raw?.secondaryColor ?? raw?.secondary_color,
    accentColor:     raw?.accentColor    ?? raw?.accent_color,
    // Advanced fields live in metadata
    backgroundColor: meta?.backgroundColor,
    foregroundColor: meta?.foregroundColor,
    fontFamily:      meta?.fontFamily,
    borderRadius:    meta?.borderRadius,
    sidebarStyle:    meta?.sidebarStyle,
    theme:           meta?.theme,
    customCss:       meta?.customCss,
    source:          raw?.source,
  };
}

// Merge branch branding on top of org branding
// Branch values take precedence; for any key that is empty/undefined in branch, use org value
function mergeBranding(org: BrandingData, branch: BrandingData): BrandingData {
  const result: BrandingData = { ...org };
  const keys = Object.keys(branch) as (keyof BrandingData)[];
  for (const k of keys) {
    const v = branch[k];
    if (v !== undefined && v !== null && v !== '') {
      (result as any)[k] = v;
    }
  }
  return result;
}

export function BrandingProvider({ orgId, branchId, children }: {
  orgId?: string; branchId?: string; children: React.ReactNode;
}) {
  const [branding, setBranding] = useState<BrandingData>({});
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!orgId && !branchId) return;
    setLoading(true);

    if (branchId && orgId) {
      // Fetch BOTH org and branch branding, merge with branch taking precedence
      Promise.all([
        api.org.getBranding(orgId).catch(() => ({})),
        api.branch.getBranding(branchId).catch(() => ({})),
      ]).then(([orgRaw, branchRaw]) => {
        const orgB    = normalizeRaw(orgRaw);
        const branchB = normalizeRaw(branchRaw);
        const merged  = mergeBranding(orgB, branchB);




        setBranding(merged);
      }).finally(() => setLoading(false));
    } else if (branchId) {
      // Only branchId, no orgId — just fetch branch
      api.branch.getBranding(branchId)
        .then(raw => setBranding(normalizeRaw(raw)))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      // Only orgId
      api.org.getBranding(orgId!)
        .then(raw => setBranding(normalizeRaw(raw)))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [orgId, branchId]);

  // Apply data-org-theme on the [data-theme] div (same element as dark/light theme)
  // Must target the same element so CSS specificity works correctly
  useEffect(() => {
    // Find the app root div that has data-theme attribute
    const appDiv = document.querySelector('[data-theme]') as HTMLElement | null;
    const target = appDiv || document.documentElement;
    const themeId = branding.theme;
    if (themeId && themeId !== 'default') {
      target.setAttribute('data-org-theme', themeId);
    } else {
      target.removeAttribute('data-org-theme');
    }
    // No cleanup - don't remove on unmount; parent provider stays mounted
  }, [branding.theme]);

  // Apply dynamic CSS variable overrides
  useEffect(() => {
    const css = buildVars(branding);
    if (css) injectStyle(VARS_ID, css); else removeStyle(VARS_ID);
    return () => removeStyle(VARS_ID);
  }, [branding.primaryColor, branding.secondaryColor, branding.accentColor,
      branding.backgroundColor, branding.foregroundColor, branding.fontFamily, branding.borderRadius]);

  // Apply custom CSS
  useEffect(() => {
    if (branding.customCss) injectStyle(CUSTOM_ID, branding.customCss);
    else removeStyle(CUSTOM_ID);
    return () => removeStyle(CUSTOM_ID);
  }, [branding.customCss]);

  return (
    <BrandingContext.Provider value={{ branding, loading }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBrandingPortalProps() {
  const { branding } = useBranding();
  return {
    accentColor: branding.primaryColor,
    logoUrl: branding.logoUrl,
    roleBadgeColor: branding.accentColor || branding.primaryColor,
  };
}
