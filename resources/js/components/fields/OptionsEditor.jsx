import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

export default function OptionsEditor({ options, onChange }) {
    const update = (index, label) => onChange(options.map((option, position) => position === index ? { ...option, label } : option));
    const add = () => onChange([...options, { label: `Option ${options.length + 1}`, value: '' }]);
    const remove = (index) => onChange(options.filter((_, position) => position !== index));
    const move = (index, direction) => {
        const target = index + direction;
        if (target < 0 || target >= options.length) return;
        const result = [...options];
        [result[index], result[target]] = [result[target], result[index]];
        onChange(result);
    };

    return <div><div className="mb-2 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Options</p><button type="button" onClick={add} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700"><Plus size={13} /> Add option</button></div><div className="space-y-2">{options.map((option, index) => <div key={`${option.value || 'new'}_${index}`} className="flex items-center gap-1.5"><input className="field min-w-0 py-2 text-xs" value={option.label} onChange={(event) => update(index, event.target.value)} placeholder="Option label" /><button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="rounded-lg border border-slate-200 p-2 text-slate-400 disabled:opacity-30"><ArrowUp size={12} /></button><button type="button" onClick={() => move(index, 1)} disabled={index === options.length - 1} className="rounded-lg border border-slate-200 p-2 text-slate-400 disabled:opacity-30"><ArrowDown size={12} /></button><button type="button" onClick={() => remove(index)} disabled={options.length === 1} className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:text-red-600 disabled:opacity-30"><Trash2 size={12} /></button></div>)}</div></div>;
}
