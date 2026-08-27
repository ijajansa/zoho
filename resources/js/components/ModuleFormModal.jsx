import { Check, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createModule, updateModule } from '../api/modules';
import { errorMessage, validationErrors } from '../api/client';
import FormField from './FormField';
import Modal from './Modal';
import ModuleIcon, { MODULE_ICONS } from './ModuleIcon';
import Spinner from './Spinner';

const emptyForm = { name: '', description: '', icon: 'database', status: 'active' };
const suggestions = [
    { name: 'Customers', icon: 'users' },
    { name: 'Products', icon: 'package' },
    { name: 'Orders', icon: 'shopping-cart' },
    { name: 'Employees', icon: 'briefcase' },
    { name: 'Invoices', icon: 'receipt' },
    { name: 'Suppliers', icon: 'truck' },
    { name: 'Leads', icon: 'user' },
    { name: 'Tasks', icon: 'clipboard' },
];

export default function ModuleFormModal({ open, onClose, workspaceId, applicationId, module, onSaved }) {
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) return;
        setForm(module ? { name: module.name, description: module.description || '', icon: module.icon || 'database', status: module.status } : emptyForm);
        setErrors({});
        setMessage('');
    }, [open, module]);

    const submit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setErrors({});
        setMessage('');
        try {
            const saved = module
                ? await updateModule(workspaceId, applicationId, module.id, form)
                : await createModule(workspaceId, applicationId, form);
            onSaved(saved, Boolean(module));
        } catch (error) {
            setErrors(validationErrors(error));
            setMessage(errorMessage(error, 'Could not save this module.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal open={open} onClose={submitting ? () => {} : onClose} title={module ? 'Edit module' : 'Create module'} description={module ? 'Update this module’s display details.' : 'Define a business entity for your application.'} size="max-w-2xl">
            <form onSubmit={submit} className="max-h-[78vh] space-y-5 overflow-y-auto p-6">
                {message && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}
                {!module && <fieldset><legend className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><Sparkles size={15} className="text-brand-600" /> Popular modules</legend><div className="flex flex-wrap gap-2">{suggestions.map((suggestion) => <button key={suggestion.name} type="button" onClick={() => setForm({ ...form, name: suggestion.name, icon: suggestion.icon })} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"><ModuleIcon name={suggestion.icon} size={14} /> {suggestion.name}</button>)}</div></fieldset>}
                <FormField autoFocus label="Module name" name="name" placeholder="e.g. Products" value={form.name} error={errors.name} maxLength="100" onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                <FormField multiline rows="3" label="Description" hint="Optional" name="description" placeholder="What information will this module manage?" value={form.description} error={errors.description} maxLength="1000" onChange={(event) => setForm({ ...form, description: event.target.value })} />
                <fieldset><legend className="mb-3 text-sm font-semibold text-slate-700">Module icon</legend><div className="grid grid-cols-8 gap-2 sm:grid-cols-15">{MODULE_ICONS.map((option) => <button key={option.id} type="button" title={option.label} aria-label={option.label} aria-pressed={form.icon === option.id} onClick={() => setForm({ ...form, icon: option.id })} className={`relative grid aspect-square min-h-9 place-items-center rounded-xl border transition ${form.icon === option.id ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-100' : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}><ModuleIcon name={option.id} size={18} />{form.icon === option.id && <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-brand-600 text-white"><Check size={10} strokeWidth={3} /></span>}</button>)}</div>{errors.icon && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.icon[0]}</p>}</fieldset>
                <div><label htmlFor="module-status" className="mb-2 block text-sm font-semibold text-slate-700">Status</label><select id="module-status" className="field" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select>{errors.status && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.status[0]}</p>}</div>
                {!module && <p className="-mt-2 text-xs leading-5 text-slate-400">The module slug and internal table identifier will be generated securely and remain stable after creation.</p>}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button><button type="submit" className="btn-primary min-w-36" disabled={submitting}>{submitting ? <Spinner /> : module ? 'Save changes' : 'Create module'}</button></div>
            </form>
        </Modal>
    );
}
