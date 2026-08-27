import { useEffect, useState } from 'react';
import api, { errorMessage, validationErrors } from '../api/client';
import FormField from './FormField';
import Modal from './Modal';
import Spinner from './Spinner';

export default function WorkspaceFormModal({ open, onClose, workspace, onSaved }) {
    const [form, setForm] = useState({ name: '', description: '' });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setForm({ name: workspace?.name || '', description: workspace?.description || '' });
            setErrors({});
            setMessage('');
        }
    }, [open, workspace]);

    const submit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setErrors({});
        setMessage('');
        try {
            const response = workspace
                ? await api.put(`/workspaces/${workspace.id}`, form)
                : await api.post('/workspaces', form);
            onSaved(response.data.data.workspace, Boolean(workspace));
        } catch (error) {
            setErrors(validationErrors(error));
            setMessage(errorMessage(error, 'Could not save this workspace.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal open={open} onClose={submitting ? () => {} : onClose} title={workspace ? 'Edit workspace' : 'Create a workspace'} description={workspace ? 'Update your workspace details.' : 'Give your team a focused place to build and organize.'}>
            <form onSubmit={submit} className="space-y-5 p-6">
                {message && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}
                <FormField autoFocus label="Workspace name" name="name" placeholder="e.g. TrueLabel Technologies" value={form.name} error={errors.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                <FormField multiline rows="4" label="Description" hint="Optional" name="description" placeholder="What will your team build here?" value={form.description} error={errors.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
                {!workspace && <p className="-mt-2 text-xs leading-5 text-slate-400">A unique URL slug will be generated automatically from the workspace name.</p>}
                <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                    <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button type="submit" className="btn-primary min-w-36" disabled={submitting}>{submitting ? <Spinner /> : workspace ? 'Save changes' : 'Create workspace'}</button>
                </div>
            </form>
        </Modal>
    );
}
