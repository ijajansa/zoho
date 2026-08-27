import { ArrowLeft, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, CircleUserRound, Copy, Edit3, FolderPlus, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { deleteApplication, getApplications } from '../api/applications';
import api, { errorMessage } from '../api/client';
import ApplicationFormModal from '../components/ApplicationFormModal';
import ApplicationIcon from '../components/ApplicationIcon';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { useToast } from '../components/ToastProvider';
import { formatDate, initials } from '../utils/format';

export default function WorkspaceDetailPage() {
    const { id } = useParams();
    const [workspace, setWorkspace] = useState(null);
    const [workspaceLoading, setWorkspaceLoading] = useState(true);
    const [workspaceError, setWorkspaceError] = useState('');
    const [applications, setApplications] = useState([]);
    const [applicationsLoading, setApplicationsLoading] = useState(true);
    const [applicationsError, setApplicationsError] = useState('');
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [query, setQuery] = useState('');
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [deletingNow, setDeletingNow] = useState(false);
    const notify = useToast();

    const loadApplications = useCallback(async (page = 1) => {
        setApplicationsLoading(true);
        setApplicationsError('');
        try {
            const data = await getApplications(id, page);
            setApplications(data.applications);
            setPagination(data.pagination);
        } catch (error) {
            setApplicationsError(errorMessage(error, 'Could not load applications.'));
        } finally {
            setApplicationsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        api.get(`/workspaces/${id}`)
            .then(({ data }) => setWorkspace(data.data.workspace))
            .catch((error) => setWorkspaceError(errorMessage(error, 'This workspace could not be found.')))
            .finally(() => setWorkspaceLoading(false));
        loadApplications();
    }, [id, loadApplications]);

    const visibleApplications = useMemo(() => applications.filter((application) => `${application.name} ${application.description || ''}`.toLowerCase().includes(query.toLowerCase())), [applications, query]);

    const copySlug = async () => {
        try {
            await navigator.clipboard.writeText(workspace.slug);
            notify('Workspace slug copied.');
        } catch {
            notify('Could not copy the workspace slug.', 'error');
        }
    };

    const saved = async (_application, wasEditing) => {
        setCreating(false);
        setEditing(null);
        notify(wasEditing ? 'Application updated successfully.' : 'Application created successfully.');
        await loadApplications(wasEditing ? pagination.current_page : 1);
    };

    const remove = async () => {
        setDeletingNow(true);
        try {
            await deleteApplication(id, deleting.id);
            notify('Application deleted successfully.');
            setDeleting(null);
            const nextPage = applications.length === 1 && pagination.current_page > 1 ? pagination.current_page - 1 : pagination.current_page;
            await loadApplications(nextPage);
        } catch (error) {
            notify(errorMessage(error, 'Could not delete this application.'), 'error');
        } finally {
            setDeletingNow(false);
        }
    };

    if (workspaceLoading) return <div className="grid min-h-[60vh] place-items-center"><Spinner className="size-7 text-brand-600" /></div>;
    if (workspaceError) return <WorkspaceError message={workspaceError} />;

    return (
        <div>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-400"><Link to="/workspaces" className="font-medium hover:text-slate-700">Workspaces</Link><span>/</span><span className="truncate font-semibold text-slate-700">{workspace.name}</span></nav>
            <section className="relative mt-6 overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-200/50 sm:px-9 sm:py-10">
                <div className="absolute -right-16 -top-16 size-72 rounded-full bg-brand-400/15 blur-3xl" />
                <div className="relative flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-lg font-bold text-brand-200 ring-1 ring-white/10">{initials(workspace.name)}</span><div><span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-300"><span className="size-1.5 rounded-full bg-brand-300" /> {workspace.status}</span><h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">{workspace.name}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{workspace.description || 'No description has been added to this workspace.'}</p></div></div><button onClick={copySlug} className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10"><Copy size={14} /> {workspace.slug}</button></div>
            </section>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Info icon={CircleUserRound} label="Owner" value={workspace.owner?.name || 'You'} sub={workspace.owner?.email} />
                <Info icon={CalendarDays} label="Created" value={formatDate(workspace.created_at, { weekday: 'long' })} sub="Workspace creation date" />
                <Info icon={Sparkles} label="Applications" value={applicationsLoading ? '—' : pagination.total} sub="Custom business tools" />
            </div>
            <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div><h2 className="text-lg font-bold tracking-tight text-slate-950">Applications</h2><p className="mt-1 text-xs text-slate-500">Build and manage custom tools inside this workspace.</p></div>
                    <button onClick={() => setCreating(true)} className="btn-primary"><Plus size={16} /> Create application</button>
                </div>
                {!applicationsLoading && !applicationsError && applications.length > 0 && <div className="border-b border-slate-100 px-5 py-4 sm:px-6"><div className="relative max-w-sm"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input className="field py-2.5 pl-10" type="search" placeholder="Search applications..." value={query} onChange={(event) => setQuery(event.target.value)} /></div></div>}
                <div className="p-5 sm:p-6">
                    {applicationsLoading ? <div className="grid min-h-72 place-items-center"><Spinner className="size-7 text-brand-600" /></div> : applicationsError ? <ApplicationError message={applicationsError} retry={() => loadApplications(pagination.current_page)} /> : visibleApplications.length ? <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">{visibleApplications.map((application) => <ApplicationCard key={application.id} workspaceId={id} application={application} onEdit={() => setEditing(application)} onDelete={() => setDeleting(application)} />)}</div> : query ? <NoResults /> : <ApplicationEmpty create={() => setCreating(true)} />}
                    {!query && pagination.last_page > 1 && <Pagination pagination={pagination} onPage={loadApplications} loading={applicationsLoading} />}
                </div>
            </section>
            <ApplicationFormModal open={creating} workspaceId={id} onClose={() => setCreating(false)} onSaved={saved} />
            <ApplicationFormModal open={Boolean(editing)} workspaceId={id} application={editing} onClose={() => setEditing(null)} onSaved={saved} />
            <Modal open={Boolean(deleting)} onClose={deletingNow ? () => {} : () => setDeleting(null)} title={`Delete ${deleting?.name || 'application'}?`} description="This application will be permanently deleted.">
                <div className="p-6"><div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-800">This action cannot be undone. Future modules and records associated with this application would also be removed.</div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button className="btn-secondary" onClick={() => setDeleting(null)} disabled={deletingNow}>Cancel</button><button className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60" onClick={remove} disabled={deletingNow}>{deletingNow ? <Spinner /> : <><Trash2 size={16} /> Delete application</>}</button></div></div>
            </Modal>
        </div>
    );
}

function ApplicationCard({ workspaceId, application, onEdit, onDelete }) {
    return <article className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50"><div className="flex items-start justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100"><ApplicationIcon name={application.icon} /></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${application.status === 'active' ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>{application.status}</span></div><h3 className="mt-5 truncate text-lg font-bold tracking-tight text-slate-950">{application.name}</h3><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{application.description || 'No description added yet.'}</p><div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400"><CalendarDays size={14} /> Created {formatDate(application.created_at)}</div><div className="mt-4 flex items-center gap-2"><Link to={`/workspaces/${workspaceId}/applications/${application.id}`} className="btn-secondary flex-1 px-3 py-2 text-xs">Open <ArrowUpRight size={14} /></Link><button onClick={onEdit} className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900" aria-label={`Edit ${application.name}`}><Edit3 size={15} /></button><button onClick={onDelete} className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${application.name}`}><Trash2 size={15} /></button></div></article>;
}

function ApplicationEmpty({ create }) { return <div className="grid min-h-72 place-items-center px-5 py-10 text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600"><FolderPlus size={27} /></span><h3 className="mt-5 text-lg font-bold text-slate-900">No applications yet</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Applications are where you’ll build your custom business tools.</p><button onClick={create} className="btn-primary mt-6"><Plus size={16} /> Create your first application</button></div></div>; }
function ApplicationError({ message, retry }) { return <div className="grid min-h-64 place-items-center text-center"><div><p className="font-semibold text-slate-800">Unable to load applications</p><p className="mt-1 text-sm text-red-600">{message}</p><button onClick={retry} className="btn-secondary mt-5">Try again</button></div></div>; }
function NoResults() { return <div className="grid min-h-56 place-items-center text-center"><div><Search className="mx-auto text-slate-300" size={30} /><p className="mt-3 font-semibold text-slate-700">No matching applications</p><p className="mt-1 text-sm text-slate-400">Try another search term.</p></div></div>; }
function WorkspaceError({ message }) { return <div className="grid min-h-[60vh] place-items-center text-center"><div><h1 className="text-xl font-bold text-slate-900">Workspace unavailable</h1><p className="mt-2 text-sm text-slate-500">{message}</p><Link to="/workspaces" className="btn-secondary mt-6"><ArrowLeft size={16} /> Back to workspaces</Link></div></div>; }
function Info({ icon: Icon, label, value, sub }) { return <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><Icon size={19} /></span><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-bold text-slate-800">{value}</p>{sub && <p className="mt-0.5 truncate text-xs text-slate-400">{sub}</p>}</div></div>; }
function Pagination({ pagination, onPage, loading }) { return <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5"><p className="text-xs text-slate-400">Page {pagination.current_page} of {pagination.last_page} · {pagination.total} applications</p><div className="flex gap-2"><button className="btn-secondary px-3 py-2" disabled={loading || pagination.current_page === 1} onClick={() => onPage(pagination.current_page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button><button className="btn-secondary px-3 py-2" disabled={loading || pagination.current_page === pagination.last_page} onClick={() => onPage(pagination.current_page + 1)} aria-label="Next page"><ChevronRight size={16} /></button></div></div>; }
