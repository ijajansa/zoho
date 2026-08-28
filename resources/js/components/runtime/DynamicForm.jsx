import { useEffect, useState } from 'react';
import Spinner from '../Spinner';
import DynamicFieldRenderer from './DynamicFieldRenderer';

const widthClasses = { 3: 'md:col-span-3', 4: 'md:col-span-4', 6: 'md:col-span-6', 12: 'md:col-span-12' };

export default function DynamicForm({ fields, initialValues = {}, onSubmit, onCancel, submitting, errors = {}, submitLabel }) {
    const [values, setValues] = useState(() => defaults(fields, initialValues));
    useEffect(() => setValues(defaults(fields, initialValues)), [fields, initialValues]);
    const change = (name, value) => setValues((current) => ({ ...current, [name]: value }));
    const submit = (event) => { event.preventDefault(); if (!submitting) onSubmit(values); };
    return <form onSubmit={submit} noValidate><div className="grid grid-cols-1 gap-5 md:grid-cols-12">{fields.map((field) => <div key={field.id} className={widthClasses[field.width] || 'md:col-span-12'}><DynamicFieldRenderer field={field} value={values[field.name]} onChange={change} error={errors[field.name]} /></div>)}</div><div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end"><button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button><button type="submit" className="btn-primary min-w-36" disabled={submitting}>{submitting ? <><Spinner /> Saving...</> : submitLabel}</button></div></form>;
}

function defaults(fields, initialValues) {
    return fields.reduce((result, field) => {
        let value = initialValues[field.name];
        if (value === undefined || value === null) value = field.field_type === 'password' ? '' : field.default_value ?? (['checkbox', 'toggle'].includes(field.field_type) ? false : '');
        if (['checkbox', 'toggle'].includes(field.field_type)) value = value === true || value === 1 || value === '1' || value === 'true';
        result[field.name] = value;
        return result;
    }, {});
}
