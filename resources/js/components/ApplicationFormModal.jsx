import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createApplication, updateApplication } from '../api/applications';
import { errorMessage, validationErrors } from '../api/client';
import ApplicationIcon, { APPLICATION_ICONS } from './ApplicationIcon';
import FormField from './FormField';
import Modal from './Modal';
import Spinner from './Spinner';

const emptyForm = { name: '', description: '', icon: 'app', status: 'active' };

export default function ApplicationFormModal({ open, onClose, workspaceId, application, onSaved }) {
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) return;
        setForm(application ? {
            name: application.name,
            description: application.description || '',
            icon: application.icon || 'app',
            status: application.status,
        } : emptyForm);
        setErrors({});
        setMessage('');
    }, [open, application]);

    const submit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setErrors({});
        setMessage('');

        try {
            const saved = application
                ? await updateApplication(workspaceId, application.id, form)
                : await createApplication(workspaceId, form);
            onSaved(saved, Boolean(application));
        } catch (error) {
            setErrors(validationErrors(error));
            setMessage(errorMessage(error, 'Could not save this application.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal open={open} onClose={submitting ? () => {} : onClose} title={application ? 'Edit application' : 'Create application'} description={application ? 'Update application details without changing its stable slug.' : 'Start a new custom business tool in this workspace.'} size="max-w-xl">
            <form onSubmit={submit} className="max-h-[calc(100vh-10rem)] space-y-5 overflow-y-auto p-6">
                {message && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}
                <FormField autoFocus label="Application name" name="name" placeholder="e.g. Inventory Management" value={form.name} error={errors.name} maxLength="100" onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                <FormField multiline rows="3" label="Description" hint="Optional" name="description" placeholder="What will this application help your team manage?" value={form.description} error={errors.description} maxLength="1000" onChange={(event) => setForm({ ...form, description: event.target.value })} />
                <fieldset>
                    <legend className="mb-3 text-sm font-semibold text-slate-700">Application icon</legend>
                    <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
                        {APPLICATION_ICONS.map((option) => (
                            <button key={option.id} type="button" title={option.label} aria-label={option.label} aria-pressed={form.icon === option.id} onClick={() => setForm({ ...form, icon: option.id })} className={`relative grid aspect-square place-items-center rounded-xl border transition ${form.icon === option.id ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-100' : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}>
                                <ApplicationIcon name={option.id} size={19} />
                                {form.icon === option.id && <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-brand-600 text-white"><Check size={10} strokeWidth={3} /></span>}
                            </button>
                        ))}
                    </div>
                    {errors.icon && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.icon[0]}</p>}
                </fieldset>
                {application && <div><label htmlFor="application-status" className="mb-2 block text-sm font-semibold text-slate-700">Status</label><select id="application-status" className="field" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select>{errors.status && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.status[0]}</p>}</div>}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                    <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button type="submit" className="btn-primary min-w-40" disabled={submitting}>{submitting ? <Spinner /> : application ? 'Save changes' : 'Create application'}</button>
                </div>
            </form>
        </Modal>
    );
}
