import { ArrowLeft, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { getRuntimeApplication } from '../api/runtime';
import ApplicationIcon from '../components/ApplicationIcon';
import ModuleIcon from '../components/ModuleIcon';
import Spinner from '../components/Spinner';

export default function RuntimeAppLayout() {
    const { applicationId } = useParams();
    const [runtime, setRuntime] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setLoading(true);
        getRuntimeApplication(applicationId).then(setRuntime).catch((error) => setError(error.response?.status === 403 ? 'You do not have access to this application.' : 'This application could not be opened.')).finally(() => setLoading(false));
    }, [applicationId]);

    if (loading) return <div className="grid min-h-screen place-items-center bg-slate-50"><div className="text-center"><Spinner className="mx-auto size-7 text-brand-600" /><p className="mt-3 text-sm text-slate-500">Loading app...</p></div></div>;
    if (error) return <div className="grid min-h-screen place-items-center bg-slate-50 px-5 text-center"><div><h1 className="text-xl font-bold">Application unavailable</h1><p className="mt-2 text-sm text-slate-500">{error}</p><Link to="/workspaces" className="btn-secondary mt-6"><ArrowLeft size={16} /> Exit app</Link></div></div>;
    const { application, modules } = runtime;
    const base = `/apps/${application.id}`;

    return <div className="min-h-screen bg-slate-50">
        {open && <button className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation" />}
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-slate-950 text-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5"><span className="grid size-10 place-items-center rounded-xl bg-brand-500 text-slate-950"><ApplicationIcon name={application.icon} size={20} /></span><div className="min-w-0 flex-1"><p className="truncate font-bold">{application.name}</p><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Application</p></div><button className="p-2 text-slate-400 lg:hidden" onClick={() => setOpen(false)}><X size={18} /></button></div>
            <nav className="flex-1 overflow-y-auto p-4"><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Navigation</p><RuntimeLink to={base} end icon={LayoutDashboard} label="Dashboard" close={() => setOpen(false)} />
                <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Modules</p>
                {modules.map((module) => <RuntimeLink key={module.id} to={`${base}/modules/${module.id}`} icon={({ size }) => <ModuleIcon name={module.icon} size={size} />} label={module.name} close={() => setOpen(false)} />)}
                {!modules.length && <p className="px-3 py-3 text-xs leading-5 text-slate-500">No published modules are available.</p>}
            </nav>
            <div className="border-t border-white/10 p-4"><Link to={`/workspaces/${application.workspace_id}/applications/${application.id}`} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"><ArrowLeft size={16} /> Edit app</Link><Link to="/workspaces" className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-white"><LogOut size={16} /> Exit app</Link></div>
        </aside>
        <div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur sm:px-8"><button className="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden" onClick={() => setOpen(true)}><Menu size={20} /></button><div className="hidden lg:block"><p className="text-sm font-bold text-slate-900">{application.name}</p><p className="text-[10px] uppercase tracking-wider text-slate-400">Generated admin</p></div><Link to={`/workspaces/${application.workspace_id}/applications/${application.id}`} className="btn-secondary px-3 py-2 text-xs">Edit App</Link></header><main className="mx-auto max-w-[1440px] p-5 sm:p-8 lg:p-10"><Outlet context={{ ...runtime, refreshRuntime: () => getRuntimeApplication(applicationId).then(setRuntime) }} /></main></div>
    </div>;
}

function RuntimeLink({ to, icon: Icon, label, end = false, close }) { return <NavLink to={to} end={end} onClick={close} className={({ isActive }) => `mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-brand-500 text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}><Icon size={17} /> <span className="truncate">{label}</span></NavLink>; }
