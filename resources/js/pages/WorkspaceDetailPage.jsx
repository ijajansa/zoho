import { ArrowLeft, Blocks, CalendarDays, CircleUserRound, Copy, Plus, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import Spinner from '../components/Spinner';
import { useToast } from '../components/ToastProvider';
import { formatDate, initials } from '../utils/format';

export default function WorkspaceDetailPage() {
    const { id } = useParams();
    const [workspace, setWorkspace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const notify = useToast();

    const copySlug = async () => {
        try {
            await navigator.clipboard.writeText(workspace.slug);
            notify('Workspace slug copied.');
        } catch {
            notify('Could not copy the workspace slug.', 'error');
        }
    };

    useEffect(() => {
        api.get(`/workspaces/${id}`).then(({ data }) => setWorkspace(data.data.workspace)).catch((requestError) => setError(errorMessage(requestError, 'This workspace could not be found.'))).finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="grid min-h-[60vh] place-items-center"><Spinner className="size-7 text-brand-600" /></div>;
    if (error) return <div className="grid min-h-[60vh] place-items-center text-center"><div><h1 className="text-xl font-bold text-slate-900">Workspace unavailable</h1><p className="mt-2 text-sm text-slate-500">{error}</p><Link to="/workspaces" className="btn-secondary mt-6"><ArrowLeft size={16} /> Back to workspaces</Link></div></div>;

    return (
        <div>
            <Link to="/workspaces" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"><ArrowLeft size={16} /> All workspaces</Link>
            <section className="relative mt-6 overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-200/50 sm:px-9 sm:py-10">
                <div className="absolute -right-16 -top-16 size-72 rounded-full bg-brand-400/15 blur-3xl" />
                <div className="relative flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-lg font-bold text-brand-200 ring-1 ring-white/10">{initials(workspace.name)}</span><div><span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-300"><span className="size-1.5 rounded-full bg-brand-300" /> {workspace.status}</span><h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">{workspace.name}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{workspace.description || 'No description has been added to this workspace.'}</p></div></div><button onClick={copySlug} className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10"><Copy size={14} /> {workspace.slug}</button></div>
            </section>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Info icon={CircleUserRound} label="Owner" value={workspace.owner?.name || 'You'} sub={workspace.owner?.email} />
                <Info icon={CalendarDays} label="Created" value={formatDate(workspace.created_at, { weekday: 'long' })} sub="Workspace creation date" />
                <Info icon={Sparkles} label="Workspace ID" value={`#${workspace.id}`} sub="Unique internal identifier" />
            </div>
            <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><h2 className="text-lg font-bold tracking-tight text-slate-950">Applications</h2><p className="mt-1 text-xs text-slate-500">Apps created inside this workspace will appear here.</p></div><button onClick={() => notify('Application builder will be added in the next phase.')} className="btn-secondary"><Plus size={16} /> <span className="hidden sm:inline">Create application</span><span className="sm:hidden">Create</span></button></div>
                <div className="grid min-h-72 place-items-center px-6 py-12 text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Blocks size={27} /></span><h3 className="mt-5 font-bold text-slate-800">No applications created yet</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">The application builder will arrive in the next phase. Your workspace is ready when it does.</p><button onClick={() => notify('Application builder will be added in the next phase.')} className="mt-5 text-sm font-semibold text-brand-700 hover:text-brand-800">Learn what’s coming →</button></div></div>
            </section>
        </div>
    );
}

function Info({ icon: Icon, label, value, sub }) { return <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><Icon size={19} /></span><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-bold text-slate-800">{value}</p>{sub && <p className="mt-0.5 truncate text-xs text-slate-400">{sub}</p>}</div></div>; }
