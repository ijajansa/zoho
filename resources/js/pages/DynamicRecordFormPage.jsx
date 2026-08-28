import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { createRecord, getRecord, updateRecord } from '../api/runtime';
import { validationErrors } from '../api/client';
import DynamicForm from '../components/runtime/DynamicForm';
import RuntimeBreadcrumbs from '../components/runtime/RuntimeBreadcrumbs';
import Spinner from '../components/Spinner';
import { useToast } from '../components/ToastProvider';

export default function DynamicRecordFormPage() {
    const { application, metadata } = useOutletContext();
    const { moduleId, recordId } = useParams();
    const navigate = useNavigate();
    const notify = useToast();
    const module = metadata.module;
    const editing = Boolean(recordId);
    const [record, setRecord] = useState(editing ? null : {});
    const [loadingError, setLoadingError] = useState('');
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [saving, setSaving] = useState(false);
    useEffect(() => { if (editing) getRecord(application.workspace_id, application.id, moduleId, recordId).then(setRecord).catch((error) => setLoadingError(error.response?.data?.message || 'Could not load this record.')); }, [editing, application.workspace_id, application.id, moduleId, recordId]);
    const title = editing ? `Edit ${module.singular_name}` : `Add ${module.singular_name}`;
    const recordTitle = editing && record ? record[module.display_field] || `${module.singular_name} #${record.id}` : null;
    const submit = async (values) => { setSaving(true); setErrors({}); setGeneralError(''); try { const saved = editing ? await updateRecord(application.workspace_id, application.id, moduleId, recordId, values) : await createRecord(application.workspace_id, application.id, moduleId, values); notify(`${module.singular_name} ${editing ? 'updated' : 'created'} successfully.`); navigate(`/apps/${application.id}/modules/${module.id}/${saved.id}`); } catch (error) { const fieldErrors = validationErrors(error); setErrors(fieldErrors); setGeneralError(error.response?.data?.message || 'Please correct the highlighted fields.'); } finally { setSaving(false); } };
    if (!record && !loadingError) return <div className="grid min-h-[55vh] place-items-center"><Spinner className="size-7 text-brand-600" /></div>;
    if (loadingError) return <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">{loadingError}</div>;
    return <div><RuntimeBreadcrumbs application={application} module={module} recordTitle={recordTitle} tail={editing ? 'Edit' : undefined} /><div className="mb-7"><p className="text-xs font-bold uppercase tracking-[.14em] text-brand-700">{editing ? 'Update record' : 'New record'}</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{title}</h1><p className="mt-2 text-sm text-slate-500">Fields and validation are generated from your published module schema.</p></div><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">{generalError && <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{generalError}</div>}<DynamicForm fields={metadata.fields} initialValues={record} onSubmit={submit} onCancel={() => navigate(editing ? `/apps/${application.id}/modules/${module.id}/${recordId}` : `/apps/${application.id}/modules/${module.id}`)} submitting={saving} errors={errors} submitLabel={`${editing ? 'Save' : 'Create'} ${module.singular_name}`} /></section></div>;
}
