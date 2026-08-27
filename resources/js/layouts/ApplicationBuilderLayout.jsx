import { ArrowLeft, Database, LayoutDashboard, Settings, TableProperties } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { getApplication } from '../api/applications';
import api, { errorMessage } from '../api/client';
import ApplicationIcon from '../components/ApplicationIcon';
import Spinner from '../components/Spinner';

export default function ApplicationBuilderLayout() {
    const { workspaceId, applicationId } = useParams();
    const [workspace, setWorkspace] = useState(null);
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const basePath = `/workspaces/${workspaceId}/applications/${applicationId}`;

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
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm text-slate-400"><Link to="/workspaces" className="shrink-0 font-medium hover:text-slate-700">Workspaces</Link><span>/</span><Link to={`/workspaces/${workspace.id}`} className="max-w-48 truncate font-medium hover:text-slate-700">{workspace.name}</Link><span>/</span><span className="truncate font-semibold text-slate-700">{application.name}</span></nav>
            <header className="mt-6 flex flex-col justify-between gap-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6"><div className="flex min-w-0 items-center gap-4"><span className="grid size-13 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100"><ApplicationIcon name={application.icon} size={24} /></span><div className="min-w-0"><div className="flex items-center gap-2"><h1 className="truncate text-2xl font-bold tracking-[-0.035em] text-slate-950">{application.name}</h1><span className={`hidden rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:inline ${application.status === 'active' ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>{application.status}</span></div><p className="mt-1 truncate text-sm text-slate-500">{workspace.name} · Application builder</p></div></div><Link to={`/workspaces/${workspace.id}`} className="btn-secondary shrink-0"><ArrowLeft size={16} /> Back to workspace</Link></header>
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:grid lg:min-h-[580px] lg:grid-cols-[220px_1fr]">
                <aside className="border-b border-slate-200 bg-slate-50/70 p-4 lg:border-b-0 lg:border-r"><p className="px-3 pb-3 pt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Builder</p><nav className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1"><BuilderLink to={basePath} icon={LayoutDashboard} label="Overview" end /><BuilderLink to={`${basePath}/modules`} icon={TableProperties} label="Modules" /><DisabledBuilderNav icon={Database} label="Data" /><DisabledBuilderNav icon={Settings} label="Settings" /></nav><div className="mt-6 hidden rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-500 lg:block"><span className="font-semibold text-slate-700">Builder foundation</span><br />Create modules now. Fields and records arrive in future phases.</div></aside>
                <main className="p-5 sm:p-7 lg:p-9"><Outlet context={{ workspace, application }} /></main>
            </div>
        </div>
    );
}

function BuilderLink({ to, icon: Icon, label, end = false }) { return <NavLink to={to} end={end} className={({ isActive }) => `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${isActive ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}><Icon size={17} /> {label}</NavLink>; }
function DisabledBuilderNav({ icon: Icon, label }) { return <div className="flex cursor-not-allowed items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400"><Icon size={17} /> {label}<span className="ml-auto text-[8px] font-bold uppercase tracking-wider">Soon</span></div>; }
function BuilderError({ message, workspaceId }) { return <div className="grid min-h-[65vh] place-items-center text-center"><div><h1 className="text-xl font-bold text-slate-900">Application unavailable</h1><p className="mt-2 max-w-md text-sm text-slate-500">{message}</p><Link to={`/workspaces/${workspaceId}`} className="btn-secondary mt-6"><ArrowLeft size={16} /> Back to workspace</Link></div></div>; }
