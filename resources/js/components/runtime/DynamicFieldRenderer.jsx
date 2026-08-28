const inputClasses = 'field disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

export default function DynamicFieldRenderer({ field, value, onChange, error }) {
    const common = { id: `runtime-${field.name}`, name: field.name, disabled: field.is_readonly, 'aria-invalid': Boolean(error) };
    const set = (next) => onChange(field.name, next);
    let control;

    if (field.field_type === 'textarea') {
        control = <textarea {...common} className={inputClasses} rows={field.settings?.rows || 4} placeholder={field.placeholder || ''} value={value ?? ''} onChange={(event) => set(event.target.value)} />;
    } else if (field.field_type === 'select') {
        control = <select {...common} className={inputClasses} value={value ?? ''} onChange={(event) => set(event.target.value)}><option value="">{field.placeholder || `Select ${field.label}`}</option>{field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
    } else if (field.field_type === 'radio') {
        control = <div className="flex flex-wrap gap-3">{field.options.map((option) => <label key={option.value} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"><input type="radio" name={field.name} value={option.value} disabled={field.is_readonly} checked={value === option.value} onChange={() => set(option.value)} className="accent-brand-600" />{option.label}</label>)}</div>;
    } else if (['checkbox', 'toggle'].includes(field.field_type)) {
        control = <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4"><input {...common} type="checkbox" checked={Boolean(value)} onChange={(event) => set(event.target.checked)} className="size-4 accent-brand-600" /><span className="text-sm text-slate-600">{value ? 'Yes' : 'No'}</span></label>;
    } else {
        const types = { number: 'number', decimal: 'number', currency: 'number', percentage: 'number', email: 'email', phone: 'tel', password: 'password', date: 'date', time: 'time', datetime: 'datetime-local', url: 'url' };
        const step = ['decimal', 'currency', 'percentage'].includes(field.field_type) ? 'any' : undefined;
        control = <input {...common} className={inputClasses} type={types[field.field_type] || 'text'} step={step} placeholder={field.placeholder || ''} value={inputValue(field, value)} onChange={(event) => set(event.target.value)} autoComplete={field.field_type === 'password' ? 'new-password' : undefined} />;
    }

    return <div><label htmlFor={`runtime-${field.name}`} className="mb-1.5 block text-sm font-semibold text-slate-700">{field.label}{field.is_required && !field.is_readonly && <span className="ml-1 text-red-500">*</span>}</label>{control}{field.help_text && <p className="mt-1.5 text-xs leading-5 text-slate-400">{field.help_text}</p>}{error && <p className="mt-1.5 text-xs font-medium text-red-600">{Array.isArray(error) ? error[0] : error}</p>}</div>;
}

function inputValue(field, value) {
    if (value === null || value === undefined) return '';
    if (field.field_type === 'datetime') return String(value).replace(' ', 'T').slice(0, 16);
    return value;
}
