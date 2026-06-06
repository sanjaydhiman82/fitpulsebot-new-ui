import React, { useCallback, useEffect, useState } from 'react';
import { Edit2, RefreshCw, Search, Trash2 } from 'lucide-react';
import { api, apiFetch } from '../api';
import { DataTable, FormField, inputStyle, OutlineBtn, PrimaryBtn } from './PortalLayout';

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'mr', label: 'Marathi' },
  { code: 'bn', label: 'Bengali' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'pa', label: 'Punjabi' },
  { code: 'ur', label: 'Urdu' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'ar', label: 'Arabic' },
];

type IndustryOption = { slug: string; name: string; organizationId?: string };

const NAMESPACES = ['common', 'auth', 'menu', 'message', 'dashboard', 'reports'];

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 18,
};

const controlStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 46,
  height: 46,
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 700,
};

const CardHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 16, fontWeight: 900 }}>{title}</div>
    <div style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.45 }}>{subtitle}</div>
  </div>
);

export default function AdminLabelManagement() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [industries, setIndustries] = useState<IndustryOption[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [industry, setIndustry] = useState('');
  const [locale, setLocale] = useState('en');
  const namespace = '';
  const [labels, setLabels] = useState<any[]>([]);
  const [filterOrg, setFilterOrg] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterLocale, setFilterLocale] = useState('');
  const [filterNamespace, setFilterNamespace] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [orgLoadError, setOrgLoadError] = useState('');

  useEffect(() => {
    setOrgLoadError('');
    Promise.all([
      api.superAdmin.listOrgs({ pageSize: 100 }),
      apiFetch('/mock-data/industries'),
    ])
      .then(([orgData, industryData]) => {
        const list = Array.isArray(industryData?.industries) ? industryData.industries : [];
        setOrgs(orgData.organizations || []);
        setIndustries(list);
        setIndustry(prev => prev || list[0]?.slug || '');
      })
      .catch((e: any) => {
        setOrgs([]);
        setOrgLoadError(e.message || 'Failed to load organizations.');
      });
  }, []);

  useEffect(() => {
    setBranchId('');
    if (!organizationId) { setBranches([]); return; }
    api.org.listBranches(organizationId, { pageSize: 100 })
      .then(d => setBranches(d.branches || []))
      .catch(() => setBranches([]));
  }, [organizationId]);

  const load = useCallback(() => {
    const scopeOrganizationId = filterOrg || organizationId;
    if (!scopeOrganizationId) {
      setLabels([]);
      return;
    }
    setLoading(true);
    api.labels.manage({
      organizationId: scopeOrganizationId,
      branchId: (filterBranch || branchId) || undefined,
      locale: filterLocale || locale,
      namespace: filterNamespace || namespace,
    })
      .then(d => setLabels(d.labels || []))
      .catch((e: any) => setMessage(e.message || 'Failed to load labels.'))
      .finally(() => setLoading(false));
  }, [organizationId, branchId, locale, namespace, filterOrg, filterBranch, filterLocale, filterNamespace]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!organizationId) { setMessage('Select an organization before saving labels.'); return; }
    if (!industry) { setMessage('Select an industry before importing labels.'); return; }
    const result = await api.labels.importMockIndustry(industry, {
      organizationId,
      branchId: branchId || undefined,
      locale,
    });
    setMessage(`Imported ${result.imported || 0} labels from ${industryName(industry)}.`);
    load();
  };

  const deleteLabel = async (row: any) => {
    if (!row?.id) { setMessage('Unable to delete label without an id.'); return; }
    if (!window.confirm(`Delete label "${row.label_key}"?`)) return;
    try {
      await api.labels.delete(row.id);
      setMessage(`Deleted label "${row.label_key}".`);
      load();
    } catch (e: any) {
      setMessage(e.message || 'Unable to delete label.');
    }
  };

  const orgName = (id?: string) => orgs.find(o => o.id === id)?.name || (id ? 'Selected Organization' : 'All Organizations');
  const branchName = (id?: string) => branches.find(b => b.id === id)?.name || (id ? 'Selected Branch' : 'All Branches');
  const industryName = (slug?: string) => industries.find(item => item.slug === slug)?.name || (slug ? slug : 'All Industries');
  const visibleLabels = labels.filter(row => {
    const q = filterSearch.trim().toLowerCase();
    if (!q) return true;
    return [row.label_key, row.label_value, row.default_value, row.description].filter(Boolean).some(v => String(v).toLowerCase().includes(q));
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Labels & Language</h2>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>Organize and manage platform labels and language settings across organizations and branches.</p>
      </div>

      {message && <div style={{ ...cardStyle, padding: 12, color: 'var(--text-secondary)', fontSize: 13 }}>{message}</div>}

      <div style={cardStyle}>
        <CardHeader title="Add Label" subtitle="Create labels for organizations, branches, industries, locales, and namespaces." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(160px, 1fr)) auto', gap: 14, alignItems: 'end' }}>
          <FormField label="Organization" required>
            <select style={controlStyle} value={organizationId} onChange={e => setOrganizationId(e.target.value)}>
              <option value="">Select organization</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            {orgLoadError && <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 6 }}>{orgLoadError}</div>}
          </FormField>
          <FormField label="Branch" required>
            <select style={controlStyle} value={branchId} onChange={e => setBranchId(e.target.value)} disabled={!organizationId}>
              <option value="">Select branch</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </FormField>
          <FormField label="Industry" required>
            <select style={controlStyle} value={industry} onChange={e => setIndustry(e.target.value)}>
              {industries.length === 0 ? <option value="">No industries available</option> : industries.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}
            </select>
          </FormField>
          <FormField label="Locale" required>
            <select style={controlStyle} value={locale} onChange={e => setLocale(e.target.value || 'en')}>
              {LOCALES.map(l => <option key={l.code} value={l.code}>{l.label} ({l.code})</option>)}
            </select>
          </FormField>
          <PrimaryBtn onClick={save} style={{ height: 46, minHeight: 46, padding: '0 24px', whiteSpace: 'nowrap' }}>+ Add Label</PrimaryBtn>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
          <CardHeader title="Previously Saved Labels" subtitle="View, search, filter, and manage all saved labels across organizations, branches, industries, locales, and namespaces." />
          <OutlineBtn onClick={load} style={{ height: 42 }}><RefreshCw size={13} /> Refresh</OutlineBtn>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(150px, 1fr)) minmax(180px, .9fr)', gap: 12, marginBottom: 16 }}>
          <FormField label="Organization"><select style={controlStyle} value={filterOrg} onChange={e => setFilterOrg(e.target.value)}><option value="">All Organizations</option>{orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></FormField>
          <FormField label="Branch"><select style={controlStyle} value={filterBranch} onChange={e => setFilterBranch(e.target.value)}><option value="">All Branches</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></FormField>
          <FormField label="Industry"><select style={controlStyle} value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)}><option value="">All Industries</option>{industries.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></FormField>
          <FormField label="Locale"><select style={controlStyle} value={filterLocale} onChange={e => setFilterLocale(e.target.value)}><option value="">All Locales</option>{LOCALES.map(l => <option key={l.code} value={l.code}>{l.label} ({l.code})</option>)}</select></FormField>
          <FormField label="Namespace"><select style={controlStyle} value={filterNamespace} onChange={e => setFilterNamespace(e.target.value)}><option value="">All Namespaces</option>{NAMESPACES.map(item => <option key={item} value={item}>{item}</option>)}</select></FormField>
          <FormField label="Search"><div style={{ position: 'relative' }}><Search size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} /><input style={{ ...controlStyle, paddingRight: 36 }} value={filterSearch} onChange={e => setFilterSearch(e.target.value)} placeholder="Search label key..." /></div></FormField>
        </div>
        <DataTable
          columns={[
            { key: 'label_key', label: 'Key', render: r => <span style={{ fontWeight: 700 }}>{r.label_key}</span> },
            { key: 'label_value', label: 'Value' },
            { key: 'default_value', label: 'Default' },
            { key: 'locale', label: 'Locale' },
            { key: 'namespace', label: 'Namespace' },
            { key: 'industry', label: 'Industry', render: () => industryName(filterIndustry || industry) },
            { key: 'organization', label: 'Organization', render: () => orgName(filterOrg || organizationId) },
            { key: 'branch', label: 'Branch', render: () => branchName(filterBranch || branchId) },
            { key: 'actions', label: 'Actions', render: r => (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setMessage(`Selected label "${r.label_key}". Bulk import is managed from the Add Label section.`)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(61,191,150,.4)', background: 'rgba(61,191,150,.12)', color: 'var(--accent)' }}><Edit2 size={13} /></button>
                <button onClick={() => deleteLabel(r)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(239,68,68,.4)', background: 'rgba(239,68,68,.1)', color: 'var(--danger)' }}><Trash2 size={13} /></button>
              </div>
            ) },
          ]}
          rows={loading ? [] : visibleLabels}
          emptyMsg={loading ? 'Loading labels...' : 'No labels configured. Add a label or select an organization.'}
        />
        <div style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 12 }}>Showing {visibleLabels.length ? `1 to ${visibleLabels.length}` : '0'} of {visibleLabels.length} labels</div>
      </div>
    </div>
  );
}
