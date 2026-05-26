import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { FormField, inputStyle, PrimaryBtn, OutlineBtn } from './PortalLayout';
import {
  Palette, Image, Type, Layers, Code2, Eye,
  CheckCircle2, Loader, RotateCcw, Sparkles,
  Sun, Moon, ChevronRight,
} from 'lucide-react';

// ── Theme catalogue ──────────────────────────────────────────────────────
export const PRESET_THEMES = [
  { id: 'default',       label: 'FitPulse Default', dark: true,  preview: { bg:'#0d1f30', accent:'#3dbf96', card:'#122336' } },
  { id: 'ocean-dark',    label: 'Ocean Dark',        dark: true,  preview: { bg:'#050f1a', accent:'#3dbf96', card:'#122336' } },
  { id: 'ember',         label: 'Ember',             dark: true,  preview: { bg:'#0f0a08', accent:'#f97316', card:'#221410' } },
  { id: 'royal-purple',  label: 'Royal Purple',      dark: true,  preview: { bg:'#08050f', accent:'#8b5cf6', card:'#1c1230' } },
  { id: 'midnight-gold', label: 'Midnight Gold',     dark: true,  preview: { bg:'#080604', accent:'#d97706', card:'#1c170e' } },
  { id: 'forest',        label: 'Forest',            dark: true,  preview: { bg:'#040d06', accent:'#22c55e', card:'#101f13' } },
  { id: 'arctic',        label: 'Arctic Light',      dark: false, preview: { bg:'#f0f6ff', accent:'#3b82f6', card:'#ffffff' } },
  { id: 'rose',          label: 'Rose',              dark: false, preview: { bg:'#fff5f7', accent:'#f43f5e', card:'#ffffff' } },
];

const FONT_OPTIONS = [
  { id: 'jakarta',  label: 'Plus Jakarta Sans' },
  { id: 'inter',    label: 'Inter' },
  { id: 'poppins',  label: 'Poppins' },
  { id: 'nunito',   label: 'Nunito' },
  { id: 'roboto',   label: 'Roboto' },
];

const RADIUS_OPTIONS = [
  { id: 'sharp',   label: 'Sharp', preview: 4 },
  { id: 'soft',    label: 'Soft',  preview: 10 },
  { id: 'rounded', label: 'Rounded', preview: 20 },
];

const SIDEBAR_STYLES = [
  { id: 'solid',    label: 'Solid' },
  { id: 'gradient', label: 'Gradient' },
  { id: 'glass',    label: 'Glass' },
];

const TABS = [
  { id: 'theme',   label: 'Theme',      icon: Palette },
  { id: 'brand',   label: 'Brand',      icon: Image },
  { id: 'colors',  label: 'Colors',     icon: Sparkles },
  { id: 'style',   label: 'Page Style', icon: Layers },
  { id: 'custom',  label: 'Custom CSS', icon: Code2 },
];

// ── Color field with picker + hex ────────────────────────────────────────
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <FormField label={label}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="color"
          value={value || '#3dbf96'}
          onChange={e => onChange(e.target.value)}
          style={{ width: 44, height: 40, borderRadius: 8, border: '1px solid var(--border)', padding: 2, cursor: 'pointer', background: 'transparent', flexShrink: 0 }}
        />
        <input
          style={{ ...inputStyle, flex: 1 }}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="#3dbf96"
          spellCheck={false}
        />
      </div>
    </FormField>
  );
}

