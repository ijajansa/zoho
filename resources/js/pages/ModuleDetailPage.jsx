import { ArrowLeft, CalendarDays, Columns3, FileInput, FormInput, GitFork, List, Plus, Settings, TableProperties } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getApplication } from '../api/applications';
import api, { errorMessage } from '../api/client';
import { getModule } from '../api/modules';
import ModuleIcon from '../components/ModuleIcon';
import Spinner from '../components/Spinner';
import { useToast } from '../components/ToastProvider';
import { formatDate } from '../utils/format';

export default function ModuleDetailPage() {
    const { workspaceId, applicationId, moduleId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const notify = useToast();

    useEffect(() => {
        Promise.all([
            api.get(`/workspaces/${workspaceId}`).then(({ data: response }) => response.data.workspace),
            getApplication(workspaceId, applicationId),
            getModule(workspaceId, applicationId, moduleId),
        ]).then(([workspace, application, module]) => setData({ workspace, application, module }))
            .catch((requestError) => {
                const status = requestError.response?.status;
                const fallback = status === 403 ? 'You do not have access to this module.' : status === 404 ? 'This module could not be found in the selected application.' : 'Could not load the module builder.';
                setError(status === 403 || status === 404 ? fallback : errorMessage(requestError, fallback));
            }).finally(() => setLoading(false));
    }, [workspaceId, applicationId, moduleId]);

    if (loading) return <div className="grid min-h-[65vh] place-items-center"><Spinner className="size-7 text-brand-600" /></div>;
    if (error) return <ModuleError message={error} workspaceId={workspaceId} applicationId={applicationId} />;
    const { workspace, application, module } = data;

    return (
        <div>
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm text-slate-400"><Link to="/workspaces" className="shrink-0 font-medium hover:text-slate-700">Workspaces</Link><span>/</span><Link to={`/workspaces/${workspace.id}`} className="max-w-40 truncate font-medium hover:text-slate-700">{workspace.name}</Link><span>/</span><Link to={`/workspaces/${workspace.id}/applications/${application.id}`} className="max-w-40 truncate font-medium hover:text-slate-700">{application.name}</Link><span>/</span><span className="truncate font-semibold text-slate-700">{module.name}</span></nav>
            <header className="mt-6 flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6"><div className="flex min-w-0 items-center gap-4"><span className="grid size-13 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100"><ModuleIcon name={module.icon} size={24} /></span><div className="min-w-0"><div className="flex items-center gap-2"><h1 className="truncate text-2xl font-bold tracking-tight text-slate-950">{module.name}</h1><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${module.status === 'active' ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>{module.status}</span></div><p className="mt-1 truncate text-sm text-slate-500">{application.name} · Module builder</p></div></div><Link to={`/workspaces/${workspaceId}/applications/${applicationId}/modules`} className="btn-secondary"><ArrowLeft size={16} /> Back to modules</Link></header>
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid lg:min-h-[580px] lg:grid-cols-[220px_1fr]">
                <aside className="border-b border-slate-200 bg-slate-50/70 p-4 lg:border-b-0 lg:border-r"><p className="px-3 pb-3 pt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Module builder</p><nav className="grid grid-cols-2 gap-1 sm:grid-cols-5 lg:grid-cols-1"><ModuleNav icon={Columns3} label="Fields" active /><ModuleNav icon={FormInput} label="Form" /><ModuleNav icon={List} label="List view" /><ModuleNav icon={GitFork} label="Relationships" /><ModuleNav icon={Settings} label="Settings" /></nav></aside>
                <main className="p-5 sm:p-7 lg:p-9"><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Module overview</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Shape how {module.name} data will work</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{module.description || 'No description has been added to this module.'}</p><div className="mt-7 grid gap-4 sm:grid-cols-3"><Stat icon={Columns3} value="0" label="Fields" /><Stat icon={TableProperties} value="0" label="Records" /><Stat icon={CalendarDays} value={formatDate(module.created_at)} label="Created" small /></div><section className="mt-7 grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200"><FileInput size={23} /></span><h3 className="mt-4 font-bold text-slate-800">No fields created yet</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Fields will define the columns, validation, and forms for this module.</p><button onClick={() => notify('Field builder will be added in the next phase.')} className="btn-primary mt-5"><Plus size={16} /> Add field</button></div></section></main>
            </div>
        </div>
    );
}

function ModuleNav({ icon: Icon, label, active = false }) { return <button type="button" disabled={!active} className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium ${active ? 'bg-slate-950 text-white shadow-sm' : 'cursor-not-allowed text-slate-400'}`}><Icon size={16} /> {label}</button>; }
function Stat({ icon: Icon, value, label, small = false }) { return <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4"><span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon size={17} /></span><div><p className={`${small ? 'text-sm' : 'text-2xl'} font-bold text-slate-900`}>{value}</p><p className="text-xs text-slate-400">{label}</p></div></div>; }
function ModuleError({ message, workspaceId, applicationId }) { return <div className="grid min-h-[65vh] place-items-center text-center"><div><h1 className="text-xl font-bold text-slate-900">Module unavailable</h1><p className="mt-2 max-w-md text-sm text-slate-500">{message}</p><Link to={`/workspaces/${workspaceId}/applications/${applicationId}/modules`} className="btn-secondary mt-6"><ArrowLeft size={16} /> Back to modules</Link></div></div>; }
