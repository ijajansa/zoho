import { ArrowUpRight, CalendarDays, Edit3, FolderPlus, Grid2X2, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import WorkspaceFormModal from '../components/WorkspaceFormModal';
import { useToast } from '../components/ToastProvider';
import { formatDate, initials } from '../utils/format';

export default function WorkspacesPage() {
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [query, setQuery] = useState('');
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [deletingNow, setDeletingNow] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [creating, setCreating] = useState(searchParams.get('create') === 'true');
    const notify = useToast();

    const load = async () => {
        setLoading(true);
        setLoadError('');
        try {
            const { data } = await api.get('/workspaces');
            setWorkspaces(data.data.workspaces);
        } catch (error) {
            setLoadError(errorMessage(error, 'Could not load your workspaces.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const visible = useMemo(() => workspaces.filter((workspace) => `${workspace.name} ${workspace.description || ''}`.toLowerCase().includes(query.toLowerCase())), [workspaces, query]);
    const closeCreate = () => { setCreating(false); setSearchParams({}, { replace: true }); };
    const saved = (workspace, wasEditing) => {
        setWorkspaces((items) => wasEditing ? items.map((item) => item.id === workspace.id ? workspace : item) : [workspace, ...items]);
        setEditing(null);
        closeCreate();
        notify(wasEditing ? 'Workspace updated successfully.' : 'Workspace created successfully.');
    };
    const remove = async () => {
        setDeletingNow(true);
        try {
            await api.delete(`/workspaces/${deleting.id}`);
            setWorkspaces((items) => items.filter((item) => item.id !== deleting.id));
            notify('Workspace deleted successfully.');
            setDeleting(null);
        } catch (error) {
            notify(errorMessage(error, 'Could not delete the workspace.'), 'error');
        } finally {
            setDeletingNow(false);
        }
    };

    return (
        <div>
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div><p className="text-sm font-semibold text-brand-700">Workspace library</p><h1 className="mt-1 text-3xl font-bold tracking-[-0.04em] text-slate-950">Your workspaces</h1><p className="mt-2 text-sm text-slate-500">Create and manage secure spaces for every team or project.</p></div>
                <button onClick={() => setCreating(true)} className="btn-primary"><Plus size={17} /> Create workspace</button>
            </div>
            <div className="mt-8 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
                <div className="relative flex-1 sm:max-w-sm"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} className="field border-0 bg-slate-50 py-2.5 pl-10 shadow-none focus:bg-white" placeholder="Search workspaces..." /></div>
                <div className="px-2 text-xs font-medium text-slate-400">{workspaces.length} {workspaces.length === 1 ? 'workspace' : 'workspaces'}</div>
            </div>
            {loading ? <div className="grid min-h-80 place-items-center"><Spinner className="size-7 text-brand-600" /></div> : loadError ? <ErrorState message={loadError} retry={load} /> : visible.length ? (
                <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {visible.map((workspace) => <WorkspaceCard key={workspace.id} workspace={workspace} onEdit={() => setEditing(workspace)} onDelete={() => setDeleting(workspace)} />)}
                </div>
            ) : query ? <NoResults /> : <EmptyState create={() => setCreating(true)} />}
            <WorkspaceFormModal open={creating} onClose={closeCreate} onSaved={saved} />
            <WorkspaceFormModal open={Boolean(editing)} workspace={editing} onClose={() => setEditing(null)} onSaved={saved} />
            <Modal open={Boolean(deleting)} onClose={deletingNow ? () => {} : () => setDeleting(null)} title="Delete workspace" description="This action cannot be undone.">
                <div className="p-6"><div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-800">You’re about to permanently delete <strong>{deleting?.name}</strong>. Applications are not enabled yet, but all workspace data will be removed.</div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button className="btn-secondary" onClick={() => setDeleting(null)} disabled={deletingNow}>Cancel</button><button className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60" onClick={remove} disabled={deletingNow}>{deletingNow ? <Spinner /> : <><Trash2 size={16} /> Delete workspace</>}</button></div></div>
            </Modal>
        </div>
    );
}

function WorkspaceCard({ workspace, onEdit, onDelete }) {
    return (
        <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50">
            <div className="flex items-start justify-between gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-sm font-bold text-brand-700 ring-1 ring-brand-100">{initials(workspace.name)}</span><span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-700">{workspace.status}</span></div>
            <h2 className="mt-5 truncate text-lg font-bold tracking-tight text-slate-950">{workspace.name}</h2>
            <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{workspace.description || 'No description added yet.'}</p>
            <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400"><CalendarDays size={14} /> Created {formatDate(workspace.created_at)}</div>
            <div className="mt-4 flex items-center gap-2">
                <Link to={`/workspaces/${workspace.id}`} className="btn-secondary flex-1 px-3 py-2 text-xs">Open workspace <ArrowUpRight size={14} /></Link>
                <button onClick={onEdit} className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900" aria-label={`Edit ${workspace.name}`}><Edit3 size={15} /></button>
                <button onClick={onDelete} className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${workspace.name}`}><Trash2 size={15} /></button>
            </div>
        </article>
    );
}

function EmptyState({ create }) { return <div className="mt-6 grid min-h-96 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600"><FolderPlus size={27} /></span><h2 className="mt-5 text-xl font-bold text-slate-950">Create your first workspace</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Workspaces keep your apps, data, and team context organized in one secure place.</p><button onClick={create} className="btn-primary mt-6"><Plus size={17} /> Create workspace</button></div></div>; }
function NoResults() { return <div className="mt-6 grid min-h-72 place-items-center rounded-2xl border border-slate-200 bg-white text-center"><div><Grid2X2 className="mx-auto text-slate-300" size={30} /><p className="mt-3 font-semibold text-slate-700">No matching workspaces</p><p className="mt-1 text-sm text-slate-400">Try a different search term.</p></div></div>; }
function ErrorState({ message, retry }) { return <div className="mt-6 grid min-h-72 place-items-center rounded-2xl border border-red-100 bg-white text-center"><div><p className="font-semibold text-slate-800">Unable to load workspaces</p><p className="mt-1 text-sm text-red-600">{message}</p><button onClick={retry} className="btn-secondary mt-5">Try again</button></div></div>; }
