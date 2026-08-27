import { Copy, Trash2, X } from 'lucide-react';
import OptionsEditor from './OptionsEditor';

const ruleLabels = {
    min: 'Minimum value',
    max: 'Maximum value',
    min_length: 'Minimum length',
    max_length: 'Maximum length',
    decimal_places: 'Decimal places',
    rows: 'Textarea rows',
};

export default function FieldSettingsPanel({ field, definition, onChange, onDelete, onDuplicate, onClose }) {
    if (!field || !definition) {
        return <aside className="border-t border-slate-200 bg-slate-50/80 p-5 lg:border-l lg:border-t-0"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Field settings</p><div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm leading-6 text-slate-500">Select a field on the canvas to configure it.</div></aside>;
    }

    const update = (key, value) => onChange({ ...field, [key]: value });
    const updateRule = (key, value) => update('validation_rules', { ...field.validation_rules, [key]: value === '' ? null : Number(value) });

    return (
        <aside className="border-t border-slate-200 bg-slate-50/80 p-4 lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Field settings</p><p className="mt-1 text-xs text-slate-500">{definition.label}</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-700" aria-label="Close field settings"><X size={16} /></button></div>
            <div className="mt-4 space-y-4">
                <Setting label="Label"><input className="field py-2.5" value={field.label} onChange={(event) => update('label', event.target.value)} maxLength={120} /></Setting>
                {definition.supports_placeholder && <Setting label="Placeholder"><input className="field py-2.5" value={field.placeholder} onChange={(event) => update('placeholder', event.target.value)} maxLength={255} /></Setting>}
                <Setting label="Help text"><textarea className="field py-2.5" rows="2" value={field.help_text} onChange={(event) => update('help_text', event.target.value)} maxLength={500} /></Setting>
                {definition.supports_default && <Setting label="Default value"><input className="field py-2.5" value={field.default_value} onChange={(event) => update('default_value', event.target.value)} maxLength={500} /></Setting>}
                {definition.supports_options && <OptionsEditor options={field.options} onChange={(options) => update('options', options)} />}
                {definition.validation_rules.length > 0 && <div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Validation</p><div className="grid grid-cols-2 gap-2">{definition.validation_rules.map((rule) => <Setting key={rule} label={ruleLabels[rule]}><input className="field py-2.5" type="number" min={rule === 'rows' ? 2 : rule === 'decimal_places' ? 0 : undefined} max={rule === 'rows' ? 20 : rule === 'decimal_places' ? 8 : undefined} value={field.validation_rules?.[rule] ?? ''} onChange={(event) => updateRule(rule, event.target.value)} /></Setting>)}</div></div>}
                <div className="grid grid-cols-2 gap-2">
                    {definition.supports_required && <Toggle label="Required" checked={field.is_required} onChange={(value) => update('is_required', value)} />}
                    {definition.supports_unique && <Toggle label="Unique" checked={field.is_unique} onChange={(value) => update('is_unique', value)} />}
                    <Toggle label="Read only" checked={field.is_readonly} onChange={(value) => update('is_readonly', value)} />
                    <Toggle label="Hidden" checked={field.is_hidden} onChange={(value) => update('is_hidden', value)} />
                </div>
                <div className="grid grid-cols-2 gap-3"><Setting label="Width"><select className="field py-2.5" value={field.width} onChange={(event) => update('width', Number(event.target.value))}><option value="12">Full</option><option value="6">Half</option><option value="4">Third</option><option value="3">Quarter</option></select></Setting><Setting label="Status"><select className="field py-2.5" value={field.status} onChange={(event) => update('status', event.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></Setting></div>
                <div className="flex gap-2 border-t border-slate-200 pt-4"><button type="button" onClick={() => onDuplicate(field)} className="btn-secondary flex-1 px-3"><Copy size={14} /> Duplicate</button><button type="button" onClick={() => onDelete(field)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"><Trash2 size={14} /> Delete</button></div>
            </div>
        </aside>
    );
}

function Setting({ label, children }) { return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>{children}</label>; }
function Toggle({ label, checked, onChange }) { return <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 rounded accent-brand-600" /> {label}</label>; }
