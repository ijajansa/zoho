export default function FieldPreview({ field, preview = false }) {
    const common = { disabled: true, placeholder: field.placeholder || undefined, className: 'field bg-white disabled:cursor-default disabled:opacity-100' };

    return (
        <div className={field.is_hidden && !preview ? 'opacity-55' : ''}>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">{field.label || 'Untitled field'}{field.is_required && <span className="text-red-500">*</span>}{field.is_hidden && !preview && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-400">Hidden</span>}</label>
            {renderControl(field, common)}
            {field.help_text && <p className="mt-1.5 text-xs leading-5 text-slate-400">{field.help_text}</p>}
        </div>
    );
}

function renderControl(field, common) {
    if (field.field_type === 'textarea') return <textarea {...common} rows={Number(field.validation_rules?.rows || 4)} />;
    if (field.field_type === 'select') return <select {...common} defaultValue=""><option value="">{field.placeholder || 'Select an option'}</option>{field.options.map((option) => <option key={option.value || option.label} value={option.value}>{option.label}</option>)}</select>;
    if (field.field_type === 'radio') return <div className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-white p-3">{field.options.map((option) => <label key={option.value || option.label} className="flex items-center gap-2 text-sm text-slate-600"><input type="radio" disabled className="size-4 accent-brand-600" /> {option.label}</label>)}</div>;
    if (field.field_type === 'checkbox') return <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600"><input type="checkbox" disabled className="size-4 rounded accent-brand-600" /> {field.placeholder || field.label}</label>;
    if (field.field_type === 'toggle') return <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"><span className="h-6 w-11 rounded-full bg-slate-200 p-1"><span className="block size-4 rounded-full bg-white shadow-sm" /></span><span className="text-sm text-slate-600">{field.placeholder || field.label}</span></div>;

    const inputTypes = { email: 'email', phone: 'tel', password: 'password', date: 'date', time: 'time', datetime: 'datetime-local', url: 'url', number: 'number', decimal: 'number', currency: 'number', percentage: 'number' };
    const prefix = field.field_type === 'currency' ? '$' : null;
    const suffix = field.field_type === 'percentage' ? '%' : null;
    return <div className="relative">{prefix && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">{prefix}</span>}<input {...common} type={inputTypes[field.field_type] || 'text'} className={`${common.className} ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-8' : ''}`} />{suffix && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">{suffix}</span>}</div>;
}
