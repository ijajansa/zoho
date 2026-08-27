import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import FieldTypeIcon from './FieldTypeIcon';

export default function FieldPalette({ fieldTypes, onAdd }) {
    const [query, setQuery] = useState('');
    const filteredTypes = fieldTypes.filter((type) => `${type.label} ${type.type} ${type.category}`.toLowerCase().includes(query.trim().toLowerCase()));
    const categories = [...new Set(filteredTypes.map((type) => type.category))];

    return (
        <aside className="border-b border-slate-200 bg-slate-50/80 p-4 lg:border-b-0 lg:border-r">
            <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Field types</p><p className="mt-1 text-xs leading-5 text-slate-500">Drag onto the canvas or click to add.</p><label className="relative mt-3 block"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} className="field py-2 pl-9 text-xs" placeholder="Search fields..." /></label></div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                {categories.map((category) => <div key={category}><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{category}</p><div className="grid grid-cols-2 gap-2 lg:grid-cols-1">{filteredTypes.filter((type) => type.category === category).map((type) => <PaletteItem key={type.type} type={type} onAdd={onAdd} />)}</div></div>)}
                {filteredTypes.length === 0 && <p className="text-center text-xs text-slate-500">No field types match.</p>}
            </div>
        </aside>
    );
}

function PaletteItem({ type, onAdd }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `palette:${type.type}`, data: { source: 'palette', fieldType: type } });
    const style = { transform: CSS.Translate.toString(transform) };

    return <button ref={setNodeRef} style={style} type="button" onClick={() => onAdd(type)} {...listeners} {...attributes} className={`group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-left text-xs font-semibold text-slate-600 shadow-sm transition hover:border-brand-200 hover:text-brand-700 ${isDragging ? 'z-50 opacity-50 shadow-lg' : ''}`}><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-700"><FieldTypeIcon name={type.icon} size={15} /></span><span className="min-w-0 flex-1 truncate">{type.label}</span><GripVertical size={13} className="hidden text-slate-300 lg:block" /><Plus size={13} className="text-slate-300 lg:hidden" /></button>;
}
