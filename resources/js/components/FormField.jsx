export default function FormField({ label, error, hint, className = '', ...props }) {
    const id = props.id || props.name;
    const Component = props.multiline ? 'textarea' : 'input';
    const inputProps = { ...props };
    delete inputProps.multiline;

    return (
        <div className={className}>
            <div className="mb-2 flex items-center justify-between">
                <label htmlFor={id} className="text-sm font-semibold text-slate-700">{label}</label>
                {hint && <span className="text-xs text-slate-400">{hint}</span>}
            </div>
            <Component
                {...inputProps}
                id={id}
                aria-invalid={Boolean(error)}
                className={`field ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''} ${props.multiline ? 'min-h-28 resize-y' : ''}`}
            />
            {error && <p className="mt-1.5 text-xs font-medium text-red-600">{Array.isArray(error) ? error[0] : error}</p>}
        </div>
    );
}
