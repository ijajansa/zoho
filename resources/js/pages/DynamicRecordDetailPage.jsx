import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { deleteRecord, getRecord } from '../api/runtime';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { useToast } from '../components/ToastProvider';
import RuntimeBreadcrumbs from '../components/runtime/RuntimeBreadcrumbs';
import RuntimeValue from '../components/runtime/RuntimeValue';

export default function DynamicRecordDetailPage() {
    const { application, metadata, refreshRuntime } = useOutletContext();
    const { moduleId, recordId } = useParams();
    const module = metadata.module;
    const [record, setRecord] = useState(null);
    const [error, setError] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const navigate = useNavigate(); const notify = useToast();
    useEffect(() => { getRecord(application.workspace_id, application.id, moduleId, recordId).then(setRecord).catch((requestError) => setError(requestError.response?.data?.message || 'Could not load this record.')); }, [application.workspace_id, application.id, moduleId, recordId]);
    if (!record && !error) return <div className="grid min-h-[55vh] place-items-center"><Spinner className="size-7 text-brand-600" /></div>;
    if (error) return <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">{error}</div>;
    const title = record[module.display_field] || `${module.singular_name} #${record.id}`;
    const remove = async () => { setDeleting(true); try { await deleteRecord(application.workspace_id, application.id, moduleId, record.id); await refreshRuntime(); notify(`${module.singular_name} deleted successfully.`); navigate(`/apps/${application.id}/modules/${module.id}`); } catch (requestError) { notify(requestError.response?.data?.message || 'Could not delete this record.', 'error'); setDeleting(false); } };
    return <div><RuntimeBreadcrumbs application={application} module={module} recordTitle={title} /><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-brand-700">{module.singular_name} details</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{title}</h1></div><div className="flex gap-2"><Link to={`/apps/${application.id}/modules/${module.id}`} className="btn-secondary"><ArrowLeft size={16} /> Back</Link><Link to={`/apps/${application.id}/modules/${module.id}/${record.id}/edit`} className="btn-primary"><Pencil size={15} /> Edit</Link><button className="rounded-xl border border-red-200 bg-white px-3 text-red-600 hover:bg-red-50" onClick={() => setConfirming(true)} aria-label="Delete record"><Trash2 size={16} /></button></div></div>
        <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><dl className="grid sm:grid-cols-2">{metadata.fields.filter((field) => field.field_type !== 'password').map((field) => <div key={field.id} className="border-b border-slate-100 p-5 sm:odd:border-r"><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{field.label}</dt><dd className="mt-2 text-sm leading-6 text-slate-800"><RuntimeValue field={field} value={record[field.name]} /></dd></div>)}<div className="border-b border-slate-100 p-5 sm:odd:border-r"><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Created</dt><dd className="mt-2 text-sm text-slate-700">{new Date(record.created_at).toLocaleString()}</dd></div><div className="border-b border-slate-100 p-5"><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Last updated</dt><dd className="mt-2 text-sm text-slate-700">{new Date(record.updated_at).toLocaleString()}</dd></div></dl></section>
        <Modal open={confirming} onClose={deleting ? () => {} : () => setConfirming(false)} title={`Delete this ${module.singular_name}?`} description="This record will be permanently deleted."><div className="p-6"><p className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">Delete <strong>{title}</strong>? This action cannot be undone.</p><div className="mt-6 flex justify-end gap-3"><button className="btn-secondary" onClick={() => setConfirming(false)} disabled={deleting}>Cancel</button><button className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" onClick={remove} disabled={deleting}>{deleting ? <Spinner /> : <Trash2 size={16} />} Delete</button></div></div></Modal>
    </div>;
}
