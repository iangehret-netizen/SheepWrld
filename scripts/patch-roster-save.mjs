import fs from 'node:fs';
const path = 'sheepwrld';
let s = fs.readFileSync(path, 'utf8');

const helper = `\nconst storageGet = async (key) => { try { const value = window.localStorage.getItem(key); return value === null ? null : { value }; } catch { return null; } };\nconst storageSet = async (key, value) => { try { window.localStorage.setItem(key, value); return { key, value }; } catch { throw new Error('localStorage unavailable'); } };\n`;
if (!s.includes('const storageGet = async')) {
  const marker = 'function uid() { return Math.random().toString(36).slice(2, 10); }';
  s = s.replace(marker, marker + helper);
}
s = s.replace(/window\.storage\.get\(/g, 'storageGet(').replace(/window\.storage\.set\(/g, 'storageSet(');
s = s.replace(/!window\.storage/g, '!window.localStorage');
s = s.replace('name: "", club4h: "", age:', 'name: "", age:');
s = s.replace('{ Field: "Exhibitor", Value: exhibitor.name }, { Field: "4-H Club", Value: exhibitor.club4h },', '{ Field: "Exhibitor", Value: exhibitor.name },');
s = s.replace('<p>{exhibitor.name} · {exhibitor.club4h} · Age {exhibitor.age} · {exhibitor.county} County</p>', '<p>{exhibitor.name} · Age {exhibitor.age} · {exhibitor.county} County</p>');

const start = s.indexOf('function RosterTab(');
const end = s.indexOf('// ---- Weights Tab ----', start);
if (start < 0 || end < 0) throw new Error('RosterTab boundaries not found');
const replacement = String.raw`function RosterTab({ exhibitor, updateExhibitor, saveExhibitor, sheep, addSheep, updateSheep, removeSheep, editingSheepId, setEditingSheepId }) {
  const [view, setView] = useState('list');
  const [editingExId, setEditingExId] = useState(null);
  const [draft, setDraft] = useState(exhibitor || EMPTY_EXHIBITOR());
  const [savedFlash, setSavedFlash] = useState(false);
  const [exhibitors, setExhibitors] = useState(() => { try { const raw = window.localStorage.getItem('sheepwrld:exhibitors:list'); const a = raw ? JSON.parse(raw) : []; return Array.isArray(a) ? a : []; } catch { return []; } });
  const visibleCols = [["name", "Name"], ["sex", "Sex"], ["showman", "Showman"]];
  const allCols = [
    ["name", "Name", "text"], ["sex", "Sex", "select"], ["lEar", "L Ear", "text"], ["rEar", "R Ear", "text"],
    ["birthdate", "Birthdate", "date"], ["breed", "Breed", "select"], ["sire", "Sire", "text"], ["dam", "Dam", "text"],
    ["breeder", "Breeder", "text"], ["price", "Price", "text"], ["showman", "Showman", "select"], ["county", "County", "text"], ["notes", "Additional Notes", "text"],
  ];
  const sexOptions = ["Wether", "Ewe Lamb", "Ram"];
  const breedOptions = ["", "BFX", "WFX", "Hampshire", "Shropshire", "Southdown", "Oxford", "Dorset", "Natural", "AOB"];
  const showmanOptions = ["", ...exhibitors.map(e => e.name).filter(Boolean)];
  useEffect(() => {
    if (exhibitor?.name && !exhibitors.some(e => e.name === exhibitor.name)) {
      const e = { ...exhibitor, id: exhibitor.id || uid() }; const next = [...exhibitors, e]; setExhibitors(next);
      try { window.localStorage.setItem('sheepwrld:exhibitors:list', JSON.stringify(next)); } catch {}
    }
  }, [exhibitor?.name]);
  const startAdd = () => { const e = { ...EMPTY_EXHIBITOR(), id: uid() }; setDraft(e); setEditingExId(e.id); setView('form'); };
  const startEdit = (e = exhibitor) => { const d = { ...e }; setDraft(d); setEditingExId(d.id || 'current'); setView('form'); };
  const cancelEx = () => { setDraft(exhibitor || EMPTY_EXHIBITOR()); setEditingExId(null); setView('list'); };
  const saveEx = () => {
    const name = String(draft.name || '').trim(); if (!name) return;
    const next = { ...draft, id: draft.id || uid(), name };
    const list = exhibitors.some(e => e.id === next.id) ? exhibitors.map(e => e.id === next.id ? next : e) : [...exhibitors, next];
    setExhibitors(list); try { window.localStorage.setItem('sheepwrld:exhibitors:list', JSON.stringify(list)); } catch {}
    updateExhibitor(next); setDraft(next); setEditingExId(null); setSavedFlash(true); setView('list'); setTimeout(() => setSavedFlash(false), 1500);
  };

  if (view === 'form') return <div className="space-y-6 pb-16">
    <Card>
      <div className="flex items-center justify-between mb-4"><SectionLabel>Exhibitor</SectionLabel><GoldButton variant="outline" onClick={cancelEx}>Back to Roster</GoldButton></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="Name"><TextInput value={draft.name || ""} onChange={e => setDraft({ ...draft, name: e.target.value })} /></Field>
        <Field label="Age"><TextInput value={draft.age || ""} onChange={e => setDraft({ ...draft, age: e.target.value })} /></Field>
        <Field label="County"><TextInput value={draft.county || ""} onChange={e => setDraft({ ...draft, county: e.target.value })} /></Field>
        <Field label="# of Sheep"><TextInput value={draft.numSheep || ""} onChange={e => setDraft({ ...draft, numSheep: e.target.value })} /></Field>
        <Field label="Target Show"><TextInput value={draft.targetShow || ""} onChange={e => setDraft({ ...draft, targetShow: e.target.value })} /></Field>
        <Field label="Target Show Date"><TextInput type="date" value={draft.targetShowDate || ""} onChange={e => setDraft({ ...draft, targetShowDate: e.target.value })} /></Field>
        <Field label="OSF?"><button onClick={() => setDraft({ ...draft, osf: !draft.osf })} className="w-full px-2.5 py-1.5 text-sm text-left" style={{ border: '1px solid #DDD8CC', borderRadius: '2px', background: draft.osf ? goldLight : '#FFFFFF' }}>{draft.osf ? 'Yes' : 'No'}</button></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4"><GoldButton variant="outline" onClick={cancelEx}>Cancel</GoldButton><GoldButton onClick={saveEx}><Save size={13}/> Save Exhibitor</GoldButton></div>
    </Card>
  </div>;

  return <div className="space-y-6 pb-16">
    <Card>
      <div className="flex items-center justify-between mb-4"><SectionLabel>Exhibitor Roster ({exhibitors.length})</SectionLabel><GoldButton onClick={startAdd}><Plus size={13}/> Add Exhibitor</GoldButton></div>
      {exhibitors.length ? <div className="space-y-2">{exhibitors.map(e => <div key={e.id} className="p-3 flex items-center justify-between gap-3" style={{ background: cream, borderRadius: '2px' }}>
        <div><div className="text-sm" style={{ color: black, fontWeight: 600 }}>{e.name}</div><div className="text-xs text-neutral-500 mt-0.5">Age {e.age || '—'} · {e.county || '—'} County · {e.numSheep || 0} sheep</div>{e.targetShow && <div className="text-xs text-neutral-400 mt-0.5">Target: {e.targetShow}</div>}</div>
        <button onClick={() => startEdit(e)} className="text-xs px-2 py-1" style={{ color: gold, border: '1px solid ' + goldLight, borderRadius: '2px' }}><Pencil size={12}/></button>
      </div>)}</div> : <div className="text-sm text-neutral-400 text-center py-8">No exhibitors saved yet.</div>}
      {savedFlash && <div className="text-xs mt-3" style={{ color: '#4A6C4A' }}>Exhibitor saved.</div>}
    </Card>

    <Card>
      <div className="flex items-center justify-between mb-4"><SectionLabel>Sheep Roster ({sheep.length})</SectionLabel><GoldButton onClick={addSheep}><Plus size={13}/> Add Sheep</GoldButton></div>
      {sheep.length === 0 ? <div className="text-sm text-neutral-400 text-center py-10">No sheep added yet for this year.</div> : <div className="overflow-x-auto"><table className="w-full text-sm border-collapse"><thead><tr style={{ borderBottom: '1px solid ' + goldLight }}>{visibleCols.map(([key,label]) => <th key={key} className="text-left px-2 py-2 text-[10px] uppercase tracking-wider text-neutral-400 whitespace-nowrap">{label}</th>)}<th className="text-left px-2 py-2 text-[10px] uppercase tracking-wider text-neutral-400">In Barn</th><th></th></tr></thead><tbody>{sheep.map(s => { const editing = editingSheepId === s.id; return <React.Fragment key={s.id}>
        <tr style={{ borderBottom: editing ? 'none' : '1px solid #EEE9DC', background: editing ? '#FBF6E9' : 'transparent' }}>{visibleCols.map(([key]) => <td key={key} className="px-2 py-2 whitespace-nowrap"><span style={{ color: key === 'name' ? black : '#555', fontWeight: key === 'name' ? 600 : 400 }}>{s[key] || '—'}</span></td>)}<td className="px-2 py-2"><button onClick={() => updateSheep(s.id, { inBarn: !s.inBarn })} className="text-xs px-2 py-0.5" style={{ border: '1px solid ' + (s.inBarn ? gold : '#DDD8CC'), borderRadius: '2px', color: s.inBarn ? gold : '#999' }}>{s.inBarn ? 'Active' : 'Out'}</button></td><td className="px-2 py-2"><div className="flex gap-1"><button onClick={() => setEditingSheepId(editing ? null : s.id)} className="text-xs px-2 py-0.5 flex items-center gap-1" style={{ color: editing ? '#4A6C4A' : gold, border: '1px solid ' + (editing ? '#4A6C4A' : goldLight), borderRadius: '2px' }}>{editing ? <><Save size={12}/> Save Sheep</> : <><Pencil size={12}/> Edit</>}</button><button onClick={() => removeSheep(s.id)} className="text-xs px-1.5 py-0.5 text-red-400"><Trash2 size={13}/></button></div></td></tr>
        {editing && <tr style={{ borderBottom: '1px solid #EEE9DC', background: '#FBF6E9' }}><td colSpan={visibleCols.length + 2} className="px-2 pb-4 pt-1"><div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3" style={{ background: '#FFFFFF', border: '1px solid ' + goldLight, borderRadius: '2px' }}>{allCols.map(([key,label,type]) => <Field label={label} key={key}>{key === 'sex' ? <Select value={s.sex || 'Wether'} onChange={e => updateSheep(s.id, { sex: e.target.value })} options={sexOptions}/> : key === 'breed' ? <Select value={s.breed || ''} onChange={e => updateSheep(s.id, { breed: e.target.value })} options={breedOptions}/> : key === 'showman' ? <Select value={s.showman || ''} onChange={e => updateSheep(s.id, { showman: e.target.value })} options={showmanOptions}/> : <TextInput type={type} value={s[key] || ''} onChange={e => updateSheep(s.id, { [key]: e.target.value })}/>}</Field>)}</div></td></tr>}
      </React.Fragment>})}</tbody></table></div>}
    </Card>
  </div>;
}

`;
s = s.slice(0, start) + replacement + s.slice(end);
fs.writeFileSync(path, s);
console.log('Patched roster save/list UI and browser persistence');
