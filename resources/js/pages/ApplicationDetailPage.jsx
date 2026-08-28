import { Blocks, Database, ExternalLink, Plus, TableProperties, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { getModules } from '../api/modules';
import { getRuntimeApplication } from '../api/runtime';
import { formatDate } from '../utils/format';

export default function ApplicationDetailPage() {
    const { workspace, application } = useOutletContext();
    const { workspaceId, applicationId } = useParams();
    const [moduleCount, setModuleCount] = useState(null);
    const [recordCount, setRecordCount] = useState(null);

    useEffect(() => {
        getModules(workspaceId, applicationId)
            .then((modules) => setModuleCount(modules.length))
            .catch(() => setModuleCount(0));
        getRuntimeApplication(applicationId).then((runtime) => setRecordCount(runtime.modules.reduce((total, module) => total + module.record_count, 0))).catch(() => setRecordCount(0));
    }, [workspaceId, applicationId]);

    const stats = [
        { icon: Blocks, label: 'Modules', value: moduleCount ?? '—' },
        { icon: Database, label: 'Records', value: recordCount ?? '—' },
        { icon: Users, label: 'Users', value: '1' },
    ];

    return (
        <div>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Application overview</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Build the structure behind your tool</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{application.description || 'No description has been added to this application yet.'}</p></div><Link to={`/apps/${application.id}`} className="btn-primary shrink-0"><ExternalLink size={16} /> Open App</Link></div>
            <div className="mt-7 grid gap-4 sm:grid-cols-3">{stats.map((stat) => <Metric key={stat.label} {...stat} />)}</div>
            <div className="mt-7 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
                <section className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200"><TableProperties size={24} /></span><h3 className="mt-4 font-bold text-slate-800">{moduleCount ? `${moduleCount} module${moduleCount === 1 ? '' : 's'} ready` : 'Start with your first module'}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Modules define business entities such as customers, products, orders, and employees.</p><Link to={`/workspaces/${workspaceId}/applications/${applicationId}/modules`} className="btn-primary mt-5"><Plus size={16} /> {moduleCount ? 'Manage modules' : 'Create module'}</Link></div></section>
                <section className="rounded-2xl border border-slate-200 p-5"><h3 className="font-bold text-slate-900">Application details</h3><dl className="mt-5 space-y-4"><Detail label="Status" value={application.status === 'active' ? 'Active' : 'Inactive'} /><Detail label="Workspace" value={workspace.name} /><Detail label="Created" value={formatDate(application.created_at)} /><Detail label="Slug" value={application.slug} /></dl></section>
            </div>
        </div>
    );
}

function Metric({ icon: Icon, label, value }) { return <div className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4"><span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon size={18} /></span><div><p className="text-2xl font-bold tracking-tight text-slate-950">{value}</p><p className="text-xs text-slate-400">{label}</p></div></div>; }
function Detail({ label, value }) { return <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0"><dt className="text-xs font-medium text-slate-400">{label}</dt><dd className="max-w-[65%] break-words text-right text-xs font-semibold capitalize text-slate-700">{value}</dd></div>; }
