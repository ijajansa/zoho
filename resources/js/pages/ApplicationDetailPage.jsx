import { ArrowLeft, Blocks, ChevronRight, CircleUserRound, Database, LayoutDashboard, Plus, Settings, TableProperties, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getApplication } from '../api/applications';
import api, { errorMessage } from '../api/client';
import ApplicationIcon from '../components/ApplicationIcon';
import Spinner from '../components/Spinner';
import { useToast } from '../components/ToastProvider';
import { formatDate } from '../utils/format';

export default function ApplicationDetailPage() {
    const { workspaceId, applicationId } = useParams();
    const [workspace, setWorkspace] = useState(null);
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const notify = useToast();
    const placeholderStats = [
        { icon: Blocks, label: 'Modules', value: '0' },
        { icon: Database, label: 'Records', value: '0' },
        { icon: Users, label: 'Users', value: '1' },
    ];

    useEffect(() => {
        Promise.all([
            api.get(`/workspaces/${workspaceId}`).then(({ data }) => data.data.workspace),
            getApplication(workspaceId, applicationId),
        ]).then(([workspaceData, applicationData]) => {
            setWorkspace(workspaceData);
            setApplication(applicationData);
        }).catch((requestError) => {
            const status = requestError.response?.status;
            const fallback = status === 403 ? 'You do not have access to this application.' : status === 404 ? 'This application could not be found in the selected workspace.' : 'Could not load the application builder.';
            setError(status === 403 || status === 404 ? fallback : errorMessage(requestError, fallback));
        }).finally(() => setLoading(false));
    }, [workspaceId, applicationId]);

    if (loading) return <div className="grid min-h-[65vh] place-items-center"><Spinner className="size-7 text-brand-600" /></div>;
    if (error) return <BuilderError message={error} workspaceId={workspaceId} />;

    return (
        <div>
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm text-slate-400">
                <Link to="/workspaces" className="shrink-0 font-medium hover:text-slate-700">Workspaces</Link><ChevronRight size={14} />
                <Link to={`/workspaces/${workspace.id}`} className="max-w-48 truncate font-medium hover:text-slate-700">{workspace.name}</Link><ChevronRight size={14} />
                <span className="truncate font-semibold text-slate-700">{application.name}</span>
            </nav>
            <header className="mt-6 flex flex-col justify-between gap-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
                <div className="flex min-w-0 items-center gap-4"><span className="grid size-13 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100"><ApplicationIcon name={application.icon} size={24} /></span><div className="min-w-0"><div className="flex items-center gap-2"><h1 className="truncate text-2xl font-bold tracking-[-0.035em] text-slate-950">{application.name}</h1><span className={`hidden rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:inline ${application.status === 'active' ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>{application.status}</span></div><p className="mt-1 truncate text-sm text-slate-500">{workspace.name} · Application builder</p></div></div>
                <Link to={`/workspaces/${workspace.id}`} className="btn-secondary shrink-0"><ArrowLeft size={16} /> Back to workspace</Link>
            </header>
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:grid lg:min-h-[580px] lg:grid-cols-[220px_1fr]">
                <aside className="border-b border-slate-200 bg-slate-50/70 p-4 lg:border-b-0 lg:border-r">
                    <p className="px-3 pb-3 pt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Builder</p>
                    <nav className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1">
                        <BuilderNav icon={LayoutDashboard} label="Overview" active />
                        <BuilderNav icon={TableProperties} label="Modules" />
                        <BuilderNav icon={Database} label="Data" />
                        <BuilderNav icon={Settings} label="Settings" />
                    </nav>
                    <div className="mt-6 hidden rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-500 lg:block"><span className="font-semibold text-slate-700">Builder preview</span><br />Modules, fields, and records will be enabled in the next phases.</div>
                </aside>
                <main className="p-5 sm:p-7 lg:p-9">
                    <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Application overview</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">A clean start for your next tool</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{application.description || 'No description has been added to this application yet.'}</p></div>
                    <div className="mt-7 grid gap-4 sm:grid-cols-3">{placeholderStats.map((stat) => <Metric key={stat.label} {...stat} />)}</div>
                    <div className="mt-7 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
                        <section className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200"><TableProperties size={24} /></span><h3 className="mt-4 font-bold text-slate-800">No modules created yet</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Modules will define the data and workflows inside this application.</p><button onClick={() => notify('Module builder will be added in the next phase.')} className="btn-primary mt-5"><Plus size={16} /> Create module</button></div></section>
                        <section className="rounded-2xl border border-slate-200 p-5"><h3 className="font-bold text-slate-900">Application details</h3><dl className="mt-5 space-y-4"><Detail label="Status" value={application.status === 'active' ? 'Active' : 'Inactive'} /><Detail label="Workspace" value={workspace.name} /><Detail label="Created" value={formatDate(application.created_at)} /><Detail label="Slug" value={application.slug} /></dl></section>
                    </div>
                </main>
            </div>
        </div>
    );
}

function BuilderNav({ icon: Icon, label, active = false }) { return <button type="button" disabled={!active} className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium ${active ? 'bg-slate-950 text-white shadow-sm' : 'cursor-not-allowed text-slate-400'}`}><Icon size={17} /> {label}</button>; }
function Metric({ icon: Icon, label, value }) { return <div className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4"><span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon size={18} /></span><div><p className="text-2xl font-bold tracking-tight text-slate-950">{value}</p><p className="text-xs text-slate-400">{label}</p></div></div>; }
function Detail({ label, value }) { return <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0"><dt className="text-xs font-medium text-slate-400">{label}</dt><dd className="max-w-[65%] break-words text-right text-xs font-semibold capitalize text-slate-700">{value}</dd></div>; }
function BuilderError({ message, workspaceId }) { return <div className="grid min-h-[65vh] place-items-center text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-500"><CircleUserRound size={23} /></span><h1 className="mt-4 text-xl font-bold text-slate-900">Application unavailable</h1><p className="mt-2 max-w-md text-sm text-slate-500">{message}</p><Link to={`/workspaces/${workspaceId}`} className="btn-secondary mt-6"><ArrowLeft size={16} /> Back to workspace</Link></div></div>; }
