import { AlertTriangle, CheckCircle2, Clock3, Database, LoaderCircle, RefreshCw, UploadCloud } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '../../api/client';
import { getModuleSchema, getModuleSchemaHistory, publishModuleSchema } from '../../api/schema';
import { useToast } from '../ToastProvider';

const labels = { draft: 'Draft', published: 'Published', out_of_sync: 'Changes Pending', syncing: 'Syncing', error: 'Error' };
const badgeClasses = { draft: 'bg-slate-100 text-slate-600', published: 'bg-brand-50 text-brand-700', out_of_sync: 'bg-amber-50 text-amber-700', syncing: 'bg-blue-50 text-blue-700', error: 'bg-red-50 text-red-700' };

export default function SchemaPanel({ workspaceId, applicationId, moduleId, compact = false, dirty = false, refreshKey = 0, onPublished, onPublishingChange, onStatusChange }) {
    const [schema, setSchema] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [publishing, setPublishing] = useState(false);
    const [error, setError] = useState('');
    const notify = useToast();

    const load = useCallback(async () => {
        try {
            const [status, historyData] = await Promise.all([
                getModuleSchema(workspaceId, applicationId, moduleId),
                compact ? Promise.resolve({ changes: [] }) : getModuleSchemaHistory(workspaceId, applicationId, moduleId),
            ]);
            setSchema(status);
            onStatusChange?.(status);
            setHistory(historyData.changes);
            setError(status.last_error || '');
        } catch (requestError) {
            setError(errorMessage(requestError, 'Could not load schema status.'));
        } finally { setLoading(false); }
    }, [workspaceId, applicationId, moduleId, compact, onStatusChange]);

    useEffect(() => { setLoading(true); load(); }, [load, refreshKey]);

    const publish = async () => {
        if (dirty || !schema) return;
        const summary = schema.changes.length
            ? schema.changes.map(changeLabel).join('\n')
            : 'No physical changes are currently detected.';
        if (!window.confirm(`Publish this module schema?\n\n${summary}\n\nThis will create or safely update the physical database structure.`)) return;

        setPublishing(true);
        onPublishingChange?.(true);
        try {
            const result = await publishModuleSchema(workspaceId, applicationId, moduleId);
            notify(`Schema published successfully. Version ${result.schema_version}.`);
            await load();
            onPublished?.(result);
        } catch (requestError) {
            const message = errorMessage(requestError, 'Schema synchronization failed.');
            setError(message);
            notify(message, 'error');
            await load();
        } finally {
            setPublishing(false);
            onPublishingChange?.(false);
        }
    };

    if (loading) return <div className={compact ? 'flex items-center gap-2 text-xs text-slate-400' : 'mt-7 grid min-h-32 place-items-center rounded-2xl border border-slate-200'}><LoaderCircle size={16} className="animate-spin" /> Loading schema</div>;
    if (!schema) return <p className="text-sm text-red-600">{error}</p>;

    const upToDate = schema.schema_status === 'published' && schema.pending_changes === 0;
    const buttonLabel = publishing || schema.schema_status === 'syncing' ? 'Publishing...' : schema.schema_status === 'draft' ? 'Publish Schema' : schema.schema_status === 'error' ? 'Retry Sync' : schema.schema_status === 'out_of_sync' || schema.pending_changes > 0 ? 'Sync Schema' : 'Schema Up to Date';
    const disabled = dirty || publishing || schema.schema_status === 'syncing' || upToDate;

    if (compact) return <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${badgeClasses[schema.schema_status]}`}>{labels[schema.schema_status]}</span><span className="text-xs text-slate-400">v{schema.schema_version}</span><button type="button" onClick={publish} disabled={disabled} title={dirty ? 'Save your form changes before publishing the schema.' : undefined} className="btn-secondary px-3 py-2 text-xs">{publishing ? <LoaderCircle size={14} className="animate-spin" /> : <UploadCloud size={14} />} {buttonLabel}</button>{dirty && <span className="w-full text-[11px] text-amber-600">Save form changes before publishing.</span>}</div>;

    return <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div className="flex items-start gap-3"><span className="grid size-11 place-items-center rounded-xl bg-slate-950 text-white"><Database size={19} /></span><div><div className="flex items-center gap-2"><h3 className="font-bold text-slate-900">Physical schema</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${badgeClasses[schema.schema_status]}`}>{labels[schema.schema_status]}</span></div><p className="mt-1 text-sm text-slate-500">Version {schema.schema_version} · {schema.physical_table_exists ? 'Physical table exists' : 'Not published yet'}</p></div></div><button type="button" onClick={publish} disabled={disabled} className="btn-primary shrink-0">{publishing ? <LoaderCircle size={15} className="animate-spin" /> : upToDate ? <CheckCircle2 size={15} /> : <UploadCloud size={15} />} {buttonLabel}</button></div>
        {dirty && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">Save your form changes before publishing the schema.</p>}
        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {schema.changes.length > 0 && <div className="mt-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending changes</p><div className="mt-2 space-y-2">{schema.changes.map((change, index) => <div key={`${change.type}-${change.field || index}`} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600"><RefreshCw size={14} className="text-brand-600" /> {changeLabel(change)}</div>)}</div></div>}
        <div className="mt-6 border-t border-slate-200 pt-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Schema history</p>{history.length ? <div className="mt-3 space-y-3">{history.map((change) => <div key={change.id} className="flex gap-3"><span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${change.status === 'completed' ? 'bg-brand-50 text-brand-700' : change.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>{change.status === 'completed' ? <CheckCircle2 size={14} /> : change.status === 'failed' ? <AlertTriangle size={14} /> : <Clock3 size={14} />}</span><div><p className="text-sm font-semibold text-slate-700">Version {change.schema_version} · {historyLabel(change)}</p><p className="mt-0.5 text-xs text-slate-400">{new Date(change.created_at).toLocaleString()}</p></div></div>)}</div> : <p className="mt-3 text-sm text-slate-500">No schema has been published yet.</p>}</div>
    </section>;
}

function changeLabel(change) {
    if (change.type === 'create_table') return `Create table with ${change.fields?.length || 0} fields`;
    if (change.type === 'add_column') return `+ Add ${change.field}`;
    if (change.type === 'modify_column') return `~ Update ${change.field}`;
    return `Keep archived column ${change.field}`;
}

function historyLabel(change) {
    if (change.change_type === 'create_table') return 'Created physical table';
    if (change.change_type === 'add_column') return `Added ${change.field || 'column'}`;
    if (change.change_type === 'modify_column') return `Updated ${change.field || 'column'}`;
    if (change.change_type === 'drop_column' && change.status === 'blocked') return `Archived ${change.field || 'field'}; physical column retained`;
    return change.change_type.replaceAll('_', ' ');
}
