import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RuntimeBreadcrumbs({ application, module, recordTitle, tail }) {
    return <nav className="mb-6 flex min-w-0 items-center gap-1.5 text-sm text-slate-400"><Link to={`/apps/${application.id}`} className="truncate font-medium hover:text-slate-700">{application.name}</Link>{module && <><ChevronRight size={14} /><Link to={`/apps/${application.id}/modules/${module.id}`} className="truncate font-medium hover:text-slate-700">{module.name}</Link></>}{recordTitle && <><ChevronRight size={14} /><span className="truncate font-semibold text-slate-700">{recordTitle}</span></>}{tail && <><ChevronRight size={14} /><span className="font-semibold text-slate-700">{tail}</span></>}</nav>;
}
