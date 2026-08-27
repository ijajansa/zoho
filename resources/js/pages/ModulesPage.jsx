import { ArrowDown, ArrowUp, ArrowUpRight, CalendarDays, Edit3, FolderPlus, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { deleteModule, getModules, reorderModules } from '../api/modules';
import { errorMessage } from '../api/client';
import Modal from '../components/Modal';
import ModuleFormModal from '../components/ModuleFormModal';
import ModuleIcon from '../components/ModuleIcon';
import Spinner from '../components/Spinner';
import { useToast } from '../components/ToastProvider';
import { formatDate } from '../utils/format';

export default function ModulesPage() {
    const { application } = useOutletContext();
    const { workspaceId, applicationId } = useParams();
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [deletingNow, setDeletingNow] = useState(false);
    const [reordering, setReordering] = useState(false);
    const notify = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setModules(await getModules(workspaceId, applicationId));
        } catch (requestError) {
            setError(errorMessage(requestError, 'Could not load modules.'));
        } finally {
            setLoading(false);
        }
    }, [workspaceId, applicationId]);

    useEffect(() => { load(); }, [load]);

    const visible = useMemo(() => modules.filter((module) => `${module.name} ${module.description || ''}`.toLowerCase().includes(query.toLowerCase())), [modules, query]);
    const saved = (module, wasEditing) => {
        setModules((items) => wasEditing ? items.map((item) => item.id === module.id ? module : item) : [...items, module]);
        setCreating(false);
        setEditing(null);
        notify(wasEditing ? 'Module updated successfully.' : 'Module created successfully.');
    };

    const remove = async () => {
        setDeletingNow(true);
        try {
            await deleteModule(workspaceId, applicationId, deleting.id);
            setModules((items) => items.filter((item) => item.id !== deleting.id));
            setDeleting(null);
            notify('Module deleted successfully.');
        } catch (requestError) {
            notify(errorMessage(requestError, 'Could not delete this module.'), 'error');
        } finally {
            setDeletingNow(false);
        }
    };

    const move = async (index, direction) => {
        const target = index + direction;
        if (target < 0 || target >= modules.length || reordering) return;
        const previous = modules;
        const reordered = [...modules];
        [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
        setModules(reordered);
        setReordering(true);
        try {
            const payload = reordered.map((module, position) => ({ id: module.id, sort_order: position + 1 }));
            setModules(await reorderModules(workspaceId, applicationId, payload));
            notify('Module order updated.');
        } catch (requestError) {
            setModules(previous);
            notify(errorMessage(requestError, 'Could not reorder modules.'), 'error');
        } finally {
            setReordering(false);
        }
    };

    return (
        <div>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Table builder</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Modules</h2><p className="mt-2 text-sm text-slate-500">Create and manage the data structures inside {application.name}.</p></div><button onClick={() => setCreating(true)} className="btn-primary shrink-0"><Plus size={16} /> Create module</button></div>
            {!loading && !error && modules.length > 0 && <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5"><div className="relative min-w-0 flex-1 sm:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="search" className="field py-2 pl-9" placeholder="Search modules..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><span className="hidden text-xs text-slate-400 sm:block">{modules.length} module{modules.length === 1 ? '' : 's'}</span></div>}
            {loading ? <div className="grid min-h-72 place-items-center"><Spinner className="size-7 text-brand-600" /></div> : error ? <LoadError message={error} retry={load} /> : visible.length ? <div className="mt-6 space-y-3">{visible.map((module) => { const realIndex = modules.findIndex((item) => item.id === module.id); return <ModuleRow key={module.id} module={module} workspaceId={workspaceId} applicationId={applicationId} onEdit={() => setEditing(module)} onDelete={() => setDeleting(module)} onUp={() => move(realIndex, -1)} onDown={() => move(realIndex, 1)} first={realIndex === 0} last={realIndex === modules.length - 1} reordering={reordering || Boolean(query)} />; })}</div> : query ? <NoResults /> : <EmptyState create={() => setCreating(true)} />}
            <ModuleFormModal open={creating} workspaceId={workspaceId} applicationId={applicationId} onClose={() => setCreating(false)} onSaved={saved} />
            <ModuleFormModal open={Boolean(editing)} workspaceId={workspaceId} applicationId={applicationId} module={editing} onClose={() => setEditing(null)} onSaved={saved} />
            <Modal open={Boolean(deleting)} onClose={deletingNow ? () => {} : () => setDeleting(null)} title={`Delete ${deleting?.name || 'module'}?`} description="This module will be permanently deleted."><div className="p-6"><div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-800">This removes the module metadata. No physical data table exists in this phase.</div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button className="btn-secondary" onClick={() => setDeleting(null)} disabled={deletingNow}>Cancel</button><button className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60" onClick={remove} disabled={deletingNow}>{deletingNow ? <Spinner /> : <><Trash2 size={16} /> Delete module</>}</button></div></div></Modal>
        </div>
    );
}

function ModuleRow({ module, workspaceId, applicationId, onEdit, onDelete, onUp, onDown, first, last, reordering }) { return <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm sm:flex-row sm:items-center"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100"><ModuleIcon name={module.icon} /></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="truncate font-bold text-slate-900">{module.name}</h3><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${module.status === 'active' ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>{module.status}</span></div><p className="mt-1 truncate text-sm text-slate-500">{module.description || 'No description added.'}</p><p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400"><CalendarDays size={12} /> Created {formatDate(module.created_at)}</p></div><div className="flex items-center gap-2 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0"><div className="mr-auto flex gap-1 sm:mr-1"><button onClick={onUp} disabled={first || reordering} className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30" aria-label={`Move ${module.name} up`}><ArrowUp size={14} /></button><button onClick={onDown} disabled={last || reordering} className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30" aria-label={`Move ${module.name} down`}><ArrowDown size={14} /></button></div><Link to={`/workspaces/${workspaceId}/applications/${applicationId}/modules/${module.id}`} className="btn-secondary px-3 py-2 text-xs">Open <ArrowUpRight size={13} /></Link><button onClick={onEdit} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900" aria-label={`Edit ${module.name}`}><Edit3 size={15} /></button><button onClick={onDelete} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${module.name}`}><Trash2 size={15} /></button></div></article>; }
function EmptyState({ create }) { return <div className="mt-7 grid min-h-72 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-10 text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200"><FolderPlus size={27} /></span><h3 className="mt-5 text-lg font-bold text-slate-900">No modules yet</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Modules are the building blocks of your application. Create entities such as Customers, Products, Orders or Employees.</p><button onClick={create} className="btn-primary mt-6"><Plus size={16} /> Create your first module</button></div></div>; }
function LoadError({ message, retry }) { return <div className="grid min-h-64 place-items-center text-center"><div><p className="font-semibold text-slate-800">Unable to load modules</p><p className="mt-1 text-sm text-red-600">{message}</p><button onClick={retry} className="btn-secondary mt-5">Try again</button></div></div>; }
function NoResults() { return <div className="grid min-h-56 place-items-center text-center"><div><Search className="mx-auto text-slate-300" size={28} /><p className="mt-3 font-semibold text-slate-700">No matching modules</p><p className="mt-1 text-sm text-slate-400">Try another search term.</p></div></div>; }
