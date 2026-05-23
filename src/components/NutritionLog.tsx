import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, RefreshCw, PenLine, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Label } from 'recharts';
import { api } from '../api';
import DateFilter, { dateWithCurrentTime, displayDate, formatLocalDate } from './DateFilter';
import ImageUploadLogger from './ImageUploadLogger';
import styles from './LogPage.module.css';
import dropdowns from '../config/dropdowns.json';

type Mode = 'manual' | 'ai';
const MEALS = dropdowns.nutrition.meals;
const macroColors = dropdowns.charts.pieColors.slice(0, 3);
const mealEmoji: Record<string, string> = dropdowns.nutrition.mealEmojis;

function normaliseMeal(raw: string): string { return (raw || '').toLowerCase(); }

export default function NutritionLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [date, setDate] = useState(formatLocalDate(new Date()));
  const [form, setForm] = useState({ mealType: 'Breakfast', foodName: '', quantity: '1', servingUnit: 'g', servingSize: '100', calories: '', proteinG: '0', carbsG: '0', fatG: '0', fiberG: '0', sugarG: '0', sodiumMg: '0', cholesterolMg: '0' });
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<Mode>('manual');
  const [aiMealType, setAiMealType] = useState('Breakfast');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avg7DayMacros, setAvg7DayMacros] = useState<{ protein: number; carbs: number; fat: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setLogs((await api.food.list(date)) || []); }
    catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [date]);

  const loadAverage = useCallback(async () => {
    try {
      const res = await api.food.getAverage(7);
      console.log('Food average API response:', res);
      const protein = res?.averageProteinG ?? res?.protein ?? res?.avgProteinG ?? res?.avgProtein ?? null;
      const carbs = res?.averageCarbsG ?? res?.carbs ?? res?.avgCarbsG ?? res?.avgCarbs ?? null;
      const fat = res?.averageFatG ?? res?.fat ?? res?.avgFatG ?? res?.avgFat ?? null;
      if (protein !== null && carbs !== null && fat !== null) {
        setAvg7DayMacros({ protein, carbs, fat });
      } else {
        setAvg7DayMacros(null);
      }
    } catch (e) { console.error('Failed to load food average:', e); setAvg7DayMacros(null); }
  }, []);

  useEffect(() => { load(); loadAverage(); }, [load, loadAverage]);

  const totals = logs.reduce((a, f) => ({ cal: a.cal + (f.calories ?? 0), p: a.p + (f.proteinG ?? 0), c: a.c + (f.carbsG ?? 0), f: a.f + (f.fatG ?? 0) }), { cal: 0, p: 0, c: 0, f: 0 });
  const macroData = [{ name: 'Protein', value: Math.round(totals.p) }, { name: 'Carbs', value: Math.round(totals.c) }, { name: 'Fats', value: Math.round(totals.f) }].filter(d => d.value > 0);
  const avg7DayMacroData = avg7DayMacros ? [{ name: 'Protein', value: Math.round(avg7DayMacros.protein) }, { name: 'Carbs', value: Math.round(avg7DayMacros.carbs) }, { name: 'Fats', value: Math.round(avg7DayMacros.fat) }].filter(d => d.value > 0) : [];

  const addLog = async () => {
    if (!form.foodName || !form.calories) return;
    setSaving(true); setError('');
    try {
      const res = await api.food.create({ mealType: form.mealType.toLowerCase(), foodName: form.foodName, quantity: parseFloat(form.quantity)||1, servingUnit: form.servingUnit, servingSize: parseFloat(form.servingSize)||100, calories: parseFloat(form.calories)||0, proteinG: parseFloat(form.proteinG)||0, carbsG: parseFloat(form.carbsG)||0, fatG: parseFloat(form.fatG)||0, fiberG: parseFloat(form.fiberG)||0, sugarG: parseFloat(form.sugarG)||0, sodiumMg: parseFloat(form.sodiumMg)||0, cholesterolMg: parseFloat(form.cholesterolMg)||0, logDatetime: dateWithCurrentTime(date) });
      setLogs(prev => [res, ...prev]);
      setForm({ mealType: 'Breakfast', foodName: '', quantity: '1', servingUnit: 'g', servingSize: '100', calories: '', proteinG: '0', carbsG: '0', fatG: '0', fiberG: '0', sugarG: '0', sodiumMg: '0', cholesterolMg: '0' });
      setShowForm(false);
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  };

  const deleteLog = async (id: string) => {
    try { await api.food.delete(id); setLogs(prev => prev.filter(l => l.id !== id)); }
    catch (e: any) { setError(e.message); }
  };

  const onAiSuccess = (data: any) => { setLogs(prev => [data, ...prev]); setShowForm(false); };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h2 className={styles.pageTitle}>Nutrition Log</h2><p className={styles.pageDesc}>Track meals &amp; macronutrients</p></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className={styles.refreshBtn} onClick={() => { load(); loadAverage(); }} title="Refresh"><RefreshCw size={14} className={loading ? styles.spinning : ''} /></button>
          <button className={styles.addBtn} onClick={() => setShowForm(v => !v)}><Plus size={16} /> Log Meal</button>
        </div>
      </div>

      <DateFilter date={date} onChange={setDate} />
      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.summaryRow}>
        <SumCard label="Calories" value={Math.round(totals.cal)} unit="kcal" goal={2200} color="#3dbf96" />
        <SumCard label="Protein"  value={Math.round(totals.p)}   unit="g"    goal={120}  color="#5bc8e0" />
        <SumCard label="Carbs"    value={Math.round(totals.c)}   unit="g"    goal={260}  color="#ed8936" />
        <SumCard label="Fats"     value={Math.round(totals.f)}   unit="g"    goal={70}   color="#9f7aea" />
      </div>

      <div className={styles.chartsRow2}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}><span className={styles.chartTitle}>Macro Distribution</span><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{logs.length} items</span></div>
          {macroData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={macroData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={4} dataKey="value" labelLine={false} label={({ value, percent }) => `${value}g (${((percent ?? 0) * 100).toFixed(0)}%)`}>
                  {macroData.map((_, i) => <Cell key={i} fill={macroColors[i % macroColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-primary)' }} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No macro data yet</div>
          )}
        </div>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}><span className={styles.chartTitle}>7-Day Avg Macros</span></div>
          {avg7DayMacroData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={avg7DayMacroData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={4} dataKey="value" labelLine={false} label={({ value, percent }) => `${value}g (${((percent ?? 0) * 100).toFixed(0)}%)`}>
                  {avg7DayMacroData.map((_, i) => <Cell key={i} fill={macroColors[i % macroColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-primary)' }} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No 7-day average data</div>
          )}
        </div>

        {showForm && (
          <div className={styles.formCard}>
            <ModeToggle mode={mode} onChange={setMode} />

            {mode === 'manual' ? (
              <>
                <div className={styles.formGrid} style={{ marginTop: 16 }}>
                  <div className={`${styles.field} ${styles.fieldFull}`}><label>Food Name</label><input placeholder="e.g. Dal Tadka, Roti, Oatmeal" value={form.foodName} onChange={e => setForm({ ...form, foodName: e.target.value })} /></div>
                  <div className={styles.field}><label>Meal Type</label><select value={form.mealType} onChange={e => setForm({ ...form, mealType: e.target.value })}>{MEALS.map(m => <option key={m}>{m}</option>)}</select></div>
                  <div className={styles.field}><label>Calories (kcal)</label><input type="number" placeholder="400" value={form.calories} onChange={e => setForm({ ...form, calories: e.target.value })} /></div>
                  <div className={styles.field}><label>Protein (g)</label><input type="number" placeholder="20" value={form.proteinG} onChange={e => setForm({ ...form, proteinG: e.target.value })} /></div>
                  <div className={styles.field}><label>Carbs (g)</label><input type="number" placeholder="50" value={form.carbsG} onChange={e => setForm({ ...form, carbsG: e.target.value })} /></div>
                  <div className={styles.field}><label>Fats (g)</label><input type="number" placeholder="12" value={form.fatG} onChange={e => setForm({ ...form, fatG: e.target.value })} /></div>
                  <div className={styles.field}><label>Fiber (g)</label><input type="number" placeholder="3" value={form.fiberG} onChange={e => setForm({ ...form, fiberG: e.target.value })} /></div>
                  <div className={styles.field}><label>Quantity</label><input type="number" placeholder="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div>
                </div>
                <div className={styles.formActions}>
                  <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                  <button className={styles.saveBtn} onClick={addLog} disabled={saving || !form.foodName || !form.calories}>{saving ? 'Saving...' : 'Save'}</button>
                </div>
              </>
            ) : (
              <div style={{ marginTop: 16 }}>
                {/* Meal type selector for AI mode */}
                <div className={styles.field} style={{ marginBottom: 14 }}>
                  <label>Meal Type</label>
                  <select value={aiMealType} onChange={e => setAiMealType(e.target.value)} style={{ marginTop: 4 }}>
                    {MEALS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <ImageUploadLogger
                  endpoint="food-intake"
                  extraFields={{ mealType: aiMealType.toLowerCase() }}
                  hint="Photo of your meal, plate or food packaging"
                  onSuccess={onAiSuccess}
                  onError={setError}
                />
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                  <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {loading && <div className={styles.loadingRow}>Loading meals...</div>}
      <div className={styles.mealGroups}>
        {MEALS.map(meal => {
          const items = logs.filter(l => normaliseMeal(l.mealType) === meal.toLowerCase());
          if (!items.length) return null;
          const mealCals = items.reduce((a, f) => a + (f.calories ?? 0), 0);
          return (
            <div key={meal} className={styles.mealGroup}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingLeft: 4 }}>
                <div className={styles.mealGroupTitle}>{mealEmoji[meal.toLowerCase()] || '🍽️'} {meal}</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{Math.round(mealCals)} kcal</span>
              </div>
              {items.map((f, i) => (
                <div key={f.id || i} className={styles.logItem}>
                  <div className={styles.logIcon} style={{ fontSize: 18 }}>{mealEmoji[meal.toLowerCase()] || '🍽️'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={styles.logName}>{f.foodName}</div>
                    <div className={styles.logMeta}>{[f.proteinG != null && `P:${Math.round(f.proteinG)}g`, f.carbsG != null && `C:${Math.round(f.carbsG)}g`, f.fatG != null && `F:${Math.round(f.fatG)}g`].filter(Boolean).join(' · ') || 'No macro data'}{f.quantity && f.servingUnit ? ` · ${f.quantity} ${f.servingUnit}` : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className={styles.logCal} style={{ color: 'var(--accent)' }}>{f.calories != null ? `${Math.round(f.calories)} kcal` : '— kcal'}</div>
                    <div className={styles.logTime}>{f.logDatetime ? new Date(f.logDatetime).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                  </div>
                  <button className={styles.deleteBtn} onClick={() => deleteLog(f.id)}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          );
        })}
        {!loading && logs.length === 0 && <div className={styles.emptyRow}>No meals logged for {displayDate(date)}. Tap "Log Meal" to start!</div>}
      </div>
    </div>
  );
}

function SumCard({ label, value, unit, goal, color }: any) {
  const pct = goal > 0 ? Math.min(Math.round((value / goal) * 100), 100) : 0;
  return (
    <div className={styles.sumCard}>
      <div className={styles.sumLabel}>{label}</div>
      <div className={styles.sumValue} style={{ color }}>{value}<span className={styles.sumUnit}>{unit}</span></div>
      <div className={styles.sumTrack}><div className={styles.sumFill} style={{ width: `${pct}%`, background: color }} /></div>
      <div className={styles.sumGoal}>{pct}% of {goal}{unit}</div>
    </div>
  );
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
      <button onClick={() => onChange('manual')} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'9px 0', borderRadius:'var(--radius-md)', fontSize:13, fontWeight:700, border:mode==='manual'?'2px solid var(--accent)':'2px solid var(--border)', background:mode==='manual'?'var(--accent-light)':'transparent', color:mode==='manual'?'var(--accent)':'var(--text-secondary)', transition:'all 0.2s' }}>
        <PenLine size={14} /> Manual
      </button>
      <button onClick={() => onChange('ai')} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'9px 0', borderRadius:'var(--radius-md)', fontSize:13, fontWeight:700, border:mode==='ai'?'2px solid #818cf8':'2px solid var(--border)', background:mode==='ai'?'rgba(99,102,241,.1)':'transparent', color:mode==='ai'?'#818cf8':'var(--text-secondary)', transition:'all 0.2s' }}>
        <Sparkles size={14} /> AI Vision
      </button>
    </div>
  );
}
