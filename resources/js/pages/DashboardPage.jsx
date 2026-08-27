import { ArrowRight, Blocks, CalendarDays, CheckCircle2, Grid2X2, Plus, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import Spinner from '../components/Spinner';
import { formatDate, initials } from '../utils/format';

export default function DashboardPage() {
    const { user } = useAuth();
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/workspaces')
            .then(({ data }) => setWorkspaces(data.data.workspaces))
            .catch(() => setWorkspaces([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                    <p className="text-sm font-semibold text-brand-700">Overview</p>
                    <h1 className="mt-1 text-3xl font-bold tracking-[-0.04em] text-slate-950">Good to see you, {user.name.split(' ')[0]}.</h1>
                    <p className="mt-2 text-sm text-slate-500">Here’s what’s happening across your account.</p>
                </div>
                <Link to="/workspaces?create=true" className="btn-primary"><Plus size={17} /> Create workspace</Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Stat icon={Grid2X2} label="Total workspaces" value={loading ? '—' : workspaces.length} note="Active spaces" color="brand" />
                <Stat icon={Blocks} label="Applications" value="0" note="Available next phase" color="violet" />
                <Stat icon={CheckCircle2} label="Account status" value="Active" note="Everything looks good" color="blue" />
            </div>
            <div className="mt-8 grid gap-6 xl:grid-cols-[1.55fr_0.8fr]">
                <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                        <div><h2 className="font-bold text-slate-950">Recent workspaces</h2><p className="mt-1 text-xs text-slate-500">Pick up where you left off</p></div>
                        <Link to="/workspaces" className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-950">View all <ArrowRight size={15} /></Link>
                    </div>
                    <div className="p-3">
                        {loading ? <div className="grid min-h-48 place-items-center"><Spinner className="size-6 text-brand-600" /></div> : workspaces.length ? workspaces.slice(0, 4).map((workspace) => (
                            <Link key={workspace.id} to={`/workspaces/${workspace.id}`} className="flex items-center gap-4 rounded-xl p-3 transition hover:bg-slate-50">
                                <span className="grid size-11 place-items-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">{initials(workspace.name)}</span>
                                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{workspace.name}</span><span className="mt-0.5 block truncate text-xs text-slate-400">{workspace.description || 'No description added'}</span></span>
                                <span className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex"><CalendarDays size={14} /> {formatDate(workspace.created_at)}</span>
                                <ArrowRight size={16} className="text-slate-300" />
                            </Link>
                        )) : <EmptyRecent />}
                    </div>
                </section>
                <section className="relative overflow-hidden rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
                    <div className="absolute -right-12 -top-12 size-44 rounded-full bg-brand-400/20 blur-3xl" />
                    <div className="relative"><span className="grid size-10 place-items-center rounded-xl bg-white/10 text-brand-300"><Sparkles size={19} /></span><h2 className="mt-5 text-xl font-bold tracking-tight">Build your foundation</h2><p className="mt-2 text-sm leading-6 text-slate-400">Create focused workspaces now. Applications, forms, and automations are coming in the next phase.</p><Link to="/workspaces" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-300 hover:text-brand-200">Explore workspaces <ArrowRight size={16} /></Link></div>
                </section>
            </div>
        </div>
    );
}

function Stat({ icon: Icon, label, value, note, color }) {
    const palette = { brand: 'bg-brand-50 text-brand-700', violet: 'bg-violet-50 text-violet-600', blue: 'bg-blue-50 text-blue-600' };
    return <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div><span className={`grid size-11 place-items-center rounded-xl ${palette[color]}`}><Icon size={20} /></span></div></div>;
}

function EmptyRecent() {
    return <div className="grid min-h-48 place-items-center px-5 py-8 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Grid2X2 size={20} /></span><p className="mt-3 text-sm font-semibold text-slate-700">No workspaces yet</p><p className="mt-1 text-xs text-slate-400">Create your first one to get started.</p></div></div>;
}
