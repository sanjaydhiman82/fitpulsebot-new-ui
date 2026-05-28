import React, { useCallback, useEffect, useState } from 'react';
import { Edit2, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '../api';
import { DataTable, FormField, inputStyle, OutlineBtn, PrimaryBtn, SectionHeader } from './PortalLayout';

const DEFAULT_LABELS: Record<string, string> = {
  'org.portal.title': 'Organization Portal',
  'org.dashboard.title': 'Admin Dashboard',
  'org.dashboard.subtitle': 'Overview of your organization performance',
  'org.menu.dashboard': 'Dashboard',
  'org.menu.branches': 'Branches',
  'org.menu.branding': 'Branding',
  'trainer.dashboard.title': 'Trainer Dashboard',
  'trainer.role_badge': 'TRAINER',
  'trainer.menu.dashboard': 'Dashboard',
  'trainer.menu.members': 'My Members',
  'trainer.menu.workouts': 'Workouts',
  'trainer.menu.diets': 'Diet Plans',
  'trainer.menu.plateau': 'Plateau AI',
  'trainer.menu.progress': 'Progress',
  'branch.dashboard.title': 'Branch Manager',
  'branch.role_badge': 'BRANCH MANAGER',
  'branch.menu.dashboard': 'Dashboard',
  'branch.menu.onboard': 'Onboard Member',
  'branch.menu.members': 'Members',
  'branch.menu.trainers': 'Trainers',
  'branch.menu.assignments': 'Assignments',
  'branch.menu.attendance': 'Attendance',
  'branch.menu.support': 'Support',
  'branch.menu.branding': 'Branding',
  'member.menu.programs': 'Programs',
  'member.menu.biomarkers': 'BioMarkers',
};

const LABEL_CATALOG = [
  { key: 'org.portal.title', defaultValue: 'Organization Portal', screen: 'Organization Portal', description: 'Left/top portal title for organization admin.' },
  { key: 'org.dashboard.title', defaultValue: 'Admin Dashboard', screen: 'Organization Dashboard', description: 'Main organization dashboard heading and subtitle label.' },
  { key: 'org.dashboard.subtitle', defaultValue: 'Overview of your organization performance', screen: 'Organization Dashboard', description: 'Organization dashboard supporting text.' },
  { key: 'org.menu.dashboard', defaultValue: 'Dashboard', screen: 'Organization Menu', description: 'Organization portal dashboard menu label.' },
  { key: 'org.menu.branches', defaultValue: 'Branches', screen: 'Organization Menu', description: 'Organization portal branches menu label.' },
  { key: 'org.menu.branding', defaultValue: 'Branding', screen: 'Organization Menu', description: 'Organization portal branding menu label.' },
  { key: 'trainer.dashboard.title', defaultValue: 'Trainer Dashboard', screen: 'Trainer Portal', description: 'Trainer portal title. Example: Doctor Dashboard.' },
  { key: 'trainer.role_badge', defaultValue: 'TRAINER', screen: 'Trainer Portal', description: 'Trainer role badge in the sidebar.' },
  { key: 'trainer.menu.dashboard', defaultValue: 'Dashboard', screen: 'Trainer Menu', description: 'Trainer dashboard menu label.' },
  { key: 'trainer.menu.members', defaultValue: 'My Members', screen: 'Trainer Menu', description: 'Trainer assigned members menu label. Example: My Patients.' },
  { key: 'trainer.menu.workouts', defaultValue: 'Workouts', screen: 'Trainer Menu', description: 'Trainer workouts menu label.' },
  { key: 'trainer.menu.diets', defaultValue: 'Diet Plans', screen: 'Trainer Menu', description: 'Trainer diet plans menu label.' },
  { key: 'trainer.menu.plateau', defaultValue: 'Plateau AI', screen: 'Trainer Menu', description: 'Trainer Plateau AI menu label.' },
  { key: 'trainer.menu.progress', defaultValue: 'Progress', screen: 'Trainer Menu', description: 'Trainer member progress menu label.' },
  { key: 'branch.dashboard.title', defaultValue: 'Branch Manager', screen: 'Branch Portal', description: 'Branch portal title/subtitle.' },
  { key: 'branch.role_badge', defaultValue: 'BRANCH MANAGER', screen: 'Branch Portal', description: 'Branch manager role badge.' },
  { key: 'branch.menu.dashboard', defaultValue: 'Dashboard', screen: 'Branch Menu', description: 'Branch dashboard menu label.' },
  { key: 'branch.menu.onboard', defaultValue: 'Onboard Member', screen: 'Branch Menu', description: 'Branch onboard member menu label.' },
  { key: 'branch.menu.members', defaultValue: 'Members', screen: 'Branch Menu', description: 'Branch members menu label.' },
  { key: 'branch.menu.trainers', defaultValue: 'Trainers', screen: 'Branch Menu', description: 'Branch trainers menu label.' },
  { key: 'branch.menu.assignments', defaultValue: 'Assignments', screen: 'Branch Menu', description: 'Branch trainer assignments menu label.' },
  { key: 'branch.menu.attendance', defaultValue: 'Attendance', screen: 'Branch Menu', description: 'Branch attendance menu label.' },
  { key: 'branch.menu.support', defaultValue: 'Support', screen: 'Branch Menu', description: 'Branch support menu label.' },
  { key: 'branch.menu.branding', defaultValue: 'Branding', screen: 'Branch Menu', description: 'Branch branding menu label.' },
  { key: 'member.menu.programs', defaultValue: 'Programs', screen: 'Member Portal', description: 'User portal Programs menu label.' },
  { key: 'member.menu.biomarkers', defaultValue: 'BioMarkers', screen: 'Member Portal', description: 'User portal BioMarkers menu label.' },
];

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

export default function AdminLabelManagement() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [locale, setLocale] = useState('en');
  const [namespace, setNamespace] = useState('common');
  const [labels, setLabels] = useState<any[]>([]);
  const [form, setForm] = useState({ labelKey: '', labelValue: '', defaultValue: '', description: '' });
  const [keySearch, setKeySearch] = useState('');
  const [importText, setImportText] = useState('');
  const [exportText, setExportText] = useState('');
  const [savedExports, setSavedExports] = useState<any[]>([]);
  const [exportName, setExportName] = useState('');
  const [selectedExportName, setSelectedExportName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [orgLoadError, setOrgLoadError] = useState('');

  useEffect(() => {
    setOrgLoadError('');
    api.superAdmin.listOrgs({ pageSize: 100 })
      .then(d => setOrgs(d.organizations || []))
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
    if (!organizationId) {
      setLabels([]);
      return;
    }
    setLoading(true);
    api.labels.manage({ organizationId, branchId: branchId || undefined, locale, namespace })
      .then(d => setLabels(d.labels || []))
      .catch((e: any) => setMessage(e.message || 'Failed to load labels.'))
      .finally(() => setLoading(false));
  }, [organizationId, branchId, locale, namespace]);

  useEffect(() => { load(); }, [load]);

  const loadSavedExports = useCallback(() => {
    api.labels.listSavedExports()
      .then(d => setSavedExports(d.exports || []))
      .catch(() => setSavedExports([]));
  }, []);

  useEffect(() => { loadSavedExports(); }, [loadSavedExports]);

  const save = async () => {
    if (!organizationId) { setMessage('Select an organization before saving labels.'); return; }
    if (!form.labelKey || !form.labelValue) { setMessage('Label key and value are required.'); return; }
    await api.labels.upsert({
      organizationId,
      branchId: branchId || undefined,
      locale,
      namespace,
      labelKey: form.labelKey,
      labelValue: form.labelValue,
      defaultValue: form.defaultValue || undefined,
      description: form.description || undefined,
      isActive: true,
    });
    setForm({ labelKey: '', labelValue: '', defaultValue: '', description: '' });
    setMessage('Label saved.');
    load();
  };

  const selectCatalogKey = (key: string) => {
    const item = LABEL_CATALOG.find(x => x.key === key);
    setForm(p => ({
      ...p,
      labelKey: key,
      labelValue: item?.defaultValue || p.labelValue,
      defaultValue: item?.defaultValue || p.defaultValue,
      description: item?.description || p.description,
    }));
    setKeySearch(key);
  };

  const seedDefaults = async () => {
    if (!organizationId) { setMessage('Select an organization before loading defaults.'); return; }
    await api.labels.importJson({
      organizationId,
      branchId: branchId || undefined,
      locale,
      namespace,
      labels: DEFAULT_LABELS,
      defaults: DEFAULT_LABELS,
    });
    setMessage('Default editable labels loaded.');
    load();
  };

  const exportJson = async () => {
    if (!organizationId) { setMessage('Select an organization before exporting labels.'); return; }
    const data = await api.labels.exportJson({ organizationId, branchId: branchId || undefined, locale, namespace });
    setExportText(JSON.stringify(data, null, 2));
  };

  const getExportPayload = async () => {
    if (exportText.trim()) return JSON.parse(exportText);
    if (!organizationId) throw new Error('Select an organization before saving an export.');
    const data = await api.labels.exportJson({ organizationId, branchId: branchId || undefined, locale, namespace });
    setExportText(JSON.stringify(data, null, 2));
    return data;
  };

  const saveExport = async () => {
    if (!exportName.trim()) { setMessage('Enter a name for the saved JSON export.'); return; }
    try {
      const payload = await getExportPayload();
      await api.labels.saveExport({ name: exportName.trim(), payload });
      setMessage(`Saved label JSON as "${exportName.trim()}".`);
      setSelectedExportName(exportName.trim());
      loadSavedExports();
    } catch (e: any) {
      setMessage(e.message || 'Unable to save label JSON.');
    }
  };

  const loadSavedExportJson = async () => {
    if (!selectedExportName) { setMessage('Select a saved JSON export first.'); return; }
    try {
      const data = await api.labels.getSavedExport(selectedExportName);
      const payload = data.payload || {};
      const text = JSON.stringify(payload, null, 2);
      setImportText(text);
      setExportText(text);
      setExportName(data.name || selectedExportName);
      setMessage(`Loaded saved JSON "${data.name || selectedExportName}".`);
    } catch (e: any) {
      setMessage(e.message || 'Unable to load saved label JSON.');
    }
  };

  const importSavedExport = async () => {
    if (!organizationId) { setMessage('Select an organization before importing saved JSON.'); return; }
    if (!selectedExportName) { setMessage('Select a saved JSON export first.'); return; }
    try {
      const data = await api.labels.getSavedExport(selectedExportName);
      const payload = data.payload || {};
      await api.labels.importJson({
        organizationId,
        branchId: branchId || undefined,
        locale,
        namespace: namespace || (payload.namespace && payload.namespace !== 'all' ? payload.namespace : 'common'),
        labels: payload.labels || {},
        defaults: payload.defaults || {},
      });
      setMessage(`Imported saved JSON "${data.name || selectedExportName}" into the selected organization.`);
      load();
    } catch (e: any) {
      setMessage(e.message || 'Unable to import saved label JSON.');
    }
  };

  const deleteSavedExport = async () => {
    if (!selectedExportName) { setMessage('Select a saved JSON export first.'); return; }
    if (!window.confirm(`Delete saved label JSON "${selectedExportName}"?`)) return;
    try {
      await api.labels.deleteSavedExport(selectedExportName);
      setMessage(`Deleted saved JSON "${selectedExportName}".`);
      setSelectedExportName('');
      loadSavedExports();
    } catch (e: any) {
      setMessage(e.message || 'Unable to delete saved label JSON.');
    }
  };

  const deleteLabel = async (row: any) => {
    if (!row?.id) { setMessage('Unable to delete label without an id.'); return; }
    if (!window.confirm(`Delete label "${row.label_key}"?`)) return;
    try {
      await api.labels.delete(row.id);
      setMessage(`Deleted label "${row.label_key}".`);
      if (form.labelKey === row.label_key) {
        setForm({ labelKey: '', labelValue: '', defaultValue: '', description: '' });
      }
      load();
    } catch (e: any) {
      setMessage(e.message || 'Unable to delete label.');
    }
  };

  const importJson = async () => {
    if (!organizationId) { setMessage('Select an organization before importing labels.'); return; }
    try {
      const parsed = JSON.parse(importText);
      await api.labels.importJson({
        organizationId: parsed.organizationId || organizationId,
        branchId: parsed.branchId || branchId || undefined,
        locale: parsed.locale || locale,
        namespace: parsed.namespace && parsed.namespace !== 'all' ? parsed.namespace : namespace,
        labels: parsed.labels || {},
        defaults: parsed.defaults || {},
      });
      setMessage('Labels imported.');
      setImportText('');
      load();
    } catch (e: any) {
      setMessage(e.message || 'Invalid JSON import.');
    }
  };

  const savedKeys = new Set(labels.map(row => row.label_key));
  const filteredCatalog = LABEL_CATALOG.filter(item => {
    if (savedKeys.has(item.key)) return false;
    const q = keySearch.trim().toLowerCase();
    if (!q) return true;
    return [item.key, item.defaultValue, item.screen, item.description].some(v => v.toLowerCase().includes(q));
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 22 }}>Labels & Language</h2>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>Only platform admin users can manage labels. Labels are saved separately for each organization, with optional branch overrides.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
        <FormField label="Organization Scope">
          <select style={inputStyle} value={organizationId} onChange={e => setOrganizationId(e.target.value)}>
            <option value="">Select organization...</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          {orgLoadError && <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 6 }}>{orgLoadError}</div>}
        </FormField>
        <FormField label="Branch Scope">
          <select style={inputStyle} value={branchId} onChange={e => setBranchId(e.target.value)} disabled={!organizationId}>
            <option value="">Organization/global branch</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </FormField>
        <FormField label="Locale">
          <select style={inputStyle} value={locale} onChange={e => setLocale(e.target.value || 'en')}>
            {LOCALES.map(l => <option key={l.code} value={l.code}>{l.label} ({l.code})</option>)}
          </select>
        </FormField>
        <FormField label="Namespace">
          <input style={inputStyle} value={namespace} onChange={e => setNamespace(e.target.value || 'common')} />
        </FormField>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <OutlineBtn onClick={load}><RefreshCw size={13} /> Refresh</OutlineBtn>
        <PrimaryBtn onClick={seedDefaults}>Load Defaults</PrimaryBtn>
      </div>

      {!organizationId && <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, color: 'var(--text-secondary)', fontSize: 13 }}>Select an organization to view, edit, import, or export its labels.</div>}

      {message && <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, color: 'var(--text-secondary)', fontSize: 13 }}>{message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Add / Edit Label" />
          <div style={{ display: 'grid', gap: 12 }}>
            <FormField label="Label Key" required>
              <input
                style={inputStyle}
                list="label-key-catalog"
                value={form.labelKey}
                onChange={e => {
                  const next = e.target.value;
                  setForm(p => ({ ...p, labelKey: next }));
                  setKeySearch(next);
                  if (LABEL_CATALOG.some(item => item.key === next)) selectCatalogKey(next);
                }}
                placeholder="Search or select label key..."
              />
              <datalist id="label-key-catalog">
                {LABEL_CATALOG.map(item => <option key={item.key} value={item.key}>{item.screen} - {item.defaultValue}</option>)}
              </datalist>
            </FormField>
            <FormField label="Label Value" required><input style={inputStyle} value={form.labelValue} onChange={e => setForm(p => ({ ...p, labelValue: e.target.value }))} placeholder="Doctor Dashboard" /></FormField>
            <FormField label="Default Value"><input style={inputStyle} value={form.defaultValue} onChange={e => setForm(p => ({ ...p, defaultValue: e.target.value }))} /></FormField>
            <FormField label="Description"><input style={inputStyle} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></FormField>
            <PrimaryBtn onClick={save}>Save Label</PrimaryBtn>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Available Label Keys" />
          <input
            style={{ ...inputStyle, marginBottom: 10 }}
            value={keySearch}
            onChange={e => setKeySearch(e.target.value)}
            placeholder="Filter by screen, key, or label..."
          />
          <div style={{ maxHeight: 282, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
            {filteredCatalog.map(item => (
              <button
                key={item.key}
                onClick={() => selectCatalogKey(item.key)}
                style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 130px', gap: 10, padding: '9px 10px', border: 0, borderBottom: '1px solid var(--border)', background: form.labelKey === item.key ? 'var(--accent-light)' : 'transparent', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer' }}
              >
                <span>
                  <strong style={{ fontSize: 12 }}>{item.key}</strong>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.defaultValue} · {item.description}</div>
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', alignSelf: 'center' }}>{item.screen}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <SectionHeader title="JSON Import / Export" />
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,1fr) auto auto', gap: 10, marginBottom: 10 }}>
            <input style={inputStyle} value={exportName} onChange={e => setExportName(e.target.value)} placeholder="Export name, e.g. Dco-labels" />
            <OutlineBtn onClick={exportJson}>Export JSON</OutlineBtn>
            <PrimaryBtn onClick={saveExport}>Save Export</PrimaryBtn>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,1fr) auto auto auto', gap: 10, marginBottom: 10 }}>
            <select style={inputStyle} value={selectedExportName} onChange={e => setSelectedExportName(e.target.value)}>
              <option value="">Select saved JSON export...</option>
              {savedExports.map(item => <option key={item.id || item.name} value={item.name}>{item.name}</option>)}
            </select>
            <OutlineBtn onClick={loadSavedExportJson}>Load JSON</OutlineBtn>
            <PrimaryBtn onClick={importSavedExport}>Import Saved</PrimaryBtn>
            <OutlineBtn onClick={deleteSavedExport}><Trash2 size={13} /> Delete</OutlineBtn>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <PrimaryBtn onClick={importJson}>Import Pasted JSON</PrimaryBtn>
          </div>
          <textarea style={{ ...inputStyle, minHeight: 110, resize: 'vertical', marginBottom: 10 }} value={importText} onChange={e => setImportText(e.target.value)} placeholder='Paste JSON with {"labels":{"key":"value"}}' />
          <textarea style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }} value={exportText} onChange={e => setExportText(e.target.value)} placeholder="Exported JSON appears here" />
      </div>

      <DataTable
        columns={[
          { key: 'label_key', label: 'Key', render: r => <span style={{ fontWeight: 700 }}>{r.label_key}</span> },
          { key: 'label_value', label: 'Value' },
          { key: 'default_value', label: 'Default' },
          { key: 'locale', label: 'Locale' },
          { key: 'namespace', label: 'Namespace' },
          { key: 'actions', label: '', render: r => (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <OutlineBtn onClick={() => setForm({ labelKey: r.label_key, labelValue: r.label_value, defaultValue: r.default_value || '', description: r.description || '' })}><Edit2 size={12} /> Edit</OutlineBtn>
              <OutlineBtn onClick={() => deleteLabel(r)}><Trash2 size={12} /> Delete</OutlineBtn>
            </div>
          ) },
        ]}
        rows={loading ? [] : labels}
        emptyMsg={loading ? 'Loading labels...' : 'No labels configured. Load defaults or add a label.'}
      />
    </div>
  );
}