// ── Live preview mini ────────────────────────────────────────────────────
function MiniPreview({ data }: { data: any }) {
  const theme = PRESET_THEMES.find(t => t.id === data.theme) || PRESET_THEMES[0];
  const bg = data.backgroundColor || theme.preview.bg;
  const accent = data.primaryColor || theme.preview.accent;
  const card = theme.preview.card;
  const text = theme.dark ? '#e8f4fa' : '#0d1f3c';
  const muted = theme.dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const radius = data.borderRadius === 'sharp' ? 4 : data.borderRadius === 'rounded' ? 16 : 10;

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', background: bg, fontSize: 11, userSelect: 'none' }}>
      {/* Topbar */}
      <div style={{ background: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderBottom: `1px solid rgba(${theme.dark?'255,255,255':'0,0,0'},.08)`, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {data.logoUrl
          ? <img src={data.logoUrl} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover' }} />
          : <div style={{ width: 18, height: 18, borderRadius: 4, background: accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize: 9, fontWeight: 900, color: '#fff' }}>{(data.appName || 'G')[0]}</div>
        }
        <span style={{ fontSize: 11, fontWeight: 800, color: text }}>{data.appName || 'Your Gym'}</span>
        <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: accent }} />
      </div>
      {/* Content area */}
      <div style={{ padding: 10, display: 'flex', gap: 8 }}>
        {/* Sidebar */}
        <div style={{ width: 48, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 8, borderRadius: radius/2, background: i === 1 ? accent + '33' : 'rgba(255,255,255,0.07)', border: i === 1 ? `1px solid ${accent}44` : 'none' }} />
          ))}
        </div>
        {/* Cards */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ background: card, borderRadius: radius, padding: '5px 6px', border: `1px solid rgba(${theme.dark?'255,255,255':'0,0,0'},.08)` }}>
              <div style={{ height: 5, width: '60%', borderRadius: 3, background: i === 0 ? accent : muted, marginBottom: 3 }} />
              <div style={{ height: 4, width: '80%', borderRadius: 3, background: muted, opacity: 0.5 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main AdvancedBrandingEditor ──────────────────────────────────────────
export interface AdvancedBrandingEditorProps {
  orgId?: string;
  branchId?: string;
  isOrg?: boolean;
}

export default function AdvancedBrandingEditor({ orgId, branchId, isOrg = true }: AdvancedBrandingEditorProps) {
  const [tab, setTab] = useState('theme');
  const [data, setData] = useState<any>({});
  const [original, setOriginal] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  const entityId = branchId || orgId || '';

  useEffect(() => {
    if (!entityId) return;
    setLoading(true);
    const p = branchId ? api.branch.getBranding(branchId) : api.org.getBranding(orgId!);
    p.then((raw: any) => {
      const norm: any = {
        appName: raw?.appName ?? raw?.app_name ?? '',
        logoUrl: raw?.logoUrl ?? raw?.logo_url ?? '',
        loginBannerUrl: raw?.loginBannerUrl ?? raw?.login_banner_url ?? '',
        primaryColor: raw?.primaryColor ?? raw?.primary_color ?? '',
        secondaryColor: raw?.secondaryColor ?? raw?.secondary_color ?? '',
        accentColor: raw?.accentColor ?? raw?.accent_color ?? '',
        backgroundColor: raw?.backgroundColor ?? raw?.background_color ?? '',
        foregroundColor: raw?.foregroundColor ?? raw?.foreground_color ?? '',
        fontFamily: raw?.fontFamily ?? raw?.font_family ?? 'jakarta',
        borderRadius: raw?.borderRadius ?? raw?.border_radius ?? 'soft',
        sidebarStyle: raw?.sidebarStyle ?? raw?.sidebar_style ?? 'solid',
        theme: raw?.theme ?? 'default',
        customCss: raw?.customCss ?? raw?.custom_css ?? '',
        customDomain: raw?.customDomain ?? raw?.custom_domain ?? '',
      };
      setData(norm);
      setOriginal(norm);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [entityId, orgId, branchId]);

  const set = (k: string, v: any) => setData((p: any) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true); setSaved(false); setErr('');
    try {
      const p = branchId ? api.branch.putBranding(branchId, data) : api.org.putBranding(orgId!, data);
      await p;
      setOriginal(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const reset = () => { setData(original); setErr(''); };

  const hasChanges = JSON.stringify(data) !== JSON.stringify(original);

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
      <Loader size={22} style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ marginTop: 12, fontSize: 13 }}>Loading branding…</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 4px' }}>
            {isOrg ? 'Organization Branding' : 'Branch Branding'}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            {isOrg
              ? 'Your branding cascades to all branches, trainers, and members unless overridden at branch level.'
              : 'Branch-level overrides apply on top of organization branding for this branch.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {saved && (
            <span style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={13} /> Saved!
            </span>
          )}
          {err && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{err}</span>}
          {hasChanges && <OutlineBtn onClick={reset}><RotateCcw size={13} /> Reset</OutlineBtn>}
          <PrimaryBtn onClick={save} loading={saving}>
            {saving ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={13} />}
            Save Branding
          </PrimaryBtn>
        </div>
      </div>

      {/* Body: tabs + preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 20, alignItems: 'start' }}>
        {/* Left: Tabs */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
            {TABS.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    flex: 1, minWidth: 80, padding: '12px 8px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 4, fontSize: 11, fontWeight: active ? 700 : 500,
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    background: active ? 'var(--accent-light)' : 'transparent',
                    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                    borderLeft: 'none', borderRight: 'none', borderTop: 'none',
                    transition: 'all 0.15s', cursor: 'pointer',
                  }}
                >
                  <Icon size={15} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div style={{ padding: 24 }}>
            {/* ── THEME TAB ── */}
            {tab === 'theme' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Select a preset theme. Colors and CSS variables are applied globally to all users in your org.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 12 }}>
                  {PRESET_THEMES.map(t => {
                    const selected = (data.theme || 'default') === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => set('theme', t.id)}
                        style={{
                          border: selected ? `2px solid var(--accent)` : '2px solid var(--border)',
                          borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                          background: 'transparent', padding: 0, position: 'relative', textAlign: 'left',
                          boxShadow: selected ? 'var(--shadow-accent)' : 'none',
                          transition: 'all 0.15s',
                        }}
                      >
                        {/* Mini preview swatch */}
                        <div style={{ background: t.preview.bg, padding: '10px 10px 6px' }}>
                          <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                            <div style={{ height: 6, flex: 2, borderRadius: 3, background: t.preview.accent }} />
                            <div style={{ height: 6, flex: 1, borderRadius: 3, background: 'rgba(255,255,255,0.15)' }} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                            {[0,1,2,3].map(i => (
                              <div key={i} style={{ height: 14, borderRadius: 4, background: t.preview.card, border: `1px solid rgba(255,255,255,0.08)`, opacity: i === 0 ? 1 : 0.6 }} />
                            ))}
                          </div>
                        </div>
                        {/* Label */}
                        <div style={{
                          padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: 'var(--bg-card)',
                        }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{t.label}</span>
                          <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 20,
                            background: t.dark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.08)',
                            color: t.dark ? '#aaa' : '#555', fontWeight: 600 }}>
                            {t.dark ? <Moon size={8} /> : <Sun size={8} />}
                          </span>
                        </div>
                        {selected && (
                          <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle2 size={11} color="#fff" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── BRAND TAB ── */}
            {tab === 'brand' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormField label="App / Gym Name">
                  <input style={inputStyle} value={data.appName || ''} onChange={e => set('appName', e.target.value)} placeholder="My Fitness Club" />
                </FormField>
                <FormField label="Custom Domain">
                  <input style={inputStyle} value={data.customDomain || ''} onChange={e => set('customDomain', e.target.value)} placeholder="app.mygym.com" />
                </FormField>
                <div style={{ gridColumn: '1/-1' }}>
                  <FormField label="Logo URL">
                    <input style={inputStyle} value={data.logoUrl || ''} onChange={e => set('logoUrl', e.target.value)} placeholder="https://cdn.example.com/logo.png" />
                  </FormField>
                </div>
                {data.logoUrl && (
                  <div style={{ gridColumn: '1/-1', padding: 16, borderRadius: 12, border: '1px dashed var(--border)', background: 'var(--bg-base)', textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px' }}>Logo Preview</p>
                    <img src={data.logoUrl} alt="" style={{ maxHeight: 64, maxWidth: 200, objectFit: 'contain' }} onError={e => (e.currentTarget.style.opacity = '0.3')} />
                  </div>
                )}
                <div style={{ gridColumn: '1/-1' }}>
                  <FormField label="Login Banner URL">
                    <input style={inputStyle} value={data.loginBannerUrl || ''} onChange={e => set('loginBannerUrl', e.target.value)} placeholder="https://cdn.example.com/banner.jpg" />
                  </FormField>
                </div>
                {data.loginBannerUrl && (
                  <div style={{ gridColumn: '1/-1', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={data.loginBannerUrl} alt="" style={{ width: '100%', maxHeight: 140, objectFit: 'cover', display: 'block' }} onError={e => (e.currentTarget.style.opacity = '0.2')} />
                  </div>
                )}
              </div>
            )}

            {/* ── COLORS TAB ── */}
            {tab === 'colors' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ background: 'var(--accent-light)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
                  💡 Color overrides layer on top of your selected theme. Leave blank to use the theme defaults.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <ColorField label="Primary / Accent Color" value={data.primaryColor || ''} onChange={v => set('primaryColor', v)} />
                  <ColorField label="Secondary Color" value={data.secondaryColor || ''} onChange={v => set('secondaryColor', v)} />
                  <ColorField label="Highlight / Accent-3 Color" value={data.accentColor || ''} onChange={v => set('accentColor', v)} />
                  <div />
                  <ColorField label="Background Color Override" value={data.backgroundColor || ''} onChange={v => set('backgroundColor', v)} />
                  <ColorField label="Foreground / Text Color Override" value={data.foregroundColor || ''} onChange={v => set('foregroundColor', v)} />
                </div>
                {(data.primaryColor || data.secondaryColor || data.accentColor) && (
                  <div style={{ display: 'flex', gap: 10, padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-base)' }}>
                    {[
                      { label: 'Primary', color: data.primaryColor },
                      { label: 'Secondary', color: data.secondaryColor },
                      { label: 'Highlight', color: data.accentColor },
                    ].filter(c => c.color).map(c => (
                      <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: c.color, border: '1px solid var(--border)' }} />
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{c.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{c.color}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── PAGE STYLE TAB ── */}
            {tab === 'style' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Font */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>Font Family</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {FONT_OPTIONS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => set('fontFamily', f.id)}
                        style={{
                          padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                          border: data.fontFamily === f.id ? '2px solid var(--accent)' : '2px solid var(--border)',
                          background: data.fontFamily === f.id ? 'var(--accent-light)' : 'transparent',
                          color: data.fontFamily === f.id ? 'var(--accent)' : 'var(--text-secondary)',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border radius */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>Corner Style</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {RADIUS_OPTIONS.map(r => (
                      <button
                        key={r.id}
                        onClick={() => set('borderRadius', r.id)}
                        style={{
                          flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                          border: data.borderRadius === r.id ? '2px solid var(--accent)' : '2px solid var(--border)',
                          background: data.borderRadius === r.id ? 'var(--accent-light)' : 'var(--bg-base)',
                          borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ width: 40, height: 24, borderRadius: r.preview, background: data.borderRadius === r.id ? 'var(--accent)' : 'var(--border)', transition: 'all 0.15s' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: data.borderRadius === r.id ? 'var(--accent)' : 'var(--text-muted)' }}>{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sidebar style */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>Sidebar Style</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {SIDEBAR_STYLES.map(s => (
                      <button
                        key={s.id}
                        onClick={() => set('sidebarStyle', s.id)}
                        style={{
                          flex: 1, minWidth: 80, padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                          border: data.sidebarStyle === s.id ? '2px solid var(--accent)' : '2px solid var(--border)',
                          background: data.sidebarStyle === s.id ? 'var(--accent-light)' : 'transparent',
                          color: data.sidebarStyle === s.id ? 'var(--accent)' : 'var(--text-secondary)',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── CUSTOM CSS TAB ── */}
            {tab === 'custom' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--warning)' }}>
                  ⚠️ Advanced: Custom CSS is injected into all pages for users in your organization. Use CSS variables like <code>var(--accent)</code>, <code>var(--bg-card)</code> etc.
                </div>
                <FormField label="Custom CSS">
                  <textarea
                    value={data.customCss || ''}
                    onChange={e => set('customCss', e.target.value)}
                    placeholder={`/* Example: override sidebar background */\n.portal-sidebar { background: linear-gradient(180deg, #1a0a2e, #0d0720) !important; }\n\n/* Round stat cards more */\n[class*="StatCard"] { border-radius: 24px !important; }`}
                    style={{ ...inputStyle, minHeight: 220, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, resize: 'vertical' }}
                  />
                </FormField>
                {data.customCss && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Eye size={12} /> Custom CSS is active — {data.customCss.split('\n').length} lines
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Live preview + cascade info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 80 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 16, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Eye size={12} /> Live Preview
            </div>
            <MiniPreview data={data} />
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 16, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
              Branding Cascade
            </div>
            {[
              { label: isOrg ? 'Organization (you)' : 'Organization', active: isOrg, color: '#0ea5e9' },
              { label: 'Branches', active: true, color: '#f59e0b' },
              { label: 'Trainers', active: true, color: '#8b5cf6' },
              { label: 'Members', active: true, color: 'var(--accent)' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: item.active ? 'var(--text-secondary)' : 'var(--text-muted)', fontWeight: item.active ? 700 : 400 }}>
                  {item.label}
                </span>
                {i < 3 && <ChevronRight size={10} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />}
              </div>
            ))}
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
              Branches can override any setting. If no branch override exists, org branding applies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
