import { Blocks } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Logo({ compact = false, className = '' }) {
    return (
        <Link to="/dashboard" className={`inline-flex items-center gap-2.5 ${className}`}>
            <span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-white shadow-sm">
                <Blocks size={18} strokeWidth={2.4} />
            </span>
            {!compact && <span className="text-[19px] font-bold tracking-[-0.04em] text-slate-950">formly</span>}
        </Link>
    );
}
