import { Eye } from 'lucide-react';
import FieldPreview from './FieldPreview';

const widthClasses = { 12: 'md:col-span-12', 6: 'md:col-span-6', 4: 'md:col-span-4', 3: 'md:col-span-3' };

export default function FormPreview({ fields, moduleName }) {
    const visibleFields = fields.filter((field) => !field.is_hidden && field.status === 'active');
    return <div className="mx-auto max-w-4xl p-5 sm:p-8"><div className="mb-6 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Eye size={20} /></span><div><h2 className="text-xl font-bold text-slate-950">{moduleName} form</h2><p className="text-sm text-slate-500">Preview only - no record will be submitted.</p></div></div>{visibleFields.length ? <form onSubmit={(event) => event.preventDefault()} className="grid grid-cols-12 gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-5 sm:p-7">{visibleFields.map((field) => <div key={field._key} className={`col-span-12 ${widthClasses[field.width] || widthClasses[12]}`}><FieldPreview field={field} preview /></div>)}<div className="col-span-12 border-t border-slate-200 pt-5"><button type="submit" disabled className="btn-primary">Submit</button></div></form> : <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">Add an active, visible field to preview the form.</div>}</div>;
}
