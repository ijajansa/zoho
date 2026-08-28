export default function RuntimeValue({ field, value, compact = false }) {
    if (value === null || value === undefined || value === '') return <span className="text-slate-300">—</span>;
    if (['checkbox', 'toggle'].includes(field.field_type)) return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${value ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>{value ? 'Yes' : 'No'}</span>;
    if (['select', 'radio'].includes(field.field_type)) {
        const label = field.options.find((option) => option.value === value)?.label || value;
        return <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{label}</span>;
    }
    if (field.field_type === 'currency') return <span>{field.settings?.currency_symbol || ''}{formatNumber(value)}</span>;
    if (field.field_type === 'percentage') return <span>{formatNumber(value)}%</span>;
    if (['decimal', 'number'].includes(field.field_type)) return <span>{formatNumber(value)}</span>;
    if (field.field_type === 'date') return <span>{formatDate(value, false)}</span>;
    if (field.field_type === 'datetime') return <span>{formatDate(value, true)}</span>;
    if (field.field_type === 'email') return <a href={`mailto:${value}`} className="text-brand-700 hover:underline">{value}</a>;
    if (field.field_type === 'url' && /^https?:\/\//i.test(value)) return <a href={value} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">{value}</a>;
    return <span className={compact && field.field_type === 'textarea' ? 'block max-w-xs truncate' : 'whitespace-pre-wrap'}>{value}</span>;
}

function formatNumber(value) { const number = Number(value); return Number.isFinite(number) ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 }).format(number) : value; }
function formatDate(value, time) { const date = new Date(time ? String(value).replace(' ', 'T') : `${value}T00:00:00`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, time ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(date); }
