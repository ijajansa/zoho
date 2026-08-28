import { ArrowUpRight, Database } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import ModuleIcon from '../components/ModuleIcon';

export default function RuntimeDashboardPage() {
    const { application, modules } = useOutletContext();
    return <div><p className="text-xs font-bold uppercase tracking-[.14em] text-brand-700">Dashboard</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Welcome back</h1><p className="mt-2 text-sm text-slate-500">Here is what is happening in {application.name}.</p>
        {modules.length ? <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{modules.map((module) => <Link key={module.id} to={`/apps/${application.id}/modules/${module.id}`} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"><div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><ModuleIcon name={module.icon} size={20} /></span><ArrowUpRight size={17} className="text-slate-300 group-hover:text-brand-600" /></div><h2 className="mt-5 font-bold text-slate-900">{module.name}</h2><p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{module.record_count.toLocaleString()}</p><p className="text-xs text-slate-400">{module.record_count === 1 ? 'record' : 'records'}</p></Link>)}</div> : <div className="mt-8 grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-center"><div><Database className="mx-auto text-slate-300" size={30} /><h2 className="mt-3 font-bold text-slate-800">No published modules</h2><p className="mt-1 text-sm text-slate-500">Publish a module schema in the builder to make it available here.</p></div></div>}
    </div>;
}
