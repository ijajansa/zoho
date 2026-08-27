import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, GripVertical, Trash2 } from 'lucide-react';
import FieldPreview from './FieldPreview';

const widthClasses = { 12: 'md:col-span-12', 6: 'md:col-span-6', 4: 'md:col-span-4', 3: 'md:col-span-3' };

export default function SortableField({ field, selected, onSelect, onDuplicate, onDelete }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field._key, data: { source: 'canvas' } });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} onClick={() => onSelect(field._key)} className={`group relative col-span-12 rounded-2xl border bg-white p-4 transition ${widthClasses[field.width] || widthClasses[12]} ${selected ? 'border-brand-500 ring-4 ring-brand-100/70' : 'border-slate-200 hover:border-slate-300'} ${isDragging ? 'z-30 opacity-60 shadow-xl' : ''}`}>
            <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><button type="button" onClick={(event) => { event.stopPropagation(); onDuplicate(field); }} className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 shadow-sm hover:text-brand-700" aria-label={`Duplicate ${field.label}`}><Copy size={13} /></button><button type="button" onClick={(event) => { event.stopPropagation(); onDelete(field); }} className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 shadow-sm hover:text-red-600" aria-label={`Delete ${field.label}`}><Trash2 size={13} /></button><button type="button" {...attributes} {...listeners} className="touch-none rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 shadow-sm hover:text-slate-700" aria-label={`Drag ${field.label}`}><GripVertical size={13} /></button></div>
            <FieldPreview field={field} />
        </div>
    );
}
