import { CalendarDays, Columns3, FileInput, Plus, TableProperties } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { getFields } from '../api/fields';
import FieldTypeIcon from '../components/fields/FieldTypeIcon';
import Spinner from '../components/Spinner';
import { formatDate } from '../utils/format';

export default function ModuleDetailPage() {
    const { workspaceId, applicationId, moduleId } = useParams();
    const { module } = useOutletContext();
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const formPath = `/workspaces/${workspaceId}/applications/${applicationId}/modules/${moduleId}/form`;

    useEffect(() => { getFields(workspaceId, applicationId, moduleId).then(setFields).catch((requestError) => setError(errorMessage(requestError, 'Could not load this module’s fields.'))).finally(() => setLoading(false)); }, [workspaceId, applicationId, moduleId]);

    return <div><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Fields</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Define {module.name} data</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{module.description || 'Fields define the data captured by this module and the form used to collect it.'}</p></div><Link to={formPath} className="btn-primary shrink-0"><Plus size={16} /> Open form builder</Link></div>
        <div className="mt-7 grid gap-4 sm:grid-cols-3"><Stat icon={Columns3} value={loading ? '—' : fields.length} label="Fields" /><Stat icon={TableProperties} value="0" label="Records" /><Stat icon={CalendarDays} value={formatDate(module.created_at)} label="Created" small /></div>
        {loading ? <div className="grid min-h-64 place-items-center"><Spinner className="size-6 text-brand-600" /></div> : error ? <div className="mt-7 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">{error}</div> : fields.length ? <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200"><div className="hidden grid-cols-[1.3fr_1fr_.8fr_.55fr_.55fr_.55fr] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 md:grid"><span>Label</span><span>Internal name</span><span>Type</span><span>Required</span><span>Width</span><span>Status</span></div>{fields.map((field) => <div key={field.id} className="grid gap-2 border-b border-slate-100 px-4 py-4 last:border-0 md:grid-cols-[1.3fr_1fr_.8fr_.55fr_.55fr_.55fr] md:items-center md:gap-3"><span className="flex items-center gap-2 text-sm font-semibold text-slate-800"><FieldTypeIcon name={field.field_type} size={15} />{field.label}</span><code className="text-xs text-slate-500">{field.name}</code><span className="text-xs capitalize text-slate-500">{field.field_type}</span><span className="text-xs text-slate-500">{field.is_required ? 'Yes' : 'No'}</span><span className="text-xs text-slate-500">{field.width}/12</span><span className={`w-fit rounded-full px-2 py-1 text-[9px] font-bold uppercase ${field.status === 'active' ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>{field.status}</span></div>)}</div> : <section className="mt-7 grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200"><FileInput size={23} /></span><h3 className="mt-4 font-bold text-slate-800">No fields created yet</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Open the form builder to add fields, configure validation, and arrange the layout.</p><Link to={formPath} className="btn-primary mt-5"><Plus size={16} /> Open form builder</Link></div></section>}
    </div>;
}

function Stat({ icon: Icon, value, label, small = false }) { return <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4"><span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon size={17} /></span><div><p className={`${small ? 'text-sm' : 'text-2xl'} font-bold text-slate-900`}>{value}</p><p className="text-xs text-slate-400">{label}</p></div></div>; }
